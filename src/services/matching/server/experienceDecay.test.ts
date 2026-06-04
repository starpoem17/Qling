import test from 'node:test';
import assert from 'node:assert/strict';
import { runExperienceDecay } from './experienceDecay';

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
              return { exists: store.has(docRef.path), data: () => store.get(docRef.path) };
            },
          };
        },
        where(field: string, _op: string, expected: unknown) {
          return {
            limit() {
              return this;
            },
            async get() {
              return {
                docs: [...store.entries()]
                  .filter(([path, data]) => path.startsWith(`${name}/`) && data[field] === expected)
                  .map(([path, data]) => ({ id: path.split('/').at(-1) ?? '', data: () => data })),
              };
            },
          };
        },
      };
    },
    async runTransaction<T>(callback: (transaction: unknown) => Promise<T>) {
      return callback({
        async get(docRef: { path: string }) {
          return { exists: store.has(docRef.path), data: () => store.get(docRef.path) };
        },
        set(docRef: { path: string }, data: Record<string, unknown>, options?: { merge?: boolean }) {
          store.set(docRef.path, options?.merge ? { ...(store.get(docRef.path) ?? {}), ...data } : data);
        },
      } as never);
    },
  };
}

test('experience decay recalculates profile from recent 90 day signals only', async () => {
  const now = new Date('2026-06-04T00:00:00.000Z');
  const db = createDb({
    'users/user1': {
      experienceProfileDecayPending: true,
      helpedCount: 3,
      experienceProfile: {
        topicScores: { '취업': 99 },
        topTopics: ['취업'],
        profileSummary: '기존 요약입니다.',
        profileSummaryUpdatedAt: now,
        profileSummaryTopTopicsSnapshot: ['취업'],
        profileSummaryHelpedCountSnapshot: 3,
        safetyPenalty: 99,
      },
    },
    'experienceSignals/s1': {
      uid: 'user1',
      source: 'reply_created',
      weight: 0.5,
      topicTags: ['취업'],
      situationTags: ['장기취준'],
      answerStyleTags: ['공감'],
      safetyPenaltyDelta: 0,
      signalDate: new Date('2026-06-01T00:00:00.000Z'),
    },
    'experienceSignals/s2': {
      uid: 'user1',
      source: 'like_received',
      weight: 2,
      topicTags: ['취업'],
      situationTags: ['장기취준'],
      answerStyleTags: ['공감'],
      safetyPenaltyDelta: 0,
      signalDate: new Date('2026-05-01T00:00:00.000Z'),
    },
    'experienceSignals/old': {
      uid: 'user1',
      source: 'like_received',
      weight: 2,
      topicTags: ['진로'],
      situationTags: ['진로혼란'],
      answerStyleTags: ['현실조언'],
      safetyPenaltyDelta: 0,
      signalDate: new Date('2026-02-01T00:00:00.000Z'),
    },
    'experienceSignals/penalty': {
      uid: 'user1',
      source: 'moderation_fail',
      weight: 0,
      topicTags: [],
      situationTags: [],
      answerStyleTags: [],
      safetyPenaltyDelta: 1,
      signalDate: new Date('2026-06-02T00:00:00.000Z'),
    },
  });

  const result = await runExperienceDecay({ db: db as never, now });

  assert.equal(result.recalculatedCount, 1);
  const user = db.store.get('users/user1')!;
  assert.equal(user.experienceProfileDecayPending, false);
  const profile = user.experienceProfile as Record<string, Record<string, number> | number | string[]>;
  assert.equal((profile.topicScores as Record<string, number>)['취업'], 2.5);
  assert.equal((profile.topicScores as Record<string, number>)['진로'], undefined);
  assert.equal((profile.situationScores as Record<string, number>)['장기취준'], 2.5);
  assert.equal((profile.answerStyleScores as Record<string, number>)['공감'], 2.5);
  assert.equal(profile.safetyPenalty, 1);
});
