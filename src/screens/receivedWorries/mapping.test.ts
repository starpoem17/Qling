import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import type { HomeWorryFeedLetter } from '../../services/homeWorryFeed';
import { mapHomeWorryFeedLetterToReceivedWorryFeedItem } from './mapping';

const now = new Date(2026, 4, 19, 12, 0, 0);

test('maps a PRD feed letter to the received-worries screen item contract', () => {
  const item = mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    id: 'delivery-1',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
    category: WORRY_CATEGORIES[1],
    createdAt: { toMillis: () => new Date(2026, 4, 19, 10, 0, 0).getTime() },
    source: 'prd_delivery',
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    hasUnread: true,
  }, { now });

  assert.deepEqual(item, {
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    category: WORRY_CATEGORIES[1],
    previewText: 'Visible worry body',
    bodyText: 'Visible worry body',
    receivedAt: {
      label: '2시간 전',
      isoValue: new Date(2026, 4, 19, 10, 0, 0).toISOString(),
    },
    isUnread: true,
  });
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
  });

  assert.equal(item?.category, WORRY_CATEGORIES[0]);
  assert.deepEqual(item?.receivedAt, { label: '수신됨' });
  assert.equal(item?.isUnread, false);
});

test('uses the first valid category from feed categories before single category fallback', () => {
  const item = mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    id: 'delivery-categories',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
    categories: ['not-valid', WORRY_CATEGORIES[5], WORRY_CATEGORIES[2]],
    category: WORRY_CATEGORIES[1],
    deliveryId: 'delivery-categories',
    worryId: 'worry-categories',
  });

  assert.equal(item?.category, WORRY_CATEGORIES[5]);
});

test('uses chat fallback before generic valid single category fallback', () => {
  const chatFallback = mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    id: 'delivery-chat',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
    categories: [],
    category: '잡담',
    deliveryId: 'delivery-chat',
    worryId: 'worry-chat',
  });
  const validSingleCategory = mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    id: 'delivery-single',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
    categories: [],
    category: WORRY_CATEGORIES[3],
    deliveryId: 'delivery-single',
    worryId: 'worry-single',
  });

  assert.equal(chatFallback?.category, '잡담');
  assert.equal(validSingleCategory?.category, WORRY_CATEGORIES[3]);
});

test('does not expose invalid category or publisher privacy fields in screen item', () => {
  const source = {
    id: 'delivery-private',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
    categories: ['invalid-category'],
    category: 'also-invalid',
    deliveryId: 'delivery-private',
    worryId: 'worry-private',
    authorUid: 'author-uid',
    recipientUid: 'recipient-uid',
    publisherNickname: '닉네임',
    senderNickname: '보낸사람',
    gender: '여성',
    age: 27,
    interests: ['학업'],
    profileMetadata: { any: true },
  } satisfies HomeWorryFeedLetter & {
    readonly publisherNickname: string;
    readonly senderNickname: string;
    readonly gender: string;
    readonly age: number;
    readonly interests: readonly string[];
    readonly profileMetadata: Record<string, boolean>;
  };

  const item = mapHomeWorryFeedLetterToReceivedWorryFeedItem(source);
  const serialized = JSON.stringify(item);

  assert.notEqual(item?.category, 'invalid-category');
  assert.notEqual(item?.category, 'also-invalid');
  for (const forbidden of ['닉네임', '보낸사람', '여성', 'author-uid', 'recipient-uid', 'interests', 'profileMetadata']) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test('formats received worry dates from the local timezone with injected now', () => {
  const base = {
    id: 'delivery-date',
    senderId: 'author-1',
    receiverId: 'recipient-1',
    originalContent: 'Original worry',
    refinedContent: 'Visible worry body',
    category: WORRY_CATEGORIES[1],
    source: 'prd_delivery',
    deliveryId: 'delivery-date',
    worryId: 'worry-date',
  } satisfies Partial<HomeWorryFeedLetter>;

  assert.equal(mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    ...base,
    createdAt: { toMillis: () => new Date(2026, 4, 19, 11, 59, 45).getTime() },
  } as HomeWorryFeedLetter, { now })?.receivedAt.label, '방금 전');
  assert.equal(mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    ...base,
    createdAt: { toMillis: () => new Date(2026, 4, 19, 11, 35, 0).getTime() },
  } as HomeWorryFeedLetter, { now })?.receivedAt.label, '25분 전');
  assert.equal(mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    ...base,
    createdAt: { toMillis: () => new Date(2026, 4, 19, 8, 0, 0).getTime() },
  } as HomeWorryFeedLetter, { now })?.receivedAt.label, '4시간 전');
  assert.equal(mapHomeWorryFeedLetterToReceivedWorryFeedItem({
    ...base,
    createdAt: { toMillis: () => new Date(2026, 4, 18, 23, 59, 0).getTime() },
  } as HomeWorryFeedLetter, { now })?.receivedAt.label, '2026-05-18');
});
