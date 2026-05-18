import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLocalDisplayDate } from './displayDate';

test('formats local display date by PRD relative-time policy', () => {
  const now = Date.UTC(2026, 4, 18, 12, 0, 0);

  assert.equal(formatLocalDisplayDate({ toMillis: () => now - 30_000 }, { now }).label, '방금 전');
  assert.equal(formatLocalDisplayDate({ toMillis: () => now - 15 * 60_000 }, { now }).label, '15분 전');
  assert.equal(formatLocalDisplayDate({ toMillis: () => now - 2 * 60 * 60_000 }, { now }).label, '2시간 전');
  assert.equal(formatLocalDisplayDate({ toMillis: () => Date.UTC(2026, 4, 17, 0, 0, 0) }, { now }).label, '2026-05-17');
});

test('uses injected timezone for date-boundary behavior', () => {
  const now = Date.UTC(2026, 4, 18, 15, 10, 0);
  const createdAt = Date.UTC(2026, 4, 18, 14, 50, 0);

  assert.equal(formatLocalDisplayDate(createdAt, { now, timeZone: 'Asia/Seoul' }).label, '2026-05-18');
  assert.equal(formatLocalDisplayDate(createdAt, { now, timeZone: 'America/Los_Angeles' }).label, '20분 전');

  const yesterdayInSeoul = Date.UTC(2026, 4, 18, 14, 55, 0);
  const justAfterMidnightSeoul = Date.UTC(2026, 4, 18, 15, 5, 0);
  assert.equal(formatLocalDisplayDate(yesterdayInSeoul, { now: justAfterMidnightSeoul, timeZone: 'Asia/Seoul' }).label, '2026-05-18');
});

test('handles invalid timestamps without throwing', () => {
  assert.deepEqual(formatLocalDisplayDate(null, { fallbackLabel: '수신됨' }), { label: '수신됨' });
  assert.deepEqual(formatLocalDisplayDate({ toMillis: () => Number.NaN }, { fallbackLabel: '작성됨' }), { label: '작성됨' });
});
