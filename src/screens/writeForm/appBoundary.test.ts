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

test('App.tsx gives write-form routes their own main canvas and standalone PWA chrome colors', () => {
  const cssSource = fs.readFileSync('src/index.css', 'utf8');

  assert.match(appSource, /currentRoute === 'write_worry' \|\| currentRoute === 'write_reply'\s*\?\s*'qling-write-form-main'/);
  assert.match(appSource, /pwaRouteChromeForRoute\(currentRoute\)/);
  assert.match(appSource, /document\.documentElement\.classList\.contains\('qling-ios-standalone-pwa'\)/);
  assert.match(appSource, /themeMeta\?\.setAttribute\('content', standalonePwaRouteChrome\.top\)/);
  assert.match(appSource, /document\.body\.style\.backgroundColor = standalonePwaRouteChrome\.bottom/);
  assert.match(appSource, /root\.style\.backgroundColor = standalonePwaRouteChrome\.bottom/);
  assert.match(appSource, /route === 'write_worry' \|\| route === 'write_reply' \|\| route === 'answer_check'/);
  assert.match(appSource, /return \{ top: '#fff1d1', bottom: '#fff5eb' \}/);
  assert.match(cssSource, /--qling-pwa-topbar-shift: var\(--qling-pwa-direct-topbar-shift\)/);
  assert.match(cssSource, /\.qling-write-form-main\s*\{[^}]*overflow: hidden;/);
  assert.match(cssSource, /\.qling-write-form-main\s*\{[^}]*overscroll-behavior: contain;/);
  assert.match(cssSource, /\.qling-write-form-main\s*\{[^}]*-webkit-overflow-scrolling: touch;/);
  assert.doesNotMatch(cssSource, /\.qling-write-form-main\s*\{[^}]*overflow-y: auto;/);
});
