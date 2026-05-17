import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import {
  mapMyGivenReplyToListItem,
  mapMyWorryToListItem,
  mapProfileToMyPageSummary,
  mapPushStatus,
  mapReceivedReplyToListItem,
} from './mapping';

test('profile mapping uses safe helpedCount fallback and visual-only motif', () => {
  const summary = mapProfileToMyPageSummary({
    nickname: '나',
    interests: [WORRY_CATEGORIES[0]],
  });
  const missing = mapProfileToMyPageSummary(null);
  const negative = mapProfileToMyPageSummary({ helpedCount: -3 });

  assert.equal(summary.helpedCount, 0);
  assert.equal(summary.helpedCountLabel, '받은 하트');
  assert.equal(summary.profileMotif.kind, 'visual-only');
  assert.equal(missing.nickname, '나');
  assert.equal(negative.helpedCount, 0);
  assert.equal(Object.hasOwn(summary, 'avatarUrl'), false);
});

test('push mapping distinguishes browser permission states', () => {
  assert.equal(mapPushStatus({ permission: 'granted' }).status, 'granted');
  assert.equal(mapPushStatus({ permission: 'denied' }).status, 'denied');
  assert.equal(mapPushStatus({ permission: 'default' }).status, 'default');
  assert.equal(mapPushStatus({ permission: 'unsupported' }).status, 'unsupported');
  assert.equal(mapPushStatus({ permission: 'granted', registrationStatus: 'registered' }).status, 'registered');
  assert.equal(mapPushStatus({ permission: 'granted', registrationStatus: 'error' }).status, 'error');
  assert.match(mapPushStatus({ permission: 'denied' }).message ?? '', /브라우저 설정/);
});

test('my-page mapping preserves canonical 워라밸 category value', () => {
  const summary = mapProfileToMyPageSummary({
    nickname: '관심사용자',
    interests: ['워라밸'],
  });

  assert.equal(WORRY_CATEGORIES.includes('워라밸'), true);
  assert.equal(summary.interests.includes('워라밸'), true);
  assert.equal(summary.interests.includes('워라벨' as never), false);
});

test('reply and worry read models map to list props without example labels', () => {
  const reply = {
    id: 'reply-1',
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    content: 'raw',
    createdAt: null,
    source: 'prd_replies',
    senderId: 'sender',
    receiverId: 'receiver',
    originalContent: 'original',
    refinedContent: 'refined',
    isRead: false,
    hasUnread: true,
    feedback: 'helpful',
    isExampleReply: true,
  } as const;
  const answerItem = mapMyGivenReplyToListItem(reply);
  const receivedItem = mapReceivedReplyToListItem(reply);
  const worryItem = mapMyWorryToListItem({
    worry: {
      id: 'worry-1',
      authorUid: 'user-1',
      content: 'content',
      categories: [WORRY_CATEGORIES[1]],
      createdAt: null,
      unreadReplyCount: 1,
      hasUnreadReplies: true,
      humanReplyCount: 2,
      source: 'prd_worries',
    },
    selectedWorryId: 'worry-1',
  });

  assert.equal(answerItem.previewText, 'refined');
  assert.equal(answerItem.originalWorryPreview, 'original');
  assert.equal(answerItem.feedbackLabel, '받은 하트');
  assert.equal(answerItem.hasReceivedHeart, true);
  assert.equal(answerItem.isSelected, false);
  assert.match(answerItem.accessibilityLabel, /내가 쓴 답변 상세로 이동/);
  assert.match(answerItem.accessibilityLabel, /피드백 받은 하트/);
  assert.equal(receivedItem.hasUnread, true);
  assert.equal(worryItem.isSelected, true);
  assert.match(worryItem.accessibilityLabel, /카테고리 진로/);
  assert.match(worryItem.accessibilityLabel, /답장 2개/);
  assert.match(worryItem.accessibilityLabel, /읽지 않은 답장 있음/);
  assert.match(worryItem.accessibilityLabel, /현재 선택됨/);
  assert.match(receivedItem.accessibilityLabel, /받은 답장 상세로 이동/);
  assert.match(receivedItem.accessibilityLabel, /읽지 않은 답장/);
  assert.equal(Object.hasOwn(answerItem, 'exampleLabel'), false);
});
