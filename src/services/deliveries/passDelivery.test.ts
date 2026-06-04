import test from 'node:test';
import assert from 'node:assert/strict';
import { passDelivery, validatePassBody } from './passDelivery';
import type { DeliveryPassRepository } from './types';

function pushDbWithToken() {
  const logs: Record<string, unknown>[] = [];
  return {
    logs,
    collection(name: string) {
      if (name === 'pushLogs') {
        return {
          async add(data: Record<string, unknown>) {
            logs.push(data);
            return { id: `log${logs.length}` };
          },
        };
      }
      return {
        doc() {
          return {
            get: async () => ({ exists: true, data: () => ({}) }),
            collection() {
              return {
                async get() {
                  return {
                    empty: false,
                    docs: [{
                      id: 'token1',
                      data: () => ({ token: 'token1' }),
                      ref: { delete: async () => undefined },
                    }],
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

test('passDelivery returns success and records push warning when replacement push fails', async () => {
  const db = pushDbWithToken();
  let markParams: unknown = null;
  const repository: DeliveryPassRepository = {
    fetchReplacementScan: async () => ({
      candidates: [{ uid: 'replacement', interests: ['career'], activeDeliveryCount: 0 }],
      excludedUids: new Set(['author', 'passer']),
      existingHumanDeliveryCount: 1,
      replierUids: new Set(),
      author: { uid: 'author', gender: 'female' },
      matchingCategories: ['career'],
    }),
    commitPassDelivery: async ({ selectedRecipient }) => {
      assert.equal(selectedRecipient?.uid, 'replacement');
      return {
        status: 'passed',
        deliveryId: 'delivery1',
        replacementDeliveryId: 'worry1_replacement',
        replacementStatus: 'created',
        attemptId: 'delivery1',
        warnings: [],
      };
    },
    markReplacementPushResult: async params => {
      markParams = params;
    },
  };

  const result = await passDelivery({
    db: db as never,
    messaging: {
      send: async () => {
        throw new Error('push down');
      },
    } as never,
    uid: 'passer',
    deliveryId: 'delivery1',
    repository,
    random: () => 0,
  });

  assert.equal(result.status, 'passed');
  assert.equal(result.replacementStatus, 'created');
  assert.equal(db.logs[0]?.kind, 'new_worry');
  assert.equal(db.logs[0]?.sourceReason, 'pass_replacement');
  assert.equal(db.logs[0]?.status, 'failed');
  assert.deepEqual(markParams, {
    attemptId: 'delivery1',
    status: 'failed',
    logIds: ['log1'],
    warnings: ['replacement_push_failed'],
  });
});

test('passDelivery tries ranked candidates until one commits or writes shortfall', async () => {
  const attempted: Array<string | null> = [];
  const repository: DeliveryPassRepository = {
    fetchReplacementScan: async () => ({
      candidates: [
        { uid: 'first', interests: ['career'], activeDeliveryCount: 0 },
        { uid: 'second', interests: ['career'], activeDeliveryCount: 0 },
      ],
      excludedUids: new Set(['author', 'passer']),
      existingHumanDeliveryCount: 1,
      replierUids: new Set(),
      author: { uid: 'author', gender: 'female' },
      matchingCategories: ['career'],
    }),
    commitPassDelivery: async ({ selectedRecipient }) => {
      attempted.push(selectedRecipient?.uid ?? null);
      if (selectedRecipient?.uid === 'first') return { status: 'candidate_unavailable' };
      return {
        status: 'passed',
        deliveryId: 'delivery1',
        replacementDeliveryId: 'worry1_second',
        replacementStatus: 'created',
        attemptId: 'delivery1',
        warnings: [],
      };
    },
    markReplacementPushResult: async () => undefined,
  };

  const result = await passDelivery({
    db: {
      collection: (name: string) => ({
        doc: () => ({
          get: async () => ({ exists: true, data: () => ({}) }),
          collection: () => ({ get: async () => ({ empty: true, docs: [] }) }),
        }),
        add: async () => ({ id: `${name}-log` }),
      }),
    } as never,
    messaging: null,
    uid: 'passer',
    deliveryId: 'delivery1',
    repository,
    random: () => 0,
  });

  assert.equal(result.status, 'passed');
  assert.deepEqual(attempted, ['first', 'second']);
});

test('passDelivery uses experience matching judge and passes llmMatch to commit', async () => {
  let committedLlmMatch: unknown = null;
  const repository: DeliveryPassRepository = {
    fetchReplacementScan: async () => ({
      candidates: ['a', 'b'].map(uid => ({
        uid,
        gender: 'female',
        interests: ['취업'],
        helpedCount: 1,
        activeDeliveryCount: 0,
        profileStatus: 'validated',
        experienceProfile: {
          topicScores: { '취업': 1, '진로': 1 },
          situationScores: { '장기취준': 1 },
          answerStyleScores: { '공감': 1 },
          topTopics: ['취업', '진로'],
          topSituations: ['장기취준'],
          topAnswerStyles: ['공감'],
          profileSummary: '',
          recentPositiveSignals: [],
          safetyPenalty: 0,
        },
      })),
      excludedUids: new Set(['author', 'passer']),
      existingHumanDeliveryCount: 1,
      replierUids: new Set(),
      author: { uid: 'author', gender: 'female' },
      matchingCategories: ['취업'],
      llmAnalysis: {
        topicTags: ['취업', '진로'],
        emotionTags: ['불안'],
        situationTags: ['장기취준'],
        desiredResponse: ['공감'],
        suggestedNewTags: [],
        riskLevel: 'low',
        riskReason: '',
        matchingBrief: '취업 준비가 길어지며 불안과 좌절을 함께 느끼는 고민입니다.',
      },
    }),
    commitPassDelivery: async ({ selectedRecipient }) => {
      committedLlmMatch = selectedRecipient?.llmMatch;
      return {
        status: 'passed',
        deliveryId: 'delivery1',
        replacementDeliveryId: `worry1_${selectedRecipient?.uid}`,
        replacementStatus: 'created',
        attemptId: 'delivery1',
        warnings: [],
      };
    },
    markReplacementPushResult: async () => undefined,
  };

  const result = await passDelivery({
    db: {
      collection: (name: string) => ({
        doc: () => ({
          get: async () => ({ exists: true, data: () => ({}) }),
          collection: () => ({ get: async () => ({ empty: true, docs: [] }) }),
        }),
        add: async () => ({ id: `${name}-log` }),
      }),
    } as never,
    messaging: null,
    uid: 'passer',
    deliveryId: 'delivery1',
    repository,
    matchingJudgeProvider: async () => ({
      rankedCandidates: [
        { candidateId: 'b', reason: '더 잘 맞는 후보입니다. 추가 문장은 제거됩니다.' },
        { candidateId: 'a', reason: '다음 후보입니다.' },
      ],
    }),
  });

  assert.equal(result.status, 'passed');
  assert.deepEqual(committedLlmMatch, {
    tier: 'A',
    rank: 1,
    reason: '더 잘 맞는 후보입니다.',
    retrievalScore: 8,
    topicOverlap: 2,
    situationOverlap: 1,
    answerStyleOverlap: 1,
  });
});

test('validatePassBody accepts absent or empty object and rejects non-empty non-object values', () => {
  assert.deepEqual(validatePassBody(undefined), { status: 'ok' });
  assert.deepEqual(validatePassBody({}), { status: 'ok' });

  for (const body of [{ uid: 'x' }, null, [], 'x', 1, false]) {
    assert.equal(validatePassBody(body).status, 'invalid');
  }
});
