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

test('chat room top bar is fixed outside the keyboard-offset canvas', () => {
  assert.match(chatRoomScreenSource, /const \[headerLayerTarget, setHeaderLayerTarget\] = useState<HTMLElement \| null>\(null\)/);
  assert.match(chatRoomScreenSource, /setHeaderLayerTarget\(document\.body\)/);
  assert.match(chatRoomScreenSource, /const headerLayer = headerLayerTarget \? createPortal\(/);
  assert.match(chatRoomScreenSource, /const topBarStyle: ChatRoomTopBarStyle = \{\s*transform: `translateX\(-50%\) scale\(\$\{viewportMetrics\.scale\}\)`,\s*\}/);
  assert.match(chatRoomScreenSource, /<ChatRoomTopBar[\s\S]*style=\{topBarStyle\}[\s\S]*\/>/);
  assert.match(chatRoomScreenSource, /<header data-chat-room-top-bar className="fixed left-0 right-0 top-0 z-20 mx-auto h-\[74px\] w-\[min\(480px,100vw\)\] overflow-hidden bg-\[#ff8b3d\] qling-figma-font">/);
  assert.match(chatRoomScreenSource, /<div className="absolute left-1\/2 top-0 h-\[74px\] w-\[393px\] origin-top" style=\{style\}>/);
  assert.match(chatRoomScreenSource, /\{headerLayer\}/);
  assert.doesNotMatch(chatRoomScreenSource, /<header[^>]*style=\{style\}/);
  assert.doesNotMatch(chatRoomScreenSource, /<div className="relative w-\[393px\][^>]*>\s*<ChatRoomTopBar/);
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
  assert.match(chatRoomScreenSource, /canvasHeight: keyboardOffset > 0 \? previousMetrics\.canvasHeight : layoutHeight \/ scale/);
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

  assert.match(chatRoomScreenSource, /import \{ createPortal \} from 'react-dom'/);
  assert.match(chatRoomScreenSource, /const \[inputLayerTarget, setInputLayerTarget\] = useState<HTMLElement \| null>\(null\)/);
  assert.match(chatRoomScreenSource, /setInputLayerTarget\(document\.body\)/);
  assert.match(chatRoomScreenSource, /const inputLayer = inputLayerTarget \? createPortal\(/);
  assert.match(chatRoomScreenSource, /<ChatRoomInputBar[\s\S]*style=\{inputBarStyle\}/);
  assert.match(chatRoomScreenSource, /safeInputRef=\{safeInputRef\}/);
  assert.match(chatRoomScreenSource, /safeInputStyle=\{safeInputStyle\}/);
  assert.match(chatRoomScreenSource, /function ChatRoomInputBar/);
  assert.match(chatRoomScreenSource, /const safeInputRef = useRef<HTMLInputElement>\(null\)/);
  assert.match(chatRoomScreenSource, /const safeInputStyle: ChatRoomSafeInputStyle = \{/);
  assert.match(chatRoomScreenSource, /top: `\$\{120 \* viewportMetrics\.scale\}px`/);
  assert.match(chatRoomScreenSource, /<div data-chat-room-input-bar className="fixed z-10 border-t border-\[#ede3d6\] bg-white qling-figma-font" style=\{style\}>/);
  assert.match(chatRoomScreenSource, /data-chat-room-message-input/);
  assert.match(chatRoomScreenSource, /ref=\{safeInputRef\}[\s\S]*data-chat-room-message-input/);
  assert.match(chatRoomScreenSource, /onFocus=\{onMessageFocus\}/);
  assert.match(chatRoomScreenSource, /onPointerDown=\{\(event\) => \{[\s\S]*event\.preventDefault\(\);[\s\S]*onFocusProxy\(\);[\s\S]*\}\}/);
  assert.match(chatRoomScreenSource, /left: `calc\(50% - \$\{\(393 \* viewportMetrics\.scale\) \/ 2\}px\)`/);
  assert.match(chatRoomScreenSource, /bottom: `\$\{inputBarBottom\}px`/);
  assert.doesNotMatch(chatRoomScreenSource, /<input[\s\S]*placeholder="메시지를 입력해 주세요"/);
  assert.doesNotMatch(chatRoomScreenSource, /absolute bottom-\[max\(0px,calc\(var\(--chat-keyboard-offset\)-var\(--chat-input-y-offset\)\)\)\] left-0 h-\[67px\] w-\[393px\]/);
  assert.doesNotMatch(chatRoomScreenSource, /className="fixed z-10[^"]*translate/);
  assert.doesNotMatch(chatRoomScreenSource, /bottom-0 left-0 h-\[max\(0px,calc\(var\(--chat-keyboard-offset\)/);
  assert.doesNotMatch(chatRoomScreenSource, /top-\[790px\]/);
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

test('chat room accounts for iPhone visual viewport and document background', () => {
  assert.match(chatRoomScreenSource, /function logChatRoomKeyboardViewport\(label: string, metrics: ChatRoomViewportMetrics\)/);
  assert.match(chatRoomScreenSource, /\[chat-room-keyboard\] \$\{label\}/);
  assert.match(chatRoomScreenSource, /headerTop: header\?\.getBoundingClientRect\(\)\.top/);
  assert.match(chatRoomScreenSource, /bodyTop: document\.body\.getBoundingClientRect\(\)\.top/);
  assert.match(chatRoomScreenSource, /vvOffsetTop: window\.visualViewport\?\.offsetTop/);
  assert.match(chatRoomScreenSource, /keyboardOffset: metrics\.keyboardOffset/);
  assert.match(chatRoomScreenSource, /const viewportMetricsRef = useRef<ChatRoomViewportMetrics>\(viewportMetrics\)/);
  assert.match(chatRoomScreenSource, /logChatRoomKeyboardViewport\('input focus 900ms', viewportMetricsRef\.current\)/);
  assert.match(chatRoomScreenSource, /logChatRoomKeyboardViewport\('viewport metrics update'/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.addEventListener\('resize', updateViewportMetrics\)/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.removeEventListener\('resize', updateViewportMetrics\)/);
  assert.doesNotMatch(chatRoomScreenSource, /visualViewport\?\.addEventListener\('scroll'/);
  assert.doesNotMatch(chatRoomScreenSource, /visualViewport\?\.removeEventListener\('scroll'/);
  assert.match(chatRoomScreenSource, /setViewportMetrics\(previousMetrics =>/);
  assert.match(chatRoomScreenSource, /const chatRoomDocumentBackground = '#ffffff'/);
  assert.match(chatRoomScreenSource, /const backgroundColor = menuOpen \? dimThemeColor : chatRoomDocumentBackground/);
  assert.match(chatRoomScreenSource, /document\.documentElement\.style\.backgroundColor = backgroundColor/);
  assert.match(chatRoomScreenSource, /document\.body\.style\.backgroundColor = backgroundColor/);
  assert.match(chatRoomScreenSource, /root\.style\.backgroundColor = backgroundColor/);
  assert.doesNotMatch(chatRoomScreenSource, /meta\[name="theme-color"\]/);
  assert.doesNotMatch(chatRoomScreenSource, /setAttribute\('content', '#ffffff'\)/);
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
