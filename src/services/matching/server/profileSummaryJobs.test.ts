import test from 'node:test';
import assert from 'node:assert/strict';
import { runExperienceProfileSummaryJobs } from './profileSummaryJobs';

type Store = Map<string, Record<string, unknown>>;

function createDb(initial: Record<string, Record<string, unknown>>) {
  const store: Store = new Map(Object.entries(initial).map(([path, value]) => [path, structuredClone(value)]));
  const ref = (path: string) => ({ id: path.split('/').at(-1) ?? '', path });
  return {
    store,
    collection(name: string) {
      return {
        doc(id = `${name}-${store.size}`) {
          const docRef = ref(`${name}/${id}`);
          return {
            ...docRef,
            async get() {
              return {
                exists: store.has(docRef.path),
                data: () => store.get(docRef.path),
              };
            },
            async set(data: Record<string, unknown>, options?: { merge?: boolean }) {
              store.set(docRef.path, options?.merge ? { ...(store.get(docRef.path) ?? {}), ...data } : data);
            },
          };
        },
        where() {
          return this;
        },
        limit() {
          return this;
        },
        async get() {
          return {
            docs: [...store.entries()]
              .filter(([path, data]) => path.startsWith(`${name}/`) && data.status === 'queued')
              .map(([path, data]) => ({
                id: path.split('/').at(-1) ?? '',
                data: () => data,
              })),
          };
        },
      };
    },
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
      } as never);
    },
  };
}

test('profile summary job runner completes queued jobs with mock provider', async () => {
  const db = createDb({
    'experienceProfileSummaryJobs/job1': {
      uid: 'user1',
      status: 'queued',
      reason: 'stale_7d',
      attempts: 0,
    },
    'users/user1': {
      helpedCount: 3,
      profileStatus: 'light',
      experienceProfile: {
        topicScores: { '취업': 2 },
        topTopics: ['취업'],
        profileSummary: '',
        safetyPenalty: 0,
      },
    },
  });

  const result = await runExperienceProfileSummaryJobs({
    db: db as never,
    provider: async () => ({ profileSummary: '취업 고민에 경험을 바탕으로 답할 수 있어요.' }),
  });

  assert.equal(result.completedCount, 1);
  assert.equal(db.store.get('experienceProfileSummaryJobs/job1')?.status, 'completed');
  const profile = db.store.get('users/user1')?.experienceProfile as Record<string, unknown>;
  assert.equal(profile.profileSummary, '취업 고민에 경험을 바탕으로 답할 수 있어요.');
  assert.equal(profile.profileSummarySource, 'llm');
  assert.equal(profile.profileSummaryHelpedCountSnapshot, 3);
});

test('profile summary job runner marks invalid provider output failed without API calls', async () => {
  const db = createDb({
    'experienceProfileSummaryJobs/job1': { uid: 'user1', status: 'queued', reason: 'stale_7d', attempts: 0 },
    'users/user1': { experienceProfile: {} },
  });

  const result = await runExperienceProfileSummaryJobs({
    db: db as never,
    provider: async () => ({ profileSummary: '짧음' }),
  });

  assert.equal(result.failedCount, 1);
  assert.equal(db.store.get('experienceProfileSummaryJobs/job1')?.status, 'failed');
  assert.equal(db.store.get('experienceProfileSummaryJobs/job1')?.lastError, 'invalid_profile_summary');
});
