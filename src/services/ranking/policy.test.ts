import test from 'node:test';
import assert from 'node:assert/strict';
import { composeRankingResponse } from './policy';
import type { RankingFeedbackDoc, RankingUserDoc } from './types';

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

test('total rankings use helpedCount, exclude deleted inactive users, and preserve shared ranks', () => {
  const result = composeRankingResponse({
    users,
    feedbacks: [],
    now: new Date('2026-05-15T12:00:00.000Z'),
  });

  assert.deepEqual(result.total.map(entry => [entry.rank, entry.uid, entry.heartCount]), [
    [1, 'first', 9999],
    [2, 'second', 888],
    [3, 'third', 77],
    [4, 'same-a', 10],
    [4, 'same-b', 10],
  ]);
});

test('monthly rankings count KST month likes with helpedCountApplied only', () => {
  const feedbacks: RankingFeedbackDoc[] = [
    { replierUid: 'first', type: 'like', helpedCountApplied: true, createdAt: new Date('2026-04-30T14:59:59.999Z') },
    { replierUid: 'first', type: 'like', helpedCountApplied: true, createdAt: new Date('2026-04-30T15:00:00.000Z') },
    { replierUid: 'first', type: 'like', helpedCountApplied: true, createdAt: new Date('2026-05-31T14:59:59.999Z') },
    { replierUid: 'first', type: 'like', helpedCountApplied: true, createdAt: new Date('2026-05-31T15:00:00.000Z') },
    { replierUid: 'second', type: 'like', helpedCountApplied: true, createdAt: new Date('2026-05-01T00:00:00.000Z') },
    { replierUid: 'third', type: 'dislike', helpedCountApplied: true, createdAt: new Date('2026-05-01T00:00:00.000Z') },
    { replierUid: 'third', type: 'like', helpedCountApplied: false, createdAt: new Date('2026-05-01T00:00:00.000Z') },
    { replierUid: 'deleted', type: 'like', helpedCountApplied: true, createdAt: new Date('2026-05-01T00:00:00.000Z') },
  ];

  const result = composeRankingResponse({
    users,
    feedbacks,
    now: new Date('2026-05-15T12:00:00.000Z'),
  });

  assert.deepEqual(result.monthly.map(entry => [entry.rank, entry.uid, entry.heartCount]), [
    [1, 'first', 2],
    [2, 'second', 1],
  ]);
});

test('rankings are capped at fifteen displayed users', () => {
  const manyUsers = Array.from({ length: 17 }, (_, index) => ({
    uid: `user-${index}`,
    nickname: `사용자${index}`,
    helpedCount: 100 - index,
  }));

  const result = composeRankingResponse({
    users: manyUsers,
    feedbacks: [],
    now: new Date('2026-05-15T12:00:00.000Z'),
  });

  assert.equal(result.total.length, 15);
  assert.equal(result.total.at(-1)?.uid, 'user-14');
});

test('rankings include normalized profile color with legacy fallback', () => {
  const result = composeRankingResponse({
    users: [
      { uid: 'colored', nickname: '컬러', helpedCount: 2, profileColor: '#B49BE8' },
      { uid: 'legacy', nickname: '레거시', helpedCount: 1 },
    ],
    feedbacks: [],
    now: new Date('2026-05-15T12:00:00.000Z'),
  });

  assert.equal(result.total[0]?.profileColor, '#B49BE8');
  assert.equal(result.total[1]?.profileColor, '#FF8B3D');
});
