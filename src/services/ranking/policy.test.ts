import test from 'node:test';
import assert from 'node:assert/strict';
import { composeRankingResponse } from './policy';
import type { RankingFeedbackDoc, RankingReplyDoc, RankingUserDoc } from './types';

const users: RankingUserDoc[] = [
  { uid: 'first', nickname: 'Starpoem', helpedCount: 9999, profileColor: '#4FB8C9' },
  { uid: 'second', nickname: 'Might_Guy', helpedCount: 888 },
  { uid: 'third', nickname: 'Hangyeol', helpedCount: 77 },
  { uid: 'same-a', nickname: '가나다', helpedCount: 10 },
  { uid: 'same-b', nickname: '라마바', helpedCount: 10 },
  { uid: 'deleted', nickname: 'Deleted', helpedCount: 10000, deleted: true },
  { uid: 'inactive', nickname: 'Inactive', helpedCount: 9000, inactive: true },
  { uid: 'status-deleted', nickname: 'Gone', helpedCount: 8000, status: 'deleted' },
  { uid: 'missing-nickname', helpedCount: 7000 },
];

test('total rankings use helpedCount, exclude deleted inactive users, preserve shared ranks, and include metrics', () => {
  const result = composeRankingResponse({
    users,
    feedbacks: [
      like('first', '2026-05-01T00:00:00.000Z'),
      like('first', '2026-05-02T00:00:00.000Z'),
      like('second', '2026-04-01T00:00:00.000Z'),
      like('deleted', '2026-05-01T00:00:00.000Z'),
    ],
    replies: [
      reply('first', '2026-05-01T00:00:00.000Z'),
      reply('first', '2026-04-01T00:00:00.000Z'),
      reply('second', '2026-05-01T00:00:00.000Z'),
      reply('second', '2026-05-01T00:00:00.000Z', { status: 'hidden' }),
    ],
    viewerUid: 'second',
    now: new Date('2026-05-15T12:00:00.000Z'),
  });

  assert.deepEqual(result.total.entries.map(entry => [
    entry.rank,
    entry.uid,
    entry.heartCount,
    entry.replyCount,
    entry.adoptedCount,
  ]), [
    [1, 'first', 9999, 2, 2],
    [2, 'second', 888, 1, 1],
    [3, 'third', 77, 0, 0],
    [4, 'same-a', 10, 0, 0],
    [4, 'same-b', 10, 0, 0],
  ]);
  assert.equal(result.total.viewer?.uid, 'second');
  assert.equal(result.total.viewer?.rank, 2);
  assert.equal(result.total.viewer?.percentile, 40);
});

test('monthly rankings count KST month likes with helpedCountApplied only', () => {
  const feedbacks: RankingFeedbackDoc[] = [
    like('first', '2026-04-30T14:59:59.999Z'),
    like('first', '2026-04-30T15:00:00.000Z'),
    like('first', '2026-05-31T14:59:59.999Z'),
    like('first', '2026-05-31T15:00:00.000Z'),
    like('second', '2026-05-01T00:00:00.000Z'),
    { replierUid: 'third', type: 'dislike', helpedCountApplied: true, createdAt: new Date('2026-05-01T00:00:00.000Z') },
    { replierUid: 'third', type: 'like', helpedCountApplied: false, createdAt: new Date('2026-05-01T00:00:00.000Z') },
    like('deleted', '2026-05-01T00:00:00.000Z'),
  ];

  const result = composeRankingResponse({
    users,
    feedbacks,
    replies: [
      reply('first', '2026-04-30T15:00:00.000Z'),
      reply('first', '2026-05-31T14:59:59.999Z'),
      reply('first', '2026-05-31T15:00:00.000Z'),
      reply('second', '2026-05-01T00:00:00.000Z'),
    ],
    now: new Date('2026-05-15T12:00:00.000Z'),
  });

  assert.deepEqual(result.monthly.entries.map(entry => [
    entry.rank,
    entry.uid,
    entry.heartCount,
    entry.replyCount,
    entry.adoptedCount,
  ]), [
    [1, 'first', 2, 2, 2],
    [2, 'second', 1, 1, 1],
  ]);
});

test('rankings are capped at ten displayed users while viewer rank can be outside top ten', () => {
  const manyUsers = Array.from({ length: 17 }, (_, index) => ({
    uid: `user-${index}`,
    nickname: `사용자${index}`,
    helpedCount: 100 - index,
  }));

  const result = composeRankingResponse({
    users: manyUsers,
    feedbacks: [],
    viewerUid: 'user-14',
    now: new Date('2026-05-15T12:00:00.000Z'),
  });

  assert.equal(result.total.entries.length, 10);
  assert.equal(result.total.entries.at(-1)?.uid, 'user-9');
  assert.equal(result.total.viewer?.rank, 15);
  assert.equal(result.total.viewer?.percentile, 89);
});

test('rank deltas compare monthly to previous month and total to previous month-end reconstructed from feedbacks', () => {
  const result = composeRankingResponse({
    users: [
      { uid: 'rising', nickname: '상승', helpedCount: 4 },
      { uid: 'falling', nickname: '하락', helpedCount: 5 },
      { uid: 'steady', nickname: '유지', helpedCount: 3 },
    ],
    feedbacks: [
      like('falling', '2026-04-02T00:00:00.000Z'),
      like('falling', '2026-04-03T00:00:00.000Z'),
      like('falling', '2026-05-06T00:00:00.000Z'),
      like('rising', '2026-05-02T00:00:00.000Z'),
      like('rising', '2026-05-03T00:00:00.000Z'),
      like('rising', '2026-05-04T00:00:00.000Z'),
      like('steady', '2026-04-04T00:00:00.000Z'),
      like('steady', '2026-05-05T00:00:00.000Z'),
    ],
    viewerUid: 'rising',
    now: new Date('2026-05-15T12:00:00.000Z'),
  });

  assert.equal(result.monthly.entries.find(entry => entry.uid === 'rising')?.rankDelta, 2);
  assert.equal(result.monthly.entries.find(entry => entry.uid === 'falling')?.rankDelta, -1);
  assert.equal(result.total.viewer?.rankDelta, 1);
});

test('rankings include normalized profile color, season metadata, and legacy fallback', () => {
  const result = composeRankingResponse({
    users: [
      { uid: 'colored', nickname: '컬러', helpedCount: 2, profileColor: '#B49BE8' },
      { uid: 'legacy', nickname: '레거시', helpedCount: 1 },
    ],
    feedbacks: [],
    now: new Date('2026-05-15T12:00:00.000Z'),
  });

  assert.equal(result.total.entries[0]?.profileColor, '#B49BE8');
  assert.equal(result.total.entries[1]?.profileColor, '#FF8B3D');
  assert.deepEqual(result.season, { monthLabel: '5월 시즌', daysUntilMonthEnd: 17 });
});

function like(replierUid: string, createdAt: string): RankingFeedbackDoc {
  return {
    replierUid,
    type: 'like',
    helpedCountApplied: true,
    createdAt: new Date(createdAt),
  };
}

function reply(
  replierUid: string,
  createdAt: string,
  overrides: Partial<RankingReplyDoc> = {},
): RankingReplyDoc {
  return {
    replierUid,
    status: 'active',
    isAiGenerated: false,
    createdAt: new Date(createdAt),
    ...overrides,
  };
}
