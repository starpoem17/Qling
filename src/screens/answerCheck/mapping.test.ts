import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRepliesToAnswerCheckProps, mapWorryToAnswerCheckProps } from './mapping';
import type { MyWorryListItem, ReplyReadModelItem } from '../../services/myWorries';

const ts = (value: number) => ({ toMillis: () => value });

test('maps one worry and multiple replies without answer writer private fields', () => {
  const worry = worryItem({
    id: 'worry-1',
    content: '내 고민 본문',
    categories: ['외모'],
    authorUid: 'publisher-internal-uid',
    publisherNickname: '고민작성자닉',
    gender: 'female',
    age: 30,
    interests: ['외모'],
    profileMetadata: 'publisher-profile',
  } as never);
  const reply = replyItem({
    id: 'reply-1',
    content: '답변 본문',
    replierUid: 'answer-writer-internal-uid',
    senderId: 'answer-writer-internal-uid',
    writerNickname: '답변자닉',
    gender: 'male',
    age: 29,
    interests: ['진로'],
    profileMetadata: 'answer-profile',
  } as never);

  const mapped = {
    worry: mapWorryToAnswerCheckProps({ worry, now: new Date(2_000) }),
    replies: mapRepliesToAnswerCheckProps({ replies: [reply], now: new Date(2_000) }),
  };
  const json = JSON.stringify(mapped);

  assert.equal(mapped.worry.worryId, 'worry-1');
  assert.equal(mapped.worry.bodyText, '내 고민 본문');
  assert.equal(mapped.replies[0].replyId, 'reply-1');
  assert.equal(mapped.replies[0].bodyText, '답변 본문');
  for (const forbidden of [
    '답변자닉',
    'answer-writer-internal-uid',
    'gender',
    'age',
    'interests',
    'answer-profile',
    'publisher-profile',
  ]) {
    assert.equal(json.includes(forbidden), false);
  }
});

test('maps empty reply list to no answer cards while preserving worry props', () => {
  const mapped = mapRepliesToAnswerCheckProps({ replies: [] });

  assert.deepEqual(mapped, []);
});

test('maps local hidden reply and feedback states', () => {
  const replies = [
    replyItem({ id: 'liked', feedback: 'helpful' }),
    replyItem({ id: 'disliked', feedback: 'not_helpful' }),
    replyItem({ id: 'hidden' }),
  ];
  const mapped = mapRepliesToAnswerCheckProps({
    replies,
    hiddenReplyIds: new Set(['hidden']),
  });

  assert.deepEqual(mapped.map(reply => [reply.replyId, reply.feedbackState]), [
    ['liked', 'liked'],
    ['disliked', 'disliked'],
  ]);
});

function worryItem(overrides: Partial<MyWorryListItem>): MyWorryListItem {
  return {
    id: 'worry',
    authorUid: 'author',
    content: 'worry content',
    categories: ['잡담'],
    createdAt: ts(1),
    unreadReplyCount: 0,
    hasUnreadReplies: false,
    source: 'prd_worries',
    ...overrides,
  };
}

function replyItem(overrides: Partial<ReplyReadModelItem>): ReplyReadModelItem {
  return {
    id: 'reply',
    worryId: 'worry',
    authorUid: 'author',
    replierUid: 'replier',
    content: 'reply content',
    createdAt: ts(1),
    source: 'prd_replies',
    senderId: 'replier',
    receiverId: 'author',
    originalContent: 'worry content',
    refinedContent: 'reply content',
    replyTo: 'worry',
    isRead: true,
    ...overrides,
  };
}
