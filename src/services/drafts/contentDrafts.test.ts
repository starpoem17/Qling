import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WRITE_WORRY_DRAFT_KEY,
  clearDraft,
  clearStoredDraft,
  feedbackCommentDraftKey,
  getDraft,
  getStoredDraft,
  replyDraftKey,
  resetStoredDraftsForTest,
  setDraft,
  setStoredDraft,
} from './contentDrafts';

test('sets, gets, and clears one draft key', () => {
  const drafts = setDraft({}, 'write_worry', 'draft');

  assert.equal(getDraft(drafts, 'write_worry'), 'draft');
  assert.deepEqual(clearDraft(drafts, 'write_worry'), {});
});

test('keyed drafts do not leak between reply or comment targets', () => {
  const drafts = setDraft(setDraft({}, 'reply-a', 'first'), 'reply-b', 'second');
  assert.equal(getDraft(drafts, 'reply-a'), 'first');
  assert.equal(getDraft(drafts, 'reply-b'), 'second');
});

test('clearing one successful target preserves other failed drafts', () => {
  const drafts = setDraft(setDraft({}, 'delivery-a', 'kept'), 'delivery-b', 'sent');
  assert.deepEqual(clearDraft(drafts, 'delivery-b'), { 'delivery-a': 'kept' });
});

test('write-worry canonical key does not collide with reply delivery id keys', () => {
  const drafts = setDraft(
    setDraft({}, WRITE_WORRY_DRAFT_KEY, 'worry draft'),
    replyDraftKey('delivery-a'),
    'reply draft',
  );

  assert.equal(getDraft(drafts, WRITE_WORRY_DRAFT_KEY), 'worry draft');
  assert.equal(getDraft(drafts, replyDraftKey('delivery-a')), 'reply draft');
});

test('feedback comment draft key cannot collide with write-worry or reply draft keys', () => {
  const drafts = setDraft(
    setDraft(
      setDraft({}, WRITE_WORRY_DRAFT_KEY, 'worry draft'),
      replyDraftKey('reply-1'),
      'reply draft',
    ),
    feedbackCommentDraftKey('reply-1'),
    'comment draft',
  );

  assert.equal(replyDraftKey('reply-1'), 'reply:reply-1');
  assert.equal(feedbackCommentDraftKey('reply-1'), 'feedback_comment:reply-1');
  assert.equal(getDraft(drafts, WRITE_WORRY_DRAFT_KEY), 'worry draft');
  assert.equal(getDraft(drafts, replyDraftKey('reply-1')), 'reply draft');
  assert.equal(getDraft(drafts, feedbackCommentDraftKey('reply-1')), 'comment draft');
});

test('stored draft service preserves route-remount drafts and clears only successful target', () => {
  resetStoredDraftsForTest();

  setStoredDraft(WRITE_WORRY_DRAFT_KEY, 'worry draft');
  setStoredDraft(replyDraftKey('delivery-a'), 'reply a');
  setStoredDraft(replyDraftKey('delivery-b'), 'reply b');
  setStoredDraft(feedbackCommentDraftKey('reply-a'), 'comment a');

  clearStoredDraft(replyDraftKey('delivery-a'));

  assert.equal(getStoredDraft(WRITE_WORRY_DRAFT_KEY), 'worry draft');
  assert.equal(getStoredDraft(replyDraftKey('delivery-a')), '');
  assert.equal(getStoredDraft(replyDraftKey('delivery-b')), 'reply b');
  assert.equal(getStoredDraft(feedbackCommentDraftKey('reply-a')), 'comment a');
});
