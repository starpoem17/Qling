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
  assert.match(chatRoomScreenSource, /ref=\{messagesScrollerRef\}[\s\S]*className="absolute bottom-\[calc\(67px\+max\(0px,calc\(var\(--chat-keyboard-offset\)-var\(--chat-input-y-offset\)\)\)\)\] left-0 top-\[74px\] w-\[393px\] overflow-y-auto/);
});

test('chat shell routes fill the app shell without extending under bottom navigation', () => {
  assert.match(chatRoomScreenSource, /-mx-\[var\(--qling-space-shell-x\)\] -mb-12 -mt-6 h-dvh overflow-hidden/);
  assert.doesNotMatch(chatRoomScreenSource, /-mb-\[var\(--qling-space-scroll-bottom\)\]/);
  assert.match(reportUserScreenSource, /-mx-\[var\(--qling-space-shell-x\)\] -mt-6 h-\[calc\(100%\+1\.5rem\)\] overflow-hidden/);
  assert.doesNotMatch(reportUserScreenSource, /-mb-\[var\(--qling-space-scroll-bottom\)\]/);
  assert.doesNotMatch(reportUserScreenSource, /h-dvh/);
});

test('chat screens keep 393px canvas width while chat room uses viewport height', () => {
  assert.match(chatScreenSource, /const canvasScale = 'calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)'/);
  assert.match(chatScreenSource, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden/);
  assert.match(chatScreenSource, /style=\{\{ transform: `scale\(\$\{canvasScale\}\)` \}\}/);

  assert.match(chatRoomScreenSource, /const \[viewportMetrics, setViewportMetrics\] = useState\(\{ canvasHeight: 852, keyboardOffset: 0, scale: 1 \}\)/);
  assert.match(chatRoomScreenSource, /const chatInputYOffset = 10/);
  assert.match(chatRoomScreenSource, /'--chat-input-y-offset': `\$\{chatInputYOffset\}px`/);
  assert.match(chatRoomScreenSource, /canvasHeight: layoutHeight \/ scale/);
  assert.match(chatRoomScreenSource, /transform: `scale\(\$\{viewportMetrics\.scale\}\)`/);
  assert.match(chatRoomScreenSource, /relative w-\[393px\] shrink-0 origin-top overflow-hidden/);
  assert.doesNotMatch(chatRoomScreenSource, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden/);
  assert.match(chatScreenSource, /-mx-\[var\(--qling-space-shell-x\)\] -mb-\[var\(--qling-space-scroll-bottom\)\] -mt-6 h-dvh overflow-hidden/);
});

test('chat shell routes keep scrolling in route-owned content areas', () => {
  assert.match(chatScreenSource, /absolute left-0 top-\[136px\] h-\[716px\] w-full overflow-y-auto/);
  assert.match(chatScreenSource, /CreamContentBackground/);
  assert.match(chatScreenSource, /touch-none overscroll-none overflow-hidden rounded-t-\[30px\]/);
  assert.match(chatRoomScreenSource, /absolute bottom-\[calc\(67px\+max\(0px,calc\(var\(--chat-keyboard-offset\)-var\(--chat-input-y-offset\)\)\)\)\] left-0 top-\[74px\] w-\[393px\] overflow-y-auto/);
  assert.match(reportUserScreenSource, /min-h-0 flex-1 overflow-y-auto/);

  assert.match(chatRoomScreenSource, /absolute bottom-\[max\(0px,calc\(var\(--chat-keyboard-offset\)-var\(--chat-input-y-offset\)\)\)\] left-0 h-\[67px\] w-\[393px\]/);
  assert.doesNotMatch(chatRoomScreenSource, /bottom-0 left-0 h-\[max\(0px,calc\(var\(--chat-keyboard-offset\)/);
  assert.doesNotMatch(chatRoomScreenSource, /top-\[790px\]/);
  assert.match(chatRoomScreenSource, /ChatRoomTopBar/);
  assert.match(reportUserScreenSource, /flex h-full min-h-0 flex-col/);
});

test('chat room more menu is fixed to the visible viewport bottom', () => {
  assert.match(chatRoomScreenSource, /bg-\[rgba\(40,30,20,0\.42\)\]/);
  assert.match(chatRoomScreenSource, /className="fixed inset-0 z-30 bg-\[rgba\(40,30,20,0\.42\)\]"/);
  assert.match(chatRoomScreenSource, /bottom-\[var\(--chat-keyboard-offset\)\][\s\S]*h-\[284px\][\s\S]*rounded-tl-\[22px\] rounded-tr-\[22px\]/);
  assert.doesNotMatch(chatRoomScreenSource, /top-\[597px\]/);
  assert.match(chatRoomScreenSource, /label="알림 끄기"/);
  assert.match(chatRoomScreenSource, /label="차단하기" danger onClick=\{onBlock\}/);
  assert.match(chatRoomScreenSource, /label="신고하기" danger onClick=\{onReport\}/);
  assert.match(chatRoomScreenSource, /roomNotificationOffIconUrl/);
  assert.match(chatRoomScreenSource, /roomBlockIconUrl/);
  assert.match(chatRoomScreenSource, /roomReportIconUrl/);
});

test('chat room accounts for iPhone visual viewport and dimmed status bar color', () => {
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.addEventListener\('resize', updateViewportMetrics\)/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.addEventListener\('scroll', updateViewportMetrics\)/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.removeEventListener\('resize', updateViewportMetrics\)/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.removeEventListener\('scroll', updateViewportMetrics\)/);
  assert.match(chatRoomScreenSource, /document\.querySelector<HTMLMetaElement>\('meta\[name="theme-color"\]'\)/);
  assert.match(chatRoomScreenSource, /document\.documentElement\.style\.backgroundColor = dimThemeColor/);
  assert.match(chatRoomScreenSource, /document\.body\.style\.backgroundColor = dimThemeColor/);
  assert.match(chatRoomScreenSource, /root\.style\.backgroundColor = dimThemeColor/);
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
