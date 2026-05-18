import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import {
  mapMyGivenReplyToListItem,
  mapMyWorryToListItem,
  mapProfileToMyPageSummary,
  mapPushStatus,
  replyCountLabelForCount,
} from './mapping';

const now = new Date(2026, 4, 19, 12, 0, 0);

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
  const worryItem = mapMyWorryToListItem({
    worry: {
      id: 'worry-1',
      authorUid: 'user-1',
      content: '01234567890123456789 extra private original',
      categories: [WORRY_CATEGORIES[1], WORRY_CATEGORIES[2]],
      createdAt: null,
      unreadReplyCount: 1,
      hasUnreadReplies: true,
      humanReplyCount: 2,
      source: 'prd_worries',
    },
  });

  assert.equal(answerItem.previewText, 'refined');
  assert.equal(answerItem.originalWorryPreview, 'original');
  assert.equal(answerItem.feedbackLabel, '받은 하트');
  assert.equal(answerItem.hasReceivedHeart, true);
  assert.equal(answerItem.isSelected, false);
  assert.match(answerItem.accessibilityLabel, /내가 쓴 답변/);
  assert.match(answerItem.accessibilityLabel, /피드백 받은 하트/);
  assert.equal(worryItem.summaryText, '01234567890123456789...');
  assert.match(worryItem.accessibilityLabel, /카테고리 진로/);
  assert.equal(worryItem.categoryLabel, WORRY_CATEGORIES[1]);
  assert.equal(worryItem.replyCountLabel, '2명이 답변했어요');
  assert.match(worryItem.accessibilityLabel, /2명이 답변했어요/);
  assert.match(worryItem.accessibilityLabel, /읽지 않은 답장 있음/);
  assert.doesNotMatch(worryItem.accessibilityLabel, /현재 선택됨/);
  assert.equal(Object.hasOwn(answerItem, 'exampleLabel'), false);
});

test('my worry mapping uses shared display date, first valid category, fallback summary, and reply-count labels', () => {
  const worry = {
    id: 'worry-1',
    authorUid: 'user-1',
    content: '01234567890123456789 extra',
    categories: ['invalid', '외로움', '취업'],
    createdAt: { toMillis: () => new Date(2026, 4, 19, 11, 55, 0).getTime() },
    unreadReplyCount: 0,
    hasUnreadReplies: false,
    humanReplyCount: 0,
    source: 'prd_worries' as const,
  };

  const item = mapMyWorryToListItem({ worry, options: { now } });

  assert.equal(item.categoryLabel, '외로움');
  assert.equal(item.createdAtLabel, '5분 전');
  assert.equal(item.summaryText, '01234567890123456789...');
  assert.equal(item.replyCountLabel, '아직 답변이 없어요.');
  assert.match(item.accessibilityLabel, /작성일 5분 전/);
});

test('my worry mapping falls back to 잡담 and keeps answer writer private data out of output', () => {
  const item = mapMyWorryToListItem({
    worry: {
      id: 'worry-privacy',
      authorUid: 'me',
      content: '개인정보 없는 요약 테스트',
      categories: ['not-a-category'],
      createdAt: null,
      unreadReplyCount: 0,
      hasUnreadReplies: false,
      humanReplyCount: 1,
      source: 'prd_worries',
      answerWriterNickname: '답변자닉',
      gender: '여성',
      age: 30,
      interests: ['취업'],
      profileMetadata: { hidden: true },
      replierUid: 'replier-1',
      replyPreview: '답변 본문 preview',
    } as never,
  });

  assert.equal(item.categoryLabel, '잡담');
  assert.equal(item.replyCountLabel, '1명이 답변했어요');
  const serialized = JSON.stringify(item);
  for (const forbidden of ['답변자닉', '여성', '30', 'replier-1', '답변 본문 preview', 'profileMetadata']) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test('my worry reply count label follows PRD zero one and many cases', () => {
  assert.equal(replyCountLabelForCount(0), '아직 답변이 없어요.');
  assert.equal(replyCountLabelForCount(1), '1명이 답변했어요');
  assert.equal(replyCountLabelForCount(7), '7명이 답변했어요');
});

test('my answer date labels use the shared local display date formatter with injected now', () => {
  const reply = {
    id: 'reply-1',
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    content: 'raw',
    source: 'prd_replies',
    senderId: 'sender',
    receiverId: 'receiver',
    originalContent: 'original',
    refinedContent: 'refined',
    isRead: false,
    hasUnread: true,
    feedback: undefined,
    isExampleReply: false,
  } as const;

  assert.equal(mapMyGivenReplyToListItem({
    ...reply,
    createdAt: { toMillis: () => new Date(2026, 4, 19, 11, 59, 30).getTime() },
  }, undefined, { now }).dateLabel, '방금 전');
  assert.equal(mapMyGivenReplyToListItem({
    ...reply,
    createdAt: { toMillis: () => new Date(2026, 4, 19, 11, 1, 0).getTime() },
  }, undefined, { now }).dateLabel, '59분 전');
  assert.equal(mapMyGivenReplyToListItem({
    ...reply,
    createdAt: { toMillis: () => new Date(2026, 4, 19, 6, 0, 0).getTime() },
  }, undefined, { now }).dateLabel, '6시간 전');
  assert.equal(mapMyGivenReplyToListItem({
    ...reply,
    createdAt: { toMillis: () => new Date(2026, 4, 18, 23, 59, 0).getTime() },
  }, undefined, { now }).dateLabel, '2026-05-18');
});
