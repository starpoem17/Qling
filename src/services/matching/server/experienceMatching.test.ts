import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConcernAnalysis } from './concernAnalysis';
import { calculateRetrievalScore, classifyMatchingTier, retrieveExperienceCandidates } from './candidateRetrieval';
import { createInitialExperienceProfile, isTrustedExperienceProfile, normalizeExperienceProfile } from './experienceProfile';
import { mapInterestsToExperienceTopics } from './interestTopicMapping';
import { normalizeMatchingJudgeResult } from './llmJudge';
import { selectFinalExperienceRecipients } from './postProcessing';

const validBrief = '취업 준비가 길어지며 불안과 좌절을 함께 느끼는 고민입니다.';

test('normalizes concern analysis with ontology limits and rejects invalid brief', () => {
  const normalized = normalizeConcernAnalysis({
    topicTags: ['취업', '진로', '경제', '없는태그'],
    emotionTags: ['불안', '좌절', '분노'],
    situationTags: ['장기취준', '서류탈락', '면접실패', '이직고민'],
    desiredResponse: ['공감', '현실조언', '격려'],
    suggestedNewTags: ['  새로운상황 ', '새로운상황', ''],
    riskLevel: 'medium',
    riskReason: '추가 확인 필요',
    matchingBrief: validBrief,
  });

  assert.equal(normalized.status, 'valid');
  if (normalized.status !== 'valid') return;
  assert.deepEqual(normalized.analysis.topicTags, ['취업', '진로', '경제']);
  assert.deepEqual(normalized.analysis.emotionTags, ['불안', '좌절']);
  assert.deepEqual(normalized.analysis.situationTags, ['장기취준', '서류탈락', '면접실패']);
  assert.deepEqual(normalized.analysis.desiredResponse, ['공감', '현실조언']);
  assert.deepEqual(normalized.analysis.suggestedNewTags, ['새로운상황']);
  assert.equal(normalized.analysis.riskLevel, 'medium');

  assert.deepEqual(
    normalizeConcernAnalysis({ matchingBrief: '짧음' }),
    { status: 'invalid', code: 'invalid_matching_brief' },
  );
});

test('creates cold-start experience profile from onboarding topics', () => {
  const profile = createInitialExperienceProfile(['취업', '학업']);

  assert.deepEqual(profile.topicScores, { '취업': 1, '학업': 1 });
  assert.deepEqual(profile.topTopics, ['취업', '학업']);
  assert.deepEqual(profile.situationScores, {});
  assert.equal(profile.safetyPenalty, 0);
});

test('normalizes stored experience profile top tags against the v1 ontology', () => {
  const storedProfile = {
    topicScores: { '취업': 1, '없는주제': 2 },
    situationScores: { '장기취준': 1 },
    answerStyleScores: { '공감': 1 },
    topTopics: ['없는주제' as never, '취업', '경제'],
    topSituations: ['없는상황' as never, '장기취준'],
    topAnswerStyles: ['없는스타일' as never, '공감'],
  } as unknown as Parameters<typeof normalizeExperienceProfile>[0];
  const profile = normalizeExperienceProfile(storedProfile);

  assert.deepEqual(profile.topicScores, { '취업': 1 });
  assert.deepEqual(profile.topTopics, ['취업', '경제']);
  assert.deepEqual(profile.topSituations, ['장기취준']);
  assert.deepEqual(profile.topAnswerStyles, ['공감']);
});

test('maps existing PRD interests to experience ontology topics conservatively', () => {
  assert.deepEqual(
    mapInterestsToExperienceTopics(['직장', '취업', '경제', '가족', '육아', '인간관계', '일상']),
    ['직장', '취업', '경제', '가족', '육아', '인간관계', '일상'],
  );
  assert.deepEqual(
    mapInterestsToExperienceTopics(['경제', '미래']),
    ['경제', '미래'],
  );
});

test('calculates retrieval score and classifies tiers', () => {
  assert.equal(calculateRetrievalScore({
    topicOverlap: 2,
    situationOverlap: 1,
    answerStyleOverlap: 1,
  }), 8);

  assert.equal(classifyMatchingTier({ retrievalScore: 8, profileStatus: 'validated' }), 'A');
  assert.equal(classifyMatchingTier({ retrievalScore: 8, profileStatus: 'light' }), 'B');
  assert.equal(classifyMatchingTier({ retrievalScore: 4, profileStatus: 'light' }), 'B');
  assert.equal(classifyMatchingTier({ retrievalScore: 1, profileStatus: 'validated' }), 'C');
  assert.equal(classifyMatchingTier({ retrievalScore: 0, profileStatus: 'validated' }), null);
  assert.equal(classifyMatchingTier({ retrievalScore: 0, profileStatus: 'cold_start' }), 'Exploration');
});

test('retrieves eligible candidates with tier and score ordering', () => {
  const candidates = retrieveExperienceCandidates({
    authorUid: 'author',
    concern: {
      topicTags: ['취업', '진로'],
      situationTags: ['장기취준', '면접실패'],
      desiredResponse: ['공감'],
    },
    candidates: [
      {
        uid: 'tier-b',
        profileStatus: 'light',
        helpedCount: 5,
        experienceProfile: {
          topicScores: { '취업': 2 },
          situationScores: { '장기취준': 3 },
          answerStyleScores: { '공감': 1 },
        },
      },
      {
        uid: 'tier-a',
        profileStatus: 'validated',
        helpedCount: 1,
        experienceProfile: {
          topicScores: { '취업': 2, '진로': 1 },
          situationScores: { '장기취준': 3 },
          answerStyleScores: { '공감': 1 },
        },
      },
      {
        uid: 'cold',
        profileStatus: 'cold_start',
        experienceProfile: {},
      },
      {
        uid: 'author',
        profileStatus: 'trusted',
        experienceProfile: { topicScores: { '취업': 1 } },
      },
      {
        uid: 'full',
        profileStatus: 'trusted',
        activeDeliveryCount: 10,
        experienceProfile: { topicScores: { '취업': 1 } },
      },
    ],
  });

  assert.deepEqual(candidates.map(candidate => [candidate.uid, candidate.tier, candidate.retrievalScore]), [
    ['tier-a', 'A', 8],
    ['tier-b', 'B', 6],
    ['cold', 'Exploration', 0],
  ]);
});

test('normalizes judge result by removing duplicates and unknown candidates', () => {
  const result = normalizeMatchingJudgeResult({
    rankedCandidates: [
      { candidateId: 'a', reason: '첫 번째 이유입니다. 추가 문장은 제거됩니다.' },
      { candidateId: 'missing', reason: '없는 후보입니다.' },
      { candidateId: 'a', reason: '중복입니다.' },
      { candidateId: 'b', reason: '두 번째 이유입니다' },
    ],
  }, new Set(['a', 'b']));

  assert.deepEqual(result, {
    rankedCandidates: [
      { candidateId: 'a', reason: '첫 번째 이유입니다.' },
      { candidateId: 'b', reason: '두 번째 이유입니다' },
    ],
  });
});

test('selects final recipients with tier-aware quotas while preserving judge rank within tiers', () => {
  const candidates = retrieveExperienceCandidates({
    authorUid: 'author',
    concern: {
      topicTags: ['취업', '진로'],
      situationTags: ['장기취준', '면접실패'],
      desiredResponse: ['공감'],
    },
    candidates: [
      candidate('a1', 'validated', { topics: ['취업', '진로'], situations: ['장기취준'], styles: ['공감'] }),
      candidate('a2', 'trusted', { topics: ['취업', '진로'], situations: ['면접실패'], styles: ['공감'] }),
      candidate('a3', 'validated', { topics: ['취업', '진로'], situations: ['장기취준', '면접실패'], styles: [] }),
      candidate('b1', 'light', { topics: ['취업'], situations: ['장기취준'], styles: ['공감'] }),
      candidate('b2', 'light', { topics: ['진로'], situations: ['면접실패'], styles: ['공감'] }),
      candidate('c1', 'validated', { topics: ['취업'], situations: [], styles: [] }),
      candidate('x1', 'cold_start', { topics: [], situations: [], styles: [] }),
    ],
  });

  const selected = selectFinalExperienceRecipients({
    candidates,
    judgeResult: {
      rankedCandidates: [
        { candidateId: 'b1', reason: 'B가 먼저지만 쿼터에 따라 배치됩니다.' },
        { candidateId: 'a2', reason: 'A 두 번째 후보입니다.' },
        { candidateId: 'c1', reason: 'C 후보입니다.' },
        { candidateId: 'a1', reason: 'A 첫 번째 후보입니다.' },
        { candidateId: 'b2', reason: 'B 두 번째 후보입니다.' },
        { candidateId: 'a3', reason: 'A 세 번째 후보입니다.' },
        { candidateId: 'x1', reason: '탐색 후보입니다.' },
      ],
    },
  });

  assert.deepEqual(selected.map(item => item.uid), ['a2', 'a1', 'b1', 'b2', 'c1']);
  assert.deepEqual(selected.map(item => item.tier), ['A', 'A', 'B', 'B', 'C']);
  assert.deepEqual(selected.map(item => item.llmMatch.rank), [2, 4, 1, 5, 3]);
});

test('uses one exploration candidate only when ranked tier candidates are insufficient', () => {
  const candidates = retrieveExperienceCandidates({
    authorUid: 'author',
    concern: {
      topicTags: ['취업'],
      situationTags: ['장기취준'],
      desiredResponse: ['공감'],
    },
    candidates: [
      candidate('a1', 'validated', { topics: ['취업'], situations: ['장기취준'], styles: ['공감'] }),
      candidate('b1', 'light', { topics: ['취업'], situations: ['장기취준'], styles: [] }),
      candidate('x1', 'cold_start', { topics: [], situations: [], styles: [] }),
      candidate('x2', 'cold_start', { topics: [], situations: [], styles: [] }),
    ],
  });

  const selected = selectFinalExperienceRecipients({
    candidates,
    judgeResult: {
      rankedCandidates: [
        { candidateId: 'x1', reason: '탐색 후보 1입니다.' },
        { candidateId: 'x2', reason: '탐색 후보 2입니다.' },
        { candidateId: 'a1', reason: 'A 후보입니다.' },
        { candidateId: 'b1', reason: 'B 후보입니다.' },
      ],
    },
  });

  assert.deepEqual(selected.map(item => item.uid), ['a1', 'b1', 'x1']);
});

test('trusted promotion requires helped count, safety, and recent activity', () => {
  const now = new Date('2026-06-03T00:00:00.000Z');
  assert.equal(isTrustedExperienceProfile({
    helpedCount: 10,
    safetyPenalty: 1,
    lastActiveAt: new Date('2026-05-01T00:00:00.000Z'),
    now,
  }), true);
  assert.equal(isTrustedExperienceProfile({
    helpedCount: 10,
    safetyPenalty: 2,
    lastActiveAt: new Date('2026-05-01T00:00:00.000Z'),
    now,
  }), false);
  assert.equal(isTrustedExperienceProfile({
    helpedCount: 10,
    safetyPenalty: 1,
    lastActiveAt: new Date('2025-12-01T00:00:00.000Z'),
    now,
  }), false);
});

function candidate(
  uid: string,
  profileStatus: 'cold_start' | 'light' | 'validated' | 'trusted',
  params: {
    topics: string[];
    situations: string[];
    styles: string[];
  },
) {
  return {
    uid,
    profileStatus,
    helpedCount: 0,
    experienceProfile: {
      topicScores: Object.fromEntries(params.topics.map(topic => [topic, 1])),
      situationScores: Object.fromEntries(params.situations.map(situation => [situation, 1])),
      answerStyleScores: Object.fromEntries(params.styles.map(style => [style, 1])),
    },
  };
}
