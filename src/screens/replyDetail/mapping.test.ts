import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapFeedbackToDetailState,
  mapFeedbackValueToLegacy,
  mapReplyToDetailProps,
  selectReplyForDetailRoute,
} from './mapping';
import type { ReplyReadModelItem } from '../../services/myWorries';

test('selected reply maps original worry and reply detail props', () => {
  const props = mapReplyToDetailProps({
    variant: 'received-answer-detail',
    reply: {
      id: 'reply-1',
      worryId: 'worry-1',
      content: 'raw',
      createdAt: null,
      source: 'prd_replies',
      senderId: 'sender',
      receiverId: 'receiver',
      originalContent: 'original',
      refinedContent: 'refined',
      replyToContent: 'fallback original',
      isRead: false,
      hasUnread: true,
      feedback: null,
    },
  });

  assert.equal(props.state.status, 'ready');
  assert.equal(props.originalWorry?.summaryText, 'fallback original');
  assert.equal(props.reply?.bodyText, 'refined');
});

test('feedback mapping covers submitted and legacy submit values', () => {
  assert.deepEqual(mapFeedbackToDetailState('helpful'), { status: 'submitted', value: 'like' });
  assert.deepEqual(mapFeedbackToDetailState('not_helpful'), { status: 'submitted', value: 'dislike' });
  assert.deepEqual(mapFeedbackToDetailState(null), { status: 'none' });
  assert.equal(mapFeedbackValueToLegacy('like'), 'helpful');
  assert.equal(mapFeedbackValueToLegacy('dislike'), 'not_helpful');
});

test('detail route selection uses production read model item for id-bearing received route', () => {
  const stale = replyItem({ id: 'reply-1', refinedContent: 'stale reply' });
  const fresh = replyItem({ id: 'reply-1', refinedContent: 'fresh reply' });

  assert.equal(selectReplyForDetailRoute({
    route: { route: 'received_answer_detail', worryId: 'worry-1', replyId: 'reply-1' },
    selectedReply: stale,
    productionReplies: [fresh],
    isProductionReadModelLoading: false,
  })?.refinedContent, 'fresh reply');
});

test('detail route selection returns empty when id-bearing route is missing from loaded read model', () => {
  assert.equal(selectReplyForDetailRoute({
    route: { route: 'received_answer_detail', worryId: 'worry-1', replyId: 'hidden-reply' },
    selectedReply: replyItem({ id: 'hidden-reply' }),
    productionReplies: [],
    isProductionReadModelLoading: false,
  }), null);
});

test('detail route selection can use selected reply only while production read model is loading', () => {
  const selected = replyItem({ id: 'reply-1' });

  assert.equal(selectReplyForDetailRoute({
    route: { route: 'received_answer_detail', worryId: 'worry-1', replyId: 'reply-1' },
    selectedReply: selected,
    productionReplies: [],
    isProductionReadModelLoading: true,
  }), selected);
});

test('detail route maps existing publisher comment and empty selected reply state', () => {
  const props = mapReplyToDetailProps({
    variant: 'my-answer-detail',
    reply: replyItem({
      id: 'reply-1',
      originalContent: 'source worry',
      replyToContent: 'source worry',
      refinedContent: 'my reply',
      feedback: 'helpful',
      publisherComment: '고마워요',
    }),
  });

  assert.equal(props.originalWorry?.bodyText, 'source worry');
  assert.equal(props.reply?.bodyText, 'my reply');
  assert.deepEqual(props.existingFeedback, { status: 'submitted', value: 'like' });
  assert.equal(mapReplyToDetailProps({ variant: 'received-answer-detail', reply: null }).state.status, 'empty');
});

function replyItem(overrides: Partial<ReplyReadModelItem>): ReplyReadModelItem {
  return {
    id: 'reply-1',
    worryId: 'worry-1',
    content: 'raw',
    createdAt: null,
    source: 'prd_replies',
    senderId: 'sender',
    receiverId: 'receiver',
    originalContent: 'original',
    refinedContent: 'refined',
    replyToContent: 'original',
    isRead: true,
    hasUnread: false,
    feedback: null,
    ...overrides,
  };
}
