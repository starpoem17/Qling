import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { shouldMarkRepliesForWorryRead } from './containerPolicy';

test('reply read marker policy requires an authenticated answer-check route', () => {
  assert.equal(shouldMarkRepliesForWorryRead({ hasUser: true, worryId: 'worry-1' }), true);
  assert.equal(shouldMarkRepliesForWorryRead({ hasUser: false, worryId: 'worry-1' }), false);
  assert.equal(shouldMarkRepliesForWorryRead({ hasUser: true, worryId: null }), false);
});

test('answer check container calls the existing reply read-state API on entry', () => {
  const source = readFileSync(join(process.cwd(), 'src/screens/answerCheck/AnswerCheckContainer.tsx'), 'utf8');

  assert.match(source, /markRepliesForWorryReadWithServer/);
  assert.match(source, /worryId/);
  assert.doesNotMatch(source, /\/api\/worries\/.*\/replies\/read/);
});
