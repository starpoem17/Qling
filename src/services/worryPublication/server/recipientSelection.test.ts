import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isEligiblePhase1HumanCandidate,
  selectInitialExperienceRecipients,
  selectInitialWorryRecipients,
} from './recipientSelection';
import type { Phase1HumanCandidate } from './types';
import type { ConcernAnalysis } from '../../matching/server/concernAnalysis';
import type { ExperienceProfile } from '../../matching/server/experienceProfile';

const candidate = (
  uid: string,
  overrides: Partial<Phase1HumanCandidate> = {}
): Phase1HumanCandidate => ({
  uid,
  gender: 'female',
  interests: ['취업'],
  helpedCount: 1,
  ...overrides,
});

const experienceCandidate = (
  uid: string,
  overrides: Partial<Phase1HumanCandidate> = {}
): Phase1HumanCandidate => candidate(uid, {
  profileStatus: 'validated',
  experienceProfile: {
    topicScores: { '취업': 1 },
    situationScores: { '장기취준': 1 },
    answerStyleScores: { '공감': 1 },
    topTopics: ['취업'],
    topSituations: ['장기취준'],
    topAnswerStyles: ['공감'],
    profileSummary: '',
    recentPositiveSignals: [],
    safetyPenalty: 0,
  },
  ...overrides,
});

const concern: ConcernAnalysis = {
  topicTags: ['취업'],
  emotionTags: ['불안'],
  situationTags: ['장기취준'],
  desiredResponse: ['공감'],
  suggestedNewTags: [],
  riskLevel: 'low' as const,
  riskReason: '',
  matchingBrief: '취업 준비가 길어지며 공감 답변이 필요한 상황입니다.',
};

test('selects exactly 5 recipients with 4 matched and 1 random', () => {
  const result = selectInitialWorryRecipients({
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    candidates: ['a', 'b', 'c', 'd', 'e', 'f'].map(uid => candidate(uid)),
    matchingCategories: ['취업'],
    random: () => 0.1,
  });

  assert.equal(result.status, 'selected');
  if (result.status !== 'selected') return;
  assert.equal(result.recipients.length, 5);
  assert.equal(result.recipients.filter(r => r.selectionType === 'matched').length, 4);
  assert.equal(result.recipients.filter(r => r.selectionType === 'random').length, 1);
});

test('selects empty list when no eligible recipients exist', () => {
  const result = selectInitialWorryRecipients({
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    candidates: [],
    matchingCategories: ['취업'],
    random: () => 0,
  });

  assert.equal(result.status, 'selected');
  assert.deepEqual(result.recipients, []);
});

test('selects all 1-4 eligible recipients as matched with sequential slots', () => {
  for (const count of [1, 4]) {
    const result = selectInitialWorryRecipients({
      author: { uid: 'author', gender: 'female', interests: ['취업'] },
      candidates: ['a', 'b', 'c', 'd'].slice(0, count).map(uid => candidate(uid)),
      matchingCategories: ['취업'],
      random: () => 0,
    });

    assert.equal(result.status, 'selected');
    assert.equal(result.recipients.length, count);
    assert.equal(result.recipients.every(recipient => recipient.selectionType === 'matched'), true);
    assert.deepEqual(result.recipients.map(recipient => recipient.slotIndex), Array.from({ length: count }, (_, index) => index));
  }
});

test('selected recipients are unique for partial and full selections', () => {
  for (const count of [0, 1, 4, 5, 8]) {
    const result = selectInitialWorryRecipients({
      author: { uid: 'author', gender: 'female', interests: ['취업'] },
      candidates: Array.from({ length: count }, (_, index) => candidate(`u${index}`)),
      matchingCategories: ['취업'],
      random: () => 0.2,
    });

    assert.equal(result.status, 'selected');
    assert.equal(new Set(result.recipients.map(recipient => recipient.uid)).size, result.recipients.length);
    assert.equal(result.recipients.length, Math.min(count, 5));
  }
});

test('excludes author, deleted, inactive, disabled, bots, and over-limit users', () => {
  const authorUid = 'author';
  const excluded = [
    candidate(authorUid),
    candidate('deleted', { deleted: true }),
    candidate('status-deleted', { status: 'deleted' }),
    candidate('inactive', { inactive: true }),
    candidate('disabled', { disabled: true }),
    candidate('bot_id', { uid: 'bot_1' }),
    candidate('isbot', { isBot: true }),
    candidate('typebot', { type: 'bot' }),
    candidate('overlimit', { activeDeliveryCount: 10 }),
  ];

  assert.deepEqual(
    excluded.map(item => isEligiblePhase1HumanCandidate(item, authorUid)),
    excluded.map(() => false)
  );
});

test('missing deleted and activeDeliveryCount are allowed', () => {
  assert.equal(isEligiblePhase1HumanCandidate(candidate('ok'), 'author'), true);
});

test('same-gender tie-breaker applies after overlap and helped count', () => {
  const result = selectInitialWorryRecipients({
    author: { uid: 'author', gender: 'female', interests: [] },
    candidates: [
      candidate('low-overlap', { interests: [], helpedCount: 99, gender: 'female' }),
      candidate('higher-overlap', { interests: ['취업'], helpedCount: 0, gender: 'male' }),
      candidate('helped', { interests: ['취업'], helpedCount: 10, gender: 'male' }),
      candidate('same-gender', { interests: ['취업'], helpedCount: 10, gender: 'female' }),
      candidate('filler1', { interests: [], helpedCount: 0 }),
      candidate('filler2', { interests: [], helpedCount: 0 }),
    ],
    matchingCategories: ['취업'],
    random: () => 0.5,
  });

  assert.equal(result.status, 'selected');
  if (result.status !== 'selected') return;
  assert.equal(result.recipients[0].uid, 'same-gender');
  assert.equal(result.recipients[1].uid, 'helped');
  assert.equal(result.recipients[2].uid, 'higher-overlap');
});

test('experience selection uses retrieval tiers and stores llmMatch snapshots', async () => {
  const richConcern: ConcernAnalysis = {
    ...concern,
    topicTags: ['취업', '진로'],
  };
  const tierAProfile: Partial<ExperienceProfile> = {
    topicScores: { '취업': 1, '진로': 1 },
    situationScores: { '장기취준': 1 },
    answerStyleScores: { '공감': 1 },
    topTopics: ['취업', '진로'],
    topSituations: ['장기취준'],
    topAnswerStyles: ['공감'],
    profileSummary: '',
    recentPositiveSignals: [],
    safetyPenalty: 0,
  };

  const result = await selectInitialExperienceRecipients({
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    candidates: [
      experienceCandidate('a1', { helpedCount: 1, experienceProfile: tierAProfile }),
      experienceCandidate('a2', { helpedCount: 2, experienceProfile: tierAProfile }),
      experienceCandidate('b1', {
        profileStatus: 'light',
        experienceProfile: tierAProfile,
      }),
      experienceCandidate('c1', {
        experienceProfile: { topicScores: { '취업': 1 }, situationScores: {}, answerStyleScores: {}, topTopics: ['취업'], topSituations: [], topAnswerStyles: [], profileSummary: '', recentPositiveSignals: [], safetyPenalty: 0 },
      }),
      experienceCandidate('x1', { profileStatus: 'cold_start', experienceProfile: {} }),
    ],
    concern: richConcern,
    matchingCategories: ['취업'],
    matchingJudgeProvider: async () => ({
      rankedCandidates: [
        { candidateId: 'b1', reason: 'B 후보를 먼저 평가했습니다. 두 번째 문장은 제거됩니다.' },
        { candidateId: 'a2', reason: 'A 후보입니다.' },
        { candidateId: 'x1', reason: '탐색 후보입니다.' },
        { candidateId: 'a1', reason: 'A 후보입니다.' },
        { candidateId: 'c1', reason: 'C 후보입니다.' },
      ],
    }),
  });

  assert.equal(result.status, 'selected');
  assert.deepEqual(result.recipients.map(recipient => recipient.uid), ['a2', 'a1', 'b1', 'c1', 'x1']);
  assert.equal(result.recipients.every(recipient => recipient.selectionType === 'matched'), true);
  assert.deepEqual(result.recipients.map(recipient => recipient.slotIndex), [0, 1, 2, 3, 4]);
  assert.deepEqual(result.recipients.map(recipient => recipient.llmMatch?.tier), ['A', 'A', 'B', 'C', 'Exploration']);
  assert.deepEqual(result.recipients.map(recipient => recipient.llmMatch?.rank), [2, 4, 1, 5, 3]);
  assert.equal(result.recipients[2].llmMatch?.reason, 'B 후보를 먼저 평가했습니다.');
});

test('experience selection falls back to deterministic rank when judge is absent or fails', async () => {
  for (const matchingJudgeProvider of [
    undefined,
    async () => { throw new Error('judge down'); },
  ]) {
    const result = await selectInitialExperienceRecipients({
      author: { uid: 'author', gender: 'female', interests: ['취업'] },
      candidates: [
        experienceCandidate('lower', { helpedCount: 1 }),
        experienceCandidate('higher', { helpedCount: 10 }),
        experienceCandidate('cold', { profileStatus: 'cold_start', experienceProfile: {} }),
      ],
      concern,
      matchingCategories: ['취업'],
      matchingJudgeProvider,
    });

    assert.equal(result.status, 'selected');
    assert.deepEqual(result.recipients.map(recipient => recipient.uid), ['higher', 'lower', 'cold']);
    assert.deepEqual(result.recipients.map(recipient => recipient.llmMatch?.rank), [1, 2, 3]);
  }
});

test('experience selection fills under-delivery with legacy recipients', async () => {
  const result = await selectInitialExperienceRecipients({
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    candidates: [
      experienceCandidate('cold', { profileStatus: 'cold_start', experienceProfile: {} }),
      candidate('legacy1', { interests: ['취업'], helpedCount: 5, profileStatus: 'light' }),
      candidate('legacy2', { interests: ['취업'], helpedCount: 4, profileStatus: 'light' }),
      candidate('legacy3', { interests: ['기타'], helpedCount: 3, profileStatus: 'light' }),
      candidate('legacy4', { interests: ['기타'], helpedCount: 2, profileStatus: 'light' }),
      candidate('legacy5', { interests: ['기타'], helpedCount: 1, profileStatus: 'light' }),
    ],
    concern,
    matchingCategories: ['취업'],
    random: () => 0,
  });

  assert.equal(result.status, 'selected');
  assert.equal(result.recipients.length, 5);
  assert.equal(result.recipients[0].uid, 'cold');
  assert.equal(result.recipients[0].llmMatch?.tier, 'Exploration');
  assert.deepEqual(result.recipients.map(recipient => recipient.slotIndex), [0, 1, 2, 3, 4]);
  assert.equal(result.recipients.slice(1).every(recipient => recipient.llmMatch === undefined), true);
  assert.equal(new Set(result.recipients.map(recipient => recipient.uid)).size, 5);
});
