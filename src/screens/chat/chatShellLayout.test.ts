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
  assert.match(chatRoomScreenSource, /ref=\{messagesScrollerRef\} className="min-h-0 flex-1 overflow-y-auto/);
});

test('chat shell routes fill the app shell without extending under bottom navigation', () => {
  for (const source of [chatRoomScreenSource, reportUserScreenSource]) {
    assert.match(source, /-mx-\[var\(--qling-space-shell-x\)\] -mt-6 h-\[calc\(100%\+1\.5rem\)\] overflow-hidden/);
    assert.doesNotMatch(source, /-mb-\[var\(--qling-space-scroll-bottom\)\]/);
    assert.doesNotMatch(source, /h-dvh/);
  }
});

test('chat list uses the 393px fixed canvas scale layout', () => {
  assert.match(chatScreenSource, /const canvasScale = 'calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)'/);
  assert.match(chatScreenSource, /-mx-\[var\(--qling-space-shell-x\)\] -mb-\[var\(--qling-space-scroll-bottom\)\] -mt-6 h-dvh overflow-hidden/);
  assert.match(chatScreenSource, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden/);
  assert.match(chatScreenSource, /style=\{\{ transform: `scale\(\$\{canvasScale\}\)` \}\}/);
});

test('chat shell routes keep scrolling in route-owned content areas', () => {
  assert.match(chatScreenSource, /absolute left-0 top-\[162px\] h-\[690px\] w-full overflow-y-auto/);
  assert.match(chatScreenSource, /CreamContentBackground/);
  assert.match(chatScreenSource, /touch-none overscroll-none overflow-hidden rounded-t-\[30px\]/);
  assert.match(chatRoomScreenSource, /min-h-0 flex-1 overflow-y-auto/);
  assert.match(reportUserScreenSource, /min-h-0 flex-1 overflow-y-auto/);

  assert.match(chatRoomScreenSource, /shrink-0 bg-white/);
  assert.match(chatRoomScreenSource, /flex min-h-0 w-full flex-1 flex-col overflow-hidden/);
  assert.match(reportUserScreenSource, /flex h-full min-h-0 flex-col/);
});

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}
