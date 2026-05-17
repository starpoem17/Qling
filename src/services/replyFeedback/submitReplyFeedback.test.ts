import test from 'node:test';
import assert from 'node:assert/strict';
import { submitReplyFeedback } from './submitReplyFeedback';
import type { ReplyFeedbackTarget } from './types';

const prdReply: ReplyFeedbackTarget = {
  id: 'reply-1',
  senderId: 'human-1',
  source: 'prd_replies',
};

test('PRD feedback uses API path', async () => {
  const calls: string[] = [];
  const result = await submitReplyFeedback({
    reply: prdReply,
    feedbackType: 'helpful',
    comment: ' 고마워요 ',
    apiClient: {
      async submitReplyFeedback(input) {
        calls.push(`${input.replyId}:${input.type}:${input.comment}`);
        return { status: 'saved', feedbackId: input.replyId, helpedCountApplied: true };
      },
    },
  });

  assert.deepEqual(result, { status: 'saved', feedbackId: 'reply-1', helpedCountApplied: true });
  assert.deepEqual(calls, ['reply-1:like: 고마워요 ']);
});

test('PRD dislike feedback maps to API dislike', async () => {
  const calls: string[] = [];
  await submitReplyFeedback({
    reply: prdReply,
    feedbackType: 'not_helpful',
    apiClient: {
      async submitReplyFeedback(input) {
        calls.push(input.type);
        return { status: 'saved', feedbackId: input.replyId, helpedCountApplied: false };
      },
    },
  });

  assert.deepEqual(calls, ['dislike']);
});

test('PRD feedback preserves API moderation rejection shape', async () => {
  const result = await submitReplyFeedback({
    reply: prdReply,
    feedbackType: 'helpful',
    comment: 'comment',
    apiClient: {
      async submitReplyFeedback() {
        return {
          status: 'rejected',
          reason: 'rejected',
          reasonCode: 'self_harm_suicide',
          userMessage: 'rejected',
          helpMessage: 'help',
          moderationLogId: 'mod1',
        };
      },
    },
  });

  assert.deepEqual(result, {
    status: 'rejected',
    reason: 'rejected',
    reasonCode: 'self_harm_suicide',
    userMessage: 'rejected',
    helpMessage: 'help',
    moderationLogId: 'mod1',
  });
});

test('PRD feedback surfaces failed API request without local mutation fallback', async () => {
  await assert.rejects(
    submitReplyFeedback({
      reply: prdReply,
      feedbackType: 'helpful',
      apiClient: {
        async submitReplyFeedback() {
          throw new Error('network_failed');
        },
      },
    }),
    /network_failed/
  );
});

test('browser feedback target does not expose helpedCount mutation input', async () => {
  const calls: unknown[] = [];
  await submitReplyFeedback({
    reply: prdReply,
    feedbackType: 'helpful',
    apiClient: {
      async submitReplyFeedback(input) {
        calls.push(input);
        return { status: 'saved', feedbackId: input.replyId, helpedCountApplied: true };
      },
    },
  });

  assert.equal(Object.hasOwn(calls[0] as Record<string, unknown>, 'helpedCount'), false);
  assert.equal(Object.hasOwn(calls[0] as Record<string, unknown>, 'helpedCountApplied'), false);
});

test('PRD feedback fails closed when API path is unavailable', async () => {
  await assert.rejects(
    submitReplyFeedback({
      reply: prdReply,
      feedbackType: 'helpful',
    }),
    /reply_feedback_api_unavailable/
  );
});

test('non-PRD feedback source is rejected', async () => {
  await assert.rejects(
    submitReplyFeedback({
      reply: { id: 'reply-1', senderId: 'human-1' },
      feedbackType: 'helpful',
      apiClient: {
        async submitReplyFeedback() {
          throw new Error('should not call api');
        },
      },
    }),
    /reply_feedback_prd_source_required/
  );
});
