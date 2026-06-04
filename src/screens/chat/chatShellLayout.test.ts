import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const chatScreenSource = readSource('src/screens/chat/ChatScreen.tsx');
const chatRoomScreenSource = readSource('src/screens/chat/ChatRoomScreen.tsx');
const reportUserScreenSource = readSource('src/screens/report/ReportUserScreen.tsx');

test('chat room autoscroll stays inside the message scroller', () => {
  assert.doesNotMatch(chatRoomScreenSource, /scrollIntoView/);
  assert.doesNotMatch(chatRoomScreenSource, /behavior:\s*'smooth'/);
  assert.match(chatRoomScreenSource, /const messagesScrollerRef = useRef<HTMLDivElement>\(null\)/);
  assert.match(chatRoomScreenSource, /scroller\.scrollTop = scroller\.scrollHeight/);
  assert.match(chatRoomScreenSource, /ref=\{messagesScrollerRef\}[\s\S]*className="absolute left-0 top-\[74px\] h-\[716px\] w-\[393px\] overflow-y-auto/);
});

test('chat shell routes fill the app shell without extending under bottom navigation', () => {
  assert.match(chatRoomScreenSource, /-mx-\[var\(--qling-space-shell-x\)\] -mb-12 -mt-6 h-dvh overflow-hidden/);
  assert.doesNotMatch(chatRoomScreenSource, /-mb-\[var\(--qling-space-scroll-bottom\)\]/);
  assert.match(reportUserScreenSource, /-mx-\[var\(--qling-space-shell-x\)\] -mt-6 h-\[calc\(100%\+1\.5rem\)\] overflow-hidden/);
  assert.doesNotMatch(reportUserScreenSource, /-mb-\[var\(--qling-space-scroll-bottom\)\]/);
  assert.doesNotMatch(reportUserScreenSource, /h-dvh/);
});

test('chat screens use the 393px fixed canvas scale layout', () => {
  for (const source of [chatScreenSource, chatRoomScreenSource]) {
    assert.match(source, /const canvasScale = 'calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)'/);
    assert.match(source, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden/);
    assert.match(source, /style=\{\{ transform: `scale\(\$\{canvasScale\}\)` \}\}/);
  }
  assert.match(chatScreenSource, /-mx-\[var\(--qling-space-shell-x\)\] -mb-\[var\(--qling-space-scroll-bottom\)\] -mt-6 h-dvh overflow-hidden/);
});

test('chat shell routes keep scrolling in route-owned content areas', () => {
  assert.match(chatScreenSource, /absolute left-0 top-\[136px\] h-\[716px\] w-full overflow-y-auto/);
  assert.match(chatScreenSource, /CreamContentBackground/);
  assert.match(chatScreenSource, /touch-none overscroll-none overflow-hidden rounded-t-\[30px\]/);
  assert.match(chatRoomScreenSource, /absolute left-0 top-\[74px\] h-\[716px\] w-\[393px\] overflow-y-auto/);
  assert.match(reportUserScreenSource, /min-h-0 flex-1 overflow-y-auto/);

  assert.match(chatRoomScreenSource, /absolute left-0 top-\[790px\] h-\[67px\] w-\[393px\]/);
  assert.match(chatRoomScreenSource, /ChatRoomTopBar/);
  assert.match(reportUserScreenSource, /flex h-full min-h-0 flex-col/);
});

test('chat room more menu matches the Figma bottom action sheet', () => {
  assert.match(chatRoomScreenSource, /bg-\[rgba\(40,30,20,0\.42\)\]/);
  assert.match(chatRoomScreenSource, /top-\[597px\][\s\S]*h-\[284px\][\s\S]*rounded-tl-\[22px\] rounded-tr-\[22px\]/);
  assert.match(chatRoomScreenSource, /label="알림 끄기"/);
  assert.match(chatRoomScreenSource, /label="차단하기" danger onClick=\{onBlock\}/);
  assert.match(chatRoomScreenSource, /label="신고하기" danger onClick=\{onReport\}/);
  assert.match(chatRoomScreenSource, /roomNotificationOffIconUrl/);
  assert.match(chatRoomScreenSource, /roomBlockIconUrl/);
  assert.match(chatRoomScreenSource, /roomReportIconUrl/);
});

test('chat list header matches the Figma vertical positions', () => {
  assert.match(chatScreenSource, /top-\[34px\] w-full text-center text-\[17px\]/);
  assert.match(chatScreenSource, /left-\[327px\] top-\[20px\] h-\[49px\] w-\[49px\]/);
  assert.match(chatScreenSource, /absolute left-4 top-\[75px\] flex h-10 w-\[361px\]/);
  assert.match(chatScreenSource, /absolute left-0 top-\[136px\] h-\[716px\] w-full overflow-hidden rounded-t-\[30px\] bg-\[#fff1d1\]/);
});

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}
