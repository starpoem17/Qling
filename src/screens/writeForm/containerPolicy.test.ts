import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveReplyPublicationResult,
  resolveWorryPublicationResult,
} from './containerPolicy';

test('worry publication policy preserves rejected drafts and exposes moderation copy', () => {
  const result = resolveWorryPublicationResult({
    status: 'rejected',
    reason: 'raw reason',
    userMessage: 'blocked',
    helpMessage: 'help',
    moderationLogId: 'mod1',
  });

  assert.deepEqual(result, {
    moderation: { status: 'rejected', reason: 'blocked', helpMessage: 'help' },
    clearDraft: false,
  });
});

test('worry publication policy keeps rejected and failed copy in the write screen popup only', () => {
  const failed = resolveWorryPublicationResult({ status: 'failed', reason: 'network down' });

  assert.deepEqual(failed, {
    moderation: { status: 'failed', message: '전송 실패: network down' },
    clearDraft: false,
  });
  assert.equal(Object.hasOwn(failed, 'alertMessage'), false);
});

test('worry publication policy routes successful publication', () => {
  const published = resolveWorryPublicationResult({
    status: 'published',
    worryId: 'worry-created',
    deliveryIds: ['delivery-1'],
    moderationLogId: 'mod1',
    warnings: [],
  });

  assert.deepEqual(published, {
    moderation: { status: 'approved' },
    clearDraft: true,
    route: { route: 'write_worry_success' },
  });
});

test('reply publication policy preserves rejected or failed drafts', () => {
  const rejected = resolveReplyPublicationResult({
    status: 'rejected',
    reason: 'blocked',
    helpMessage: 'help',
  }, { deliveryId: 'delivery-1', worryId: 'worry-1' });
  const failed = resolveReplyPublicationResult({
    status: 'failed',
    reason: '답장 전송 실패',
  }, { deliveryId: 'delivery-1', worryId: 'worry-1' });

  assert.equal(rejected.clearDraft, false);
  assert.deepEqual(rejected.moderation, { status: 'rejected', reason: 'blocked', helpMessage: 'help' });
  assert.equal(rejected.alertMessage, 'blocked\n\nhelp');
  assert.equal(failed.clearDraft, false);
  assert.deepEqual(failed.moderation, { status: 'failed', message: '답장 전송 실패' });
  assert.equal(failed.alertMessage, '답장 전송 실패');
});

test('reply publication policy clears only after success and requests my-answer route with created ids', () => {
  const result = resolveReplyPublicationResult({
    status: 'published',
    replyId: 'reply-created',
  }, {
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
  });

  assert.deepEqual(result, {
    moderation: { status: 'approved' },
    clearDraft: true,
    route: { route: 'write_reply_success', deliveryId: 'delivery-1', worryId: 'worry-1' },
  });
});
