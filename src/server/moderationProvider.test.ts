import test from 'node:test';
import assert from 'node:assert/strict';
import { judgeExperienceMatchingCandidates } from './moderationProvider';
import type { MatchingJudgeCandidateContext } from '../services/matching/server/llmJudge';

const originalFetch = globalThis.fetch;
const originalOpenAiApiKey = process.env.OPENAI_API_KEY;

function candidate(candidateId: string): MatchingJudgeCandidateContext {
  return {
    candidateId,
    tier: 'A',
    profileStatus: 'validated',
    topTopics: ['취업'],
    topicScores: { '취업': 2 },
    topSituations: ['장기취준'],
    situationScores: { '장기취준': 1 },
    topAnswerStyles: ['공감'],
    answerStyleScores: { '공감': 1 },
    profileSummary: '취업 준비 경험을 바탕으로 공감할 수 있습니다.',
    recentPositiveSignals: ['취업 고민 답변이 도움이 됨'],
    qualitySignals: {
      helpedCount: 3,
      safetyPenalty: 0,
    },
  };
}

function mockOpenAiResponses(responses: unknown[]) {
  let callCount = 0;
  const bodies: unknown[] = [];
  globalThis.fetch = (async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body ?? '{}')));
    const response = responses[Math.min(callCount, responses.length - 1)];
    callCount += 1;
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(response),
            },
          },
        ],
      }),
    } as Response;
  }) as typeof fetch;

  return {
    get callCount() {
      return callCount;
    },
    bodies,
  };
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalOpenAiApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
  }
});

test('matching judge provider returns normalized OpenAI ranking without real API call', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const mock = mockOpenAiResponses([
    {
      rankedCandidates: [
        { candidateId: 'b', reason: '비슷한 취업 경험을 바탕으로 공감할 수 있습니다.' },
        { candidateId: 'missing', reason: '없는 후보입니다.' },
        { candidateId: 'a', reason: '장기 취준 상황에 현실적인 조언을 줄 수 있습니다.' },
        { candidateId: 'b', reason: '중복 후보입니다.' },
      ],
    },
  ]);

  const result = await judgeExperienceMatchingCandidates({
    concern: {
      topicTags: ['취업'],
      emotionTags: ['불안'],
      situationTags: ['장기취준'],
      desiredResponse: ['공감'],
      suggestedNewTags: [],
      riskLevel: 'low',
      riskReason: '',
      matchingBrief: '취업 준비가 길어지며 불안을 느끼는 상황입니다.',
    },
    candidates: [candidate('a'), candidate('b')],
  });

  assert.equal(mock.callCount, 1);
  assert.deepEqual(result, {
    rankedCandidates: [
      { candidateId: 'b', reason: '비슷한 취업 경험을 바탕으로 공감할 수 있습니다.' },
      { candidateId: 'a', reason: '장기 취준 상황에 현실적인 조언을 줄 수 있습니다.' },
    ],
  });
});

test('matching judge provider retries invalid output once', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const mock = mockOpenAiResponses([
    { rankedCandidates: [{ candidateId: 'missing', reason: '없는 후보입니다.' }] },
    { rankedCandidates: [{ candidateId: 'a', reason: '취업 고민에 맞는 경험 신호가 있습니다.' }] },
  ]);

  const result = await judgeExperienceMatchingCandidates({
    concern: {
      topicTags: ['취업'],
      emotionTags: [],
      situationTags: ['장기취준'],
      desiredResponse: ['경험공유'],
      suggestedNewTags: [],
      riskLevel: 'low',
      riskReason: '',
      matchingBrief: '취업 준비 경험 공유가 필요한 고민입니다.',
    },
    candidates: [candidate('a')],
  });

  assert.equal(mock.callCount, 2);
  assert.deepEqual(result.rankedCandidates, [
    { candidateId: 'a', reason: '취업 고민에 맞는 경험 신호가 있습니다.' },
  ]);
  assert.equal(
    (mock.bodies[1] as { messages: Array<{ content: string }> }).messages[0].content.includes('This is a retry'),
    true,
  );
});

test('matching judge provider sends at most 20 candidates', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const mock = mockOpenAiResponses([
    { rankedCandidates: [{ candidateId: 'u0', reason: '가장 잘 맞는 후보입니다.' }] },
  ]);

  await judgeExperienceMatchingCandidates({
    concern: {
      topicTags: ['취업'],
      emotionTags: [],
      situationTags: [],
      desiredResponse: ['공감'],
      suggestedNewTags: [],
      riskLevel: 'low',
      riskReason: '',
      matchingBrief: '취업 관련 공감 답변이 필요한 고민입니다.',
    },
    candidates: Array.from({ length: 25 }, (_, index) => candidate(`u${index}`)),
  });

  const requestPayload = JSON.parse(
    (mock.bodies[0] as { messages: Array<{ content: string }> }).messages[1].content,
  ) as { candidates: unknown[] };

  assert.equal(requestPayload.candidates.length, 20);
});
