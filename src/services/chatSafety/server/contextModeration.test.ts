import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChatContextModerationInstruction,
  buildChatContextTranscript,
  enqueueChatContextModerationJob,
  normalizeChatContextModeration,
  runChatContextModerationJobs,
  shouldRunChatContextModeration,
} from './contextModeration';

type Store = Map<string, Record<string, unknown>>;

function createDb(initial: Record<string, Record<string, unknown>>) {
  const store: Store = new Map(Object.entries(initial).map(([path, value]) => [path, structuredClone(value)]));
  const ref = (path: string) => ({ id: path.split('/').at(-1) ?? '', path });
  const collection = (name: string, parentPath?: string) => {
    const prefix = parentPath ? `${parentPath}/${name}` : name;
    return {
      doc(id = `${name}-${store.size}`) {
        const docRef = ref(`${prefix}/${id}`);
        return {
          ...docRef,
          collection(childName: string) {
            return collection(childName, docRef.path);
          },
          async get() {
            return {
              exists: store.has(docRef.path),
              data: () => store.get(docRef.path),
            };
          },
          async set(data: Record<string, unknown>, options?: { merge?: boolean }) {
            store.set(docRef.path, options?.merge ? { ...(store.get(docRef.path) ?? {}), ...data } : data);
          },
          async update(data: Record<string, unknown>) {
            store.set(docRef.path, { ...(store.get(docRef.path) ?? {}), ...data });
          },
        };
      },
      where() {
        return this;
      },
      orderBy() {
        return this;
      },
      limit() {
        return this;
      },
      limitToLast() {
        return this;
      },
      async get() {
        return {
          docs: [...store.entries()]
            .filter(([path, data]) => path.startsWith(`${prefix}/`) && path.split('/').length === prefix.split('/').length + 1 && (!('status' in data) || data.status === 'queued'))
            .map(([path, data]) => ({
              id: path.split('/').at(-1) ?? '',
              data: () => data,
            })),
        };
      },
    };
  };
  return {
    store,
    collection,
    async runTransaction<T>(callback: (transaction: unknown) => Promise<T>) {
      return callback({
        async get(docRef: { path: string }) {
          return {
            exists: store.has(docRef.path),
            data: () => store.get(docRef.path),
          };
        },
        set(docRef: { path: string }, data: Record<string, unknown>, options?: { merge?: boolean }) {
          store.set(docRef.path, options?.merge ? { ...(store.get(docRef.path) ?? {}), ...data } : data);
        },
        update(docRef: { path: string }, data: Record<string, unknown>) {
          store.set(docRef.path, { ...(store.get(docRef.path) ?? {}), ...data });
        },
      } as never);
    },
  };
}

test('chat context moderation runs at 10-message intervals only once per count', () => {
  assert.equal(shouldRunChatContextModeration({ messageCount: 9 }), false);
  assert.equal(shouldRunChatContextModeration({ messageCount: 10 }), true);
  assert.equal(shouldRunChatContextModeration({ messageCount: 10, lastModeratedMessageCount: 10 }), false);
  assert.equal(shouldRunChatContextModeration({ messageCount: 20, lastModeratedMessageCount: 10 }), true);
});

test('chat context moderation prompt explicitly avoids keyword overblocking', () => {
  const instruction = buildChatContextModerationInstruction();

  assert.match(instruction, /고소한 맛/);
  assert.match(instruction, /메이튜 쓰세요/);
  assert.match(instruction, /다오홍슈/);
  assert.match(instruction, /whole conversation context/);
});

test('chat context moderation normalizes provider output', () => {
  assert.deepEqual(normalizeChatContextModeration({ status: 'safe', reason: '문제 없음' }), {
    status: 'safe',
    reason: '문제 없음',
  });
  assert.deepEqual(normalizeChatContextModeration({ status: 'block', reason: '' }), {
    status: 'block',
    reason: '안전 기준에 맞지 않는 대화 흐름이 감지되었습니다.',
  });
  assert.deepEqual(normalizeChatContextModeration({ status: 'bad' }), { status: 'invalid' });
});

test('chat context transcript preserves chronological speaker context', () => {
  assert.equal(
    buildChatContextTranscript([
      { senderUid: 'author', content: '요즘 힘들어' },
      { senderUid: 'replier', content: '어떤 점이 제일 힘들어?' },
    ]),
    '1. author: 요즘 힘들어\n2. replier: 어떤 점이 제일 힘들어?'
  );
});

test('chat context moderation job runner completes queued job and blocks unsafe chat', async () => {
  const db = createDb({
    'chatContextModerationJobs/chat1_10': { chatId: 'chat1', messageCount: 10, status: 'queued', attempts: 0 },
    'chats/chat1': { status: 'active', lastContextModeratedMessageCount: 0 },
    'chats/chat1/messages/m1': { senderUid: 'u1', content: '계속 연락처를 물어봐' },
    'chats/chat1/messages/m2': { senderUid: 'u2', content: '외부로 나가자고 해' },
  });

  const result = await runChatContextModerationJobs({
    db: db as never,
    provider: async () => ({ status: 'block', reason: '외부 연락 유도' }),
  });

  assert.equal(result.completedCount, 1);
  assert.equal(db.store.get('chatContextModerationJobs/chat1_10')?.status, 'completed');
  assert.equal(db.store.get('chats/chat1')?.status, 'moderation_blocked');
  assert.equal(db.store.get('chats/chat1')?.moderationBlockedReason, '외부 연락 유도');
});

test('chat context moderation job runner requeues transient failures and fails after max attempts', async () => {
  const db = createDb({
    'chatContextModerationJobs/chat1_10': { chatId: 'chat1', messageCount: 10, status: 'queued', attempts: 0 },
    'chatContextModerationJobs/chat2_10': { chatId: 'chat2', messageCount: 10, status: 'queued', attempts: 2 },
    'chats/chat1': { status: 'active', lastContextModeratedMessageCount: 0 },
    'chats/chat2': { status: 'active', lastContextModeratedMessageCount: 0 },
    'chats/chat1/messages/m1': { senderUid: 'u1', content: '내용' },
    'chats/chat2/messages/m1': { senderUid: 'u1', content: '내용' },
  });

  const result = await runChatContextModerationJobs({
    db: db as never,
    provider: async () => {
      throw new Error('provider_down');
    },
  });

  assert.equal(result.requeuedCount, 1);
  assert.equal(result.failedCount, 1);
  assert.equal(db.store.get('chatContextModerationJobs/chat1_10')?.status, 'queued');
  assert.equal(db.store.get('chatContextModerationJobs/chat1_10')?.attempts, 1);
  assert.equal(db.store.get('chatContextModerationJobs/chat2_10')?.status, 'failed');
  assert.equal(db.store.get('chatContextModerationJobs/chat2_10')?.attempts, 3);
});

test('chat context moderation enqueue uses deterministic job id per message count', async () => {
  const db = createDb({});
  await db.runTransaction(async transaction => {
    enqueueChatContextModerationJob({
      db: db as never,
      transaction: transaction as never,
      chatId: 'chat1',
      messageCount: 10,
      now: 'now',
    });
  });

  assert.equal(db.store.get('chatContextModerationJobs/chat1_10')?.status, 'queued');
  assert.equal(db.store.get('chatContextModerationJobs/chat1_10')?.attempts, 0);
});
