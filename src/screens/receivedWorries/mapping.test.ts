import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import type { HomeWorryFeedLetter } from '../../services/homeWorryFeed';
import { mapHomeWorryFeedLetterToReceivedWorryFeedItem } from './mapping';

test('maps a PRD feed letter to the received-worries screen item contract', () => {
  const createdAt = Date.now() - 15 * 60 * 1000;
  const item = mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    id: 'delivery-1',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
    category: WORRY_CATEGORIES[1],
    createdAt: { toMillis: () => createdAt },
    source: 'prd_delivery',
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    hasUnread: true,
  });

  assert.deepEqual(item, {
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    category: WORRY_CATEGORIES[1],
    previewText: 'Visible worry body',
    bodyText: 'Visible worry body',
    receivedAt: {
      label: '15분 전',
      isoValue: new Date(createdAt).toISOString(),
    },
    isUnread: true,
  });
});

test('maps same-day hours and different local date through shared display formatter', () => {
  const sameDay = mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    id: 'delivery-hours',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
    category: WORRY_CATEGORIES[1],
    createdAt: { toMillis: () => Date.now() - 2 * 60 * 60 * 1000 },
    source: 'prd_delivery',
    deliveryId: 'delivery-hours',
    worryId: 'worry-hours',
  });
  const differentDate = mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    id: 'delivery-date',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
    category: WORRY_CATEGORIES[1],
    createdAt: { toMillis: () => Date.UTC(2026, 0, 2, 0, 0, 0) },
    source: 'prd_delivery',
    deliveryId: 'delivery-date',
    worryId: 'worry-date',
  });

  assert.equal(sameDay?.receivedAt.label, '2시간 전');
  assert.equal(differentDate?.receivedAt.label, '2026-01-02');
});

test('drops legacy fallback items without delivery and worry ids', () => {
  const item = mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    id: 'legacy-1',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
  });

  assert.equal(item, null);
});

test('drops answered or terminal feed letters before they reach screen props', () => {
  for (const status of ['answered', 'passed', 'hidden'] as const) {
    const item = mapHomeWorryFeedLetterToReceivedWorryFeedItem({
      id: `delivery-${status}`,
      senderId: 'author-1',
      receiverId: 'recipient-1',
      originalContent: 'Original worry',
      refinedContent: 'Visible worry body',
      category: WORRY_CATEGORIES[1],
      deliveryId: `delivery-${status}`,
      worryId: 'worry-1',
      status,
    });

    assert.equal(item, null);
  }
});

test('falls back to a valid category and stable date label for incomplete feed data', () => {
  const item = mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    id: 'delivery-1',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
    category: 'unknown-category',
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    hasUnread: false,
  } as HomeWorryFeedLetter);

  assert.equal(item?.category, WORRY_CATEGORIES[0]);
  assert.deepEqual(item?.receivedAt, { label: '수신됨' });
  assert.equal(item?.isUnread, false);
});
