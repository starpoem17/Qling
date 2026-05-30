import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync('src/App.tsx', 'utf8');

test('App.tsx no longer imports write publication API clients', () => {
  assert.doesNotMatch(appSource, /services\/worryPublication\/apiClient/);
  assert.doesNotMatch(appSource, /services\/replyPublication\/apiClient/);
  assert.doesNotMatch(appSource, /publishWorryViaApi|publishReplyViaApi/);
});

test('App.tsx delegates write-form routes to containers instead of inline publication handlers', () => {
  assert.match(appSource, /<WriteWorryContainer/);
  assert.match(appSource, /<WriteWorrySuccessContainer/);
  assert.match(appSource, /<WriteReplyContainer/);
  assert.match(appSource, /currentRoute === 'write_worry_success'/);
  assert.doesNotMatch(appSource, /const publishWorry = async/);
  assert.doesNotMatch(appSource, /const sendReply = async/);
  assert.doesNotMatch(appSource, /function WriteForm\(/);
  assert.doesNotMatch(appSource, /worryDraft|replyDrafts/);
  assert.doesNotMatch(appSource, /setFilterAlert\(['"`]고민 전송/);
});

test('App.tsx gives write-form routes their own main canvas and iOS chrome color', () => {
  assert.match(appSource, /currentRoute === 'write_worry' \|\| currentRoute === 'write_reply'\s*\?\s*'qling-write-form-main'/);
  assert.match(appSource, /currentRoute !== 'write_worry' && currentRoute !== 'write_reply'/);
  assert.match(appSource, /themeMeta\?\.setAttribute\('content', '#fff1d1'\)/);
  assert.match(appSource, /document\.body\.style\.backgroundColor = '#fff1d1'/);
  assert.match(appSource, /root\.style\.backgroundColor = '#fff1d1'/);
});
