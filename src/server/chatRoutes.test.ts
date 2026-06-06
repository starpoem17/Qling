import test from 'node:test';
import assert from 'node:assert/strict';
import { registerChatRoutes } from './chatRoutes';

function createRes() {
  return {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

function createDb(store: Record<string, Record<string, unknown> | undefined>) {
  return {
    collection(name: string) {
      return {
        doc(id: string) {
          return {
            get: async () => {
              const data = store[`${name}/${id}`];
              return {
                exists: data !== undefined,
                data: () => data,
              };
            },
          };
        },
        where(field: string, op: string, value: unknown) {
          return createQuery(store, name, [{ field, op, value }]);
        },
      };
    },
  };
}

function createQuery(
  store: Record<string, Record<string, unknown> | undefined>,
  collectionName: string,
  filters: Array<{ field: string; op: string; value: unknown }>
) {
  return {
    where(field: string, op: string, value: unknown) {
      return createQuery(store, collectionName, [...filters, { field, op, value }]);
    },
    async get() {
      return {
        docs: Object.entries(store)
          .filter(([path, data]) => path.startsWith(`${collectionName}/`) && data !== undefined)
          .map(([path, data]) => ({
            id: path.slice(collectionName.length + 1),
            data: () => data,
          }))
          .filter(doc => filters.every(filter => {
            assert.equal(filter.op, '==');
            return doc.data()?.[filter.field] === filter.value;
          })),
      };
    },
  };
}

function captureAnswerAdoptionRoute(options: {
  readonly uid?: string;
  readonly userData?: Record<string, unknown>;
  readonly store?: Record<string, Record<string, unknown> | undefined>;
  readonly verifyIdToken?: () => Promise<{ uid: string }>;
} = {}) {
  const handlers: Array<(req: unknown, res: unknown, next: () => void) => unknown> = [];
  const store = {
    [`users/${options.uid ?? 'viewer'}`]: options.userData ?? {},
    ...(options.store ?? {}),
  };
  const app = {
    post() {
      return undefined;
    },
    get(path: string, ...routeHandlers: typeof handlers) {
      if (path === '/api/chats/:chatId/answer-adoption') handlers.push(...routeHandlers);
    },
  };

  registerChatRoutes(app as never, {
    auth: {
      verifyIdToken: options.verifyIdToken ?? (async () => ({ uid: options.uid ?? 'viewer' })),
    } as never,
    db: createDb(store) as never,
    messaging: null,
    messageSafetyPolicy: () => ({ status: 'approved' }),
  });

  return { handlers };
}

async function callAnswerAdoptionRoute(route: ReturnType<typeof captureAnswerAdoptionRoute>) {
  const req = {
    headers: { authorization: 'Bearer token' },
    params: { chatId: 'chat-1' },
  };
  const res = createRes();
  await route.handlers[0](req, res, () => undefined);
  await route.handlers[1](req, res, () => undefined);
  return res;
}

test('chat answer adoption route requires active auth before metrics lookup', async () => {
  const missing = captureAnswerAdoptionRoute();
  const missingRes = createRes();
  await missing.handlers[0]({ headers: {}, params: { chatId: 'chat-1' } } as never, missingRes as never, () => undefined);
  assert.equal(missingRes.statusCode, 401);

  const deleted = captureAnswerAdoptionRoute({ userData: { deleted: true } });
  const deletedRes = createRes();
  await deleted.handlers[0]({ headers: { authorization: 'Bearer token' }, params: { chatId: 'chat-1' } } as never, deletedRes as never, () => undefined);
  assert.equal(deletedRes.statusCode, 403);
});

test('chat answer adoption route allows only chat participants', async () => {
  const route = captureAnswerAdoptionRoute({
    store: {
      'chats/chat-1': { participants: ['author', 'replier'] },
    },
  });

  const res = await callAnswerAdoptionRoute(route);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: { code: 'forbidden', message: 'Not authorized for this chat.' } });
});

test('chat answer adoption route returns rounded adoption rate for active human replies', async () => {
  const route = captureAnswerAdoptionRoute({
    uid: 'author',
    store: {
      'chats/chat-1': { participants: ['author', 'replier'] },
      'replies/reply-1': { replierUid: 'replier', status: 'active' },
      'replies/reply-2': { replierUid: 'replier', status: 'active' },
      'replies/reply-3': { replierUid: 'replier', status: 'active' },
      'replies/reply-4': { replierUid: 'replier', status: 'active' },
      'replies/hidden': { replierUid: 'replier', status: 'active', hiddenAt: {} },
      'replies/inactive': { replierUid: 'replier', status: 'hidden' },
      'replies/ai': { replierUid: 'replier', status: 'active', isAiGenerated: true },
      'feedbacks/reply-1': { replyId: 'reply-1', replierUid: 'replier', type: 'like', helpedCountApplied: true },
      'feedbacks/reply-2': { replyId: 'reply-2', replierUid: 'replier', type: 'like', helpedCountApplied: true },
      'feedbacks/reply-3': { replyId: 'reply-3', replierUid: 'replier', type: 'like', helpedCountApplied: true },
      'feedbacks/reply-4': { replyId: 'reply-4', replierUid: 'replier', type: 'like', helpedCountApplied: false },
      'feedbacks/hidden': { replyId: 'hidden', replierUid: 'replier', type: 'like', helpedCountApplied: true },
      'feedbacks/other': { replyId: 'other', replierUid: 'other', type: 'like', helpedCountApplied: true },
    },
  });

  const res = await callAnswerAdoptionRoute(route);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    adoptionRatePercent: 75,
    replyCount: 4,
    adoptedCount: 3,
  });
});

test('chat answer adoption route returns zero percent when opponent has no active human replies', async () => {
  const route = captureAnswerAdoptionRoute({
    uid: 'author',
    store: {
      'chats/chat-1': { participants: ['author', 'replier'] },
      'replies/ai': { replierUid: 'replier', status: 'active', isAiGenerated: true },
      'feedbacks/ai': { replyId: 'ai', replierUid: 'replier', type: 'like', helpedCountApplied: true },
    },
  });

  const res = await callAnswerAdoptionRoute(route);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    adoptionRatePercent: 0,
    replyCount: 0,
    adoptedCount: 0,
  });
});

test('chat answer adoption route returns firebase unavailable when Admin db is absent', async () => {
  const handlers: Array<(req: unknown, res: unknown) => unknown> = [];
  registerChatRoutes({
    post() {
      return undefined;
    },
    get(path: string, handler: (req: unknown, res: unknown) => unknown) {
      if (path === '/api/chats/:chatId/answer-adoption') handlers.push(handler);
    },
  } as never, {
    auth: {} as never,
    db: null,
    messaging: null,
    messageSafetyPolicy: () => ({ status: 'approved' }),
  });

  const res = createRes();
  await handlers[0]({}, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'firebase_unavailable' });
});
