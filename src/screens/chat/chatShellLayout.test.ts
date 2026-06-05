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
  assert.match(chatRoomScreenSource, /const shouldStickToBottomRef = useRef\(true\)/);
  assert.match(chatRoomScreenSource, /distanceFromBottom <= 72/);
  assert.match(chatRoomScreenSource, /scroller\.scrollTop = scroller\.scrollHeight/);
  assert.match(chatRoomScreenSource, /ref=\{messagesScrollerRef\}[\s\S]*data-chat-room-message-scroller[\s\S]*className="min-h-0 flex-1 w-\[393px\] overflow-y-auto overscroll-contain/);
  assert.match(chatRoomScreenSource, /overflow-y-auto overscroll-contain bg-\[#fff1d1\]/);
});

test('chat room top bar stays inside the scaled canvas without portal recovery', () => {
  assert.doesNotMatch(chatRoomScreenSource, /createPortal/);
  assert.doesNotMatch(chatRoomScreenSource, /headerLayer/);
  assert.doesNotMatch(chatRoomScreenSource, /inputLayer/);
  assert.match(chatRoomScreenSource, /data-chat-room-canvas[\s\S]*<ChatRoomTopBar/);
  assert.match(chatRoomScreenSource, /data-chat-room-top-bar[\s\S]*className="relative z-20 h-\[74px\] w-\[393px\] shrink-0 touch-none overscroll-none overflow-hidden bg-\[#ff8b3d\] qling-figma-font"[\s\S]*onTouchMove=\{blockStaticScroll\}[\s\S]*onWheel=\{blockStaticScroll\}/);
  assert.doesNotMatch(chatRoomScreenSource, /<header data-chat-room-top-bar className="fixed/);
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

  assert.match(chatRoomScreenSource, /const \[viewportMetrics, setViewportMetrics\] = useState<ChatRoomViewportMetrics>\(\{ canvasHeight: 852, offsetTop: 0, scale: 1 \}\)/);
  assert.doesNotMatch(chatRoomScreenSource, /chatInputYOffset/);
  assert.match(chatRoomScreenSource, /const chatInputBaseHeight = 67/);
  assert.match(chatRoomScreenSource, /const chatTextareaMaxHeight = 60/);
  assert.doesNotMatch(chatRoomScreenSource, /--chat-keyboard-offset/);
  assert.doesNotMatch(chatRoomScreenSource, /--chat-input-y-offset/);
  assert.match(chatRoomScreenSource, /'--chat-input-height': `\$\{chatInputBaseHeight \+ Math\.max\(0, textareaHeight - chatTextareaMinHeight\)\}px`/);
  assert.match(chatRoomScreenSource, /const visibleHeight = visualViewport\?\.height \?\? window\.innerHeight \?\? document\.documentElement\.clientHeight \?\? 852/);
  assert.match(chatRoomScreenSource, /const offsetTop = visualViewport\?\.offsetTop \?\? 0/);
  assert.match(chatRoomScreenSource, /canvasHeight: visibleHeight \/ scale/);
  assert.match(chatRoomScreenSource, /offsetTop: offsetTop \/ scale/);
  assert.match(chatRoomScreenSource, /marginTop: `\$\{viewportMetrics\.offsetTop\}px`/);
  assert.match(chatRoomScreenSource, /transform: `scale\(\$\{viewportMetrics\.scale\}\)`/);
  assert.match(chatRoomScreenSource, /relative flex w-\[393px\] shrink-0 origin-top flex-col overflow-hidden/);
  assert.doesNotMatch(chatRoomScreenSource, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden/);
  assert.match(chatScreenSource, /-mx-\[var\(--qling-space-shell-x\)\] -mb-\[var\(--qling-space-scroll-bottom\)\] -mt-6 h-dvh overflow-hidden/);
});

test('chat shell routes keep scrolling in route-owned content areas', () => {
  assert.match(chatScreenSource, /absolute left-0 top-\[136px\] h-\[716px\] w-full overflow-y-auto/);
  assert.match(chatScreenSource, /CreamContentBackground/);
  assert.match(chatScreenSource, /touch-none overscroll-none overflow-hidden rounded-t-\[30px\]/);
  assert.match(chatRoomScreenSource, /data-chat-room-canvas className="relative flex w-\[393px\] shrink-0 origin-top flex-col overflow-hidden bg-\[#fff1d1\] qling-figma-font"/);
  assert.match(chatRoomScreenSource, /data-chat-room-message-scroller[\s\S]*className="min-h-0 flex-1 w-\[393px\] overflow-y-auto/);
  assert.match(reportUserScreenSource, /min-h-0 flex-1 overflow-y-auto/);

  assert.doesNotMatch(chatRoomScreenSource, /import \{ createPortal \} from 'react-dom'/);
  assert.match(chatRoomScreenSource, /function ChatRoomInputBar/);
  assert.match(chatRoomScreenSource, /const messageInputRef = useRef<HTMLTextAreaElement>\(null\)/);
  assert.match(chatRoomScreenSource, /data-chat-room-input-bar[\s\S]*className="relative h-\[var\(--chat-input-height\)\] w-\[393px\] shrink-0 touch-none overscroll-none border-t border-\[#ede3d6\] bg-white qling-figma-font"[\s\S]*onTouchMove=\{blockStaticScroll\}[\s\S]*onWheel=\{blockStaticScroll\}/);
  assert.match(chatRoomScreenSource, /<textarea[\s\S]*data-chat-room-message-input/);
  assert.match(chatRoomScreenSource, /data-chat-room-message-input/);
  assert.match(chatRoomScreenSource, /ref=\{inputRef\}[\s\S]*data-chat-room-message-input/);
  assert.match(chatRoomScreenSource, /onChange=\{onDraftChange\}/);
  assert.match(chatRoomScreenSource, /onKeyDown=\{onMessageKeyDown\}/);
  assert.doesNotMatch(chatRoomScreenSource, /contentEditable/);
  assert.doesNotMatch(chatRoomScreenSource, /safeInput/);
  assert.match(chatRoomScreenSource, /enterKeyHint="send"/);
  assert.match(chatRoomScreenSource, /data-lpignore="true"/);
  assert.doesNotMatch(chatRoomScreenSource, /className="fixed z-10/);
  assert.doesNotMatch(chatRoomScreenSource, /bottom-\[max\(0px,calc\(var\(--chat-keyboard-offset\)-var\(--chat-input-y-offset\)\)\)\]/);
  assert.doesNotMatch(chatRoomScreenSource, /top-\[790px\]/);
  assert.match(reportUserScreenSource, /flex h-full min-h-0 flex-col/);
});

test('chat room more menu is fixed to the visible viewport bottom', () => {
  assert.match(chatRoomScreenSource, /bg-\[rgba\(40,30,20,0\.42\)\]/);
  assert.match(chatRoomScreenSource, /className="fixed inset-0 z-30 bg-\[rgba\(40,30,20,0\.42\)\]"/);
  assert.match(chatRoomScreenSource, /bottom-0[\s\S]*h-\[284px\][\s\S]*rounded-tl-\[22px\] rounded-tr-\[22px\]/);
  assert.doesNotMatch(chatRoomScreenSource, /top-\[597px\]/);
  assert.match(chatRoomScreenSource, /label="알림 끄기"/);
  assert.match(chatRoomScreenSource, /label="차단하기" danger onClick=\{onBlock\}/);
  assert.match(chatRoomScreenSource, /label="신고하기" danger onClick=\{onReport\}/);
  assert.match(chatRoomScreenSource, /roomNotificationOffIconUrl/);
  assert.match(chatRoomScreenSource, /roomBlockIconUrl/);
  assert.match(chatRoomScreenSource, /roomReportIconUrl/);
});

test('chat room accounts for visual viewport and document background without recovery logic', () => {
  assert.match(chatRoomScreenSource, /visualViewport\?\.height/);
  assert.match(chatRoomScreenSource, /visualViewport\?\.offsetTop/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.addEventListener\('resize', updateViewportMetrics\)/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.removeEventListener\('resize', updateViewportMetrics\)/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.addEventListener\('scroll', updateViewportMetrics\)/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.removeEventListener\('scroll', updateViewportMetrics\)/);
  assert.match(chatRoomScreenSource, /setViewportMetrics\(previousMetrics =>/);
  assert.match(chatRoomScreenSource, /const chatRoomDocumentBackground = '#ffffff'/);
  assert.match(chatRoomScreenSource, /const backgroundColor = menuOpen \? dimThemeColor : chatRoomDocumentBackground/);
  assert.match(chatRoomScreenSource, /document\.documentElement\.style\.backgroundColor = backgroundColor/);
  assert.match(chatRoomScreenSource, /document\.body\.style\.backgroundColor = backgroundColor/);
  assert.match(chatRoomScreenSource, /root\.style\.backgroundColor = backgroundColor/);
  assert.doesNotMatch(chatRoomScreenSource, /meta\[name="theme-color"\]/);
  assert.doesNotMatch(chatRoomScreenSource, /setAttribute\('content', '#ffffff'\)/);
});

test('chat room blocks static area scroll without document scroll recovery', () => {
  assert.doesNotMatch(chatRoomScreenSource, /restoreKeyboardDocumentScroll/);
  assert.doesNotMatch(chatRoomScreenSource, /window\.scrollTo/);
  assert.doesNotMatch(chatRoomScreenSource, /window\.addEventListener\('scroll'/);
  assert.doesNotMatch(chatRoomScreenSource, /document\.addEventListener\('touchmove'/);
  assert.doesNotMatch(chatRoomScreenSource, /document\.addEventListener\('wheel'/);
  assert.doesNotMatch(chatRoomScreenSource, /handleNonMessageScroll/);
  assert.doesNotMatch(chatRoomScreenSource, /blockingListenerOptions/);
  assert.match(chatRoomScreenSource, /function blockStaticScroll\(event: WheelEvent<HTMLElement> \| TouchEvent<HTMLElement>\)/);
  assert.match(chatRoomScreenSource, /preventDefault\.call\(event\)/);
  assert.match(chatRoomScreenSource, /stopPropagation\.call\(event\)/);
  assert.match(chatRoomScreenSource, /messageInputRef\.current\?\.blur\(\)/);
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
