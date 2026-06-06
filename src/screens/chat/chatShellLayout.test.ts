import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const chatScreenSource = readSource('src/screens/chat/ChatScreen.tsx');
const chatRoomScreenSource = readSource('src/screens/chat/ChatRoomScreen.tsx');
const reportUserScreenSource = readSource('src/screens/report/ReportUserScreen.tsx');
const indexCssSource = readSource('src/index.css');

test('chat room autoscroll stays inside the message scroller', () => {
  assert.doesNotMatch(chatRoomScreenSource, /scrollIntoView/);
  assert.doesNotMatch(chatRoomScreenSource, /behavior:\s*'smooth'/);
  assert.match(chatRoomScreenSource, /const messagesScrollerRef = useRef<HTMLDivElement>\(null\)/);
  assert.match(chatRoomScreenSource, /const shouldStickToBottomRef = useRef\(true\)/);
  assert.match(chatRoomScreenSource, /const \[isMessageScrollerScrollable, setIsMessageScrollerScrollable\] = useState\(false\)/);
  assert.match(chatRoomScreenSource, /const canAutoScrollAfterViewportChangeRef = useRef\(false\)/);
  assert.match(chatRoomScreenSource, /const previousAutoScrollInputsRef = useRef</);
  assert.match(chatRoomScreenSource, /function canScrollMessageScroller\(scroller: HTMLElement\)/);
  assert.match(chatRoomScreenSource, /return scroller\.scrollHeight > scroller\.clientHeight \+ 1/);
  assert.match(chatRoomScreenSource, /const canScrollMessages = canScrollMessageScroller\(scroller\);\s*setIsMessageScrollerScrollable\(canScrollMessages\)/);
  assert.match(chatRoomScreenSource, /if \(!canScrollMessages\) \{\s*shouldStickToBottomRef\.current = true;\s*\}/);
  assert.match(chatRoomScreenSource, /!viewportOnlyChanged \|\| canAutoScrollAfterViewportChangeRef\.current/);
  assert.match(chatRoomScreenSource, /canAutoScrollAfterViewportChangeRef\.current = viewportOnlyChanged\s*\? canAutoScrollAfterViewportChangeRef\.current\s*: canScrollMessages/);
  assert.match(chatRoomScreenSource, /distanceFromBottom <= 72/);
  assert.match(chatRoomScreenSource, /scroller\.scrollTop = scroller\.scrollHeight/);
  assert.match(chatRoomScreenSource, /ref=\{messagesScrollerRef\}[\s\S]*data-chat-room-message-scroller[\s\S]*isMessageScrollerScrollable[\s\S]*\? 'overflow-y-auto overscroll-contain/);
  assert.match(chatRoomScreenSource, /\: 'touch-none overscroll-none overflow-hidden'/);
  assert.match(chatRoomScreenSource, /onTouchMove=\{isMessageScrollerScrollable \? undefined : blockStaticScroll\}/);
  assert.match(chatRoomScreenSource, /onWheel=\{isMessageScrollerScrollable \? undefined : blockStaticScroll\}/);
});

test('chat room top bar is fixed in its own unscaled layer while canvas keeps a collapsible spacer', () => {
  assert.doesNotMatch(chatRoomScreenSource, /createPortal/);
  assert.doesNotMatch(chatRoomScreenSource, /headerLayer/);
  assert.doesNotMatch(chatRoomScreenSource, /inputLayer/);
  assert.match(chatRoomScreenSource, /data-chat-room-top-bar-layer[\s\S]*className="fixed left-0 right-0 top-0 z-50 overflow-hidden bg-\[#ff8b3d\]"[\s\S]*style=\{topBarLayerStyle\}/);
  assert.match(chatRoomScreenSource, /className="h-\[100px\] w-full max-w-\[480px\] shrink-0"[\s\S]*<ChatRoomTopBar[\s\S]*opponent=\{opponent\}[\s\S]*answerAdoptionRatePercent=\{answerAdoptionRatePercent\}[\s\S]*onBack=\{onBack\}[\s\S]*onOpenMenu=\{onOpenMenu\}/);
  assert.match(chatRoomScreenSource, /function ChatRoomTopBarSpacer\(\{ isHidden \}: \{ readonly isHidden: boolean \}\)/);
  assert.match(chatRoomScreenSource, /data-chat-room-top-bar-spacer[\s\S]*className="w-full shrink-0 bg-\[#ff8b3d\]"[\s\S]*style=\{\{ height: isHidden \? 0 : chatRoomTopBarHeight \}\}/);
  assert.match(chatRoomScreenSource, /data-chat-room-canvas[\s\S]*<ChatRoomTopBarSpacer isHidden=\{isTopBarHiddenForKeyboard\} \/>/);
  assert.match(chatRoomScreenSource, /data-chat-room-top-bar[\s\S]*className="relative z-20 h-\[100px\] w-full shrink-0 touch-none overscroll-none overflow-hidden bg-\[#ff8b3d\] qling-figma-font"[\s\S]*onTouchMove=\{blockStaticScroll\}[\s\S]*onWheel=\{blockStaticScroll\}/);
  assert.match(chatRoomScreenSource, /left-\[6px\] top-\[calc\(45px\+var\(--qling-pwa-direct-topbar-shift\)\)\] flex h-\[45px\] w-\[44px\]/);
  assert.doesNotMatch(chatRoomScreenSource, /<header data-chat-room-top-bar className="fixed/);
});

test('chat shell routes fill the app shell without extending under bottom navigation', () => {
  assert.match(chatRoomScreenSource, /<section[\s\S]*className="fixed inset-0 z-40 overflow-hidden bg-\[#fff1d1\]"[\s\S]*style=\{rootStyle\}/);
  assert.doesNotMatch(chatRoomScreenSource, /-mx-\[var\(--qling-space-shell-x\)\]/);
  assert.doesNotMatch(chatRoomScreenSource, /-mt-6 h-dvh/);
  assert.doesNotMatch(chatRoomScreenSource, /-mb-\[var\(--qling-space-scroll-bottom\)\]/);
  assert.match(reportUserScreenSource, /-mx-\[var\(--qling-space-shell-x\)\] -mt-6 h-\[calc\(100%\+1\.5rem\)\] overflow-hidden/);
  assert.doesNotMatch(reportUserScreenSource, /-mb-\[var\(--qling-space-scroll-bottom\)\]/);
  assert.doesNotMatch(reportUserScreenSource, /h-dvh/);
});

test('chat list and chat room use widened unscaled 480px frames', () => {
  assert.match(chatScreenSource, /import \{ FigmaCanvasFrame, profileImageUrlForColor \} from '\.\.\/shared\/ui'/);
  assert.match(chatScreenSource, /<FigmaCanvasFrame className="max-w-\[480px\]">/);
  assert.match(chatScreenSource, /relative h-\[852px\] w-full max-w-\[480px\] shrink-0 origin-top overflow-hidden/);
  assert.doesNotMatch(chatScreenSource, /const canvasClassName = 'relative h-\[852px\] w-\[393px\]/);
  assert.doesNotMatch(chatScreenSource, /const canvasScale = /);
  assert.doesNotMatch(chatScreenSource, /style=\{\{ transform: `scale\(\$\{canvasScale\}\)` \}\}/);

  assert.match(chatRoomScreenSource, /const \[viewportMetrics, setViewportMetrics\] = useState<ChatRoomViewportMetrics>\(\{ canvasHeight: 852, viewportOffsetTop: 0 \}\)/);
  assert.doesNotMatch(chatRoomScreenSource, /chatInputYOffset/);
  assert.match(chatRoomScreenSource, /const chatInputBaseHeight = 67/);
  assert.match(chatRoomScreenSource, /const chatRoomTopBarHeight = 100/);
  assert.match(chatRoomScreenSource, /const chatTextareaMaxHeight = 60/);
  assert.match(chatRoomScreenSource, /const chatRoomKeyboardOpenThreshold = 120/);
  assert.doesNotMatch(chatRoomScreenSource, /--chat-keyboard-inset/);
  assert.doesNotMatch(chatRoomScreenSource, /--chat-keyboard-offset/);
  assert.doesNotMatch(chatRoomScreenSource, /--chat-input-y-offset/);
  assert.match(chatRoomScreenSource, /'--chat-input-height': `\$\{chatInputBaseHeight \+ Math\.max\(0, textareaHeight - chatTextareaMinHeight\)\}px`/);
  assert.match(chatRoomScreenSource, /const layoutHeight = window\.innerHeight \?\? document\.documentElement\.clientHeight \?\? 852/);
  assert.match(chatRoomScreenSource, /const visibleHeight = visualViewport\?\.height \?\? window\.innerHeight \?\? document\.documentElement\.clientHeight \?\? 852/);
  assert.match(chatRoomScreenSource, /const offsetTop = visualViewport\?\.offsetTop \?\? 0/);
  assert.match(chatRoomScreenSource, /const viewportHeight = visualViewport \? visibleHeight : layoutHeight/);
  assert.match(chatRoomScreenSource, /canvasHeight: viewportHeight/);
  assert.match(chatRoomScreenSource, /viewportOffsetTop: offsetTop/);
  assert.match(chatRoomScreenSource, /previousMetrics\.viewportOffsetTop === nextMetrics\.viewportOffsetTop/);
  assert.doesNotMatch(chatRoomScreenSource, /viewportMetrics\.scale/);
  assert.doesNotMatch(chatRoomScreenSource, /topBarCanvasStyle/);
  assert.doesNotMatch(chatRoomScreenSource, /keyboardInset/);
  assert.doesNotMatch(chatRoomScreenSource, /void offsetTop/);
  assert.doesNotMatch(chatRoomScreenSource, /canvasHeight: layoutHeight \/ scale/);
  assert.doesNotMatch(chatRoomScreenSource, /offsetTop: offsetTop \/ scale/);
  assert.doesNotMatch(chatRoomScreenSource, /marginTop/);
  assert.match(chatRoomScreenSource, /const rootStyle: CSSProperties = \{\s*transform: `translateY\(\$\{viewportMetrics\.viewportOffsetTop\}px\)`,\s*\}/);
  assert.match(chatRoomScreenSource, /const \[isTopBarHiddenForKeyboard, setIsTopBarHiddenForKeyboard\] = useState\(false\)/);
  assert.match(chatRoomScreenSource, /const fullViewportHeightRef = useRef<number \| null>\(null\)/);
  assert.match(chatRoomScreenSource, /const keyboardInputIntentRef = useRef\(false\)/);
  assert.match(chatRoomScreenSource, /const topBarLayerStyle: CSSProperties = \{\s*height: `\$\{\(isTopBarHiddenForKeyboard \? 0 : viewportMetrics\.viewportOffsetTop\) \+ chatRoomTopBarHeight\}px`,\s*paddingTop: `\$\{isTopBarHiddenForKeyboard \? 0 : viewportMetrics\.viewportOffsetTop\}px`,\s*transform: isTopBarHiddenForKeyboard \? `translateY\(\$\{-chatRoomTopBarHeight\}px\)` : undefined,\s*\}/);
  assert.match(chatRoomScreenSource, /\}, \[messages, textareaHeight, viewportMetrics\.canvasHeight, isTopBarHiddenForKeyboard\]\)/);
  assert.match(chatRoomScreenSource, /<section[\s\S]*className="fixed inset-0 z-40 overflow-hidden bg-\[#fff1d1\]"[\s\S]*style=\{rootStyle\}/);
  assert.doesNotMatch(chatRoomScreenSource, /transform: `scale\(/);
  assert.match(chatRoomScreenSource, /relative flex h-full w-full max-w-\[480px\] shrink-0 flex-col overflow-hidden/);
  assert.doesNotMatch(chatRoomScreenSource, /relative flex w-\[393px\] shrink-0 origin-top flex-col overflow-hidden/);
  assert.doesNotMatch(chatRoomScreenSource, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden/);
  assert.match(chatScreenSource, /-mx-\[var\(--qling-space-shell-x\)\] h-\[var\(--qling-tab-viewport-height\)\] overflow-hidden/);
});

test('chat shell routes keep scrolling in route-owned content areas', () => {
  assert.match(chatScreenSource, /const contentTop = 'calc\(var\(--qling-space-safe-top\) \+ 136px\)'/);
  assert.match(chatScreenSource, /const contentViewportHeight = 'calc\(var\(--qling-tab-viewport-height\) - var\(--qling-space-safe-top\) - 136px\)'/);
  assert.match(chatScreenSource, /className="absolute left-0 w-full overflow-y-auto rounded-t-\[30px\] px-4 pb-\[108px\] pt-4 \[-webkit-overflow-scrolling:touch\]"[\s\S]*style=\{\{ height: contentViewportHeight, top: contentTop \}\}/);
  assert.doesNotMatch(chatScreenSource, /h-\[calc\(716px-var\(--qling-space-safe-top\)\)\] w-full overflow-y-auto/);
  assert.match(chatScreenSource, /CreamContentBackground/);
  assert.match(chatScreenSource, /touch-none overscroll-none overflow-hidden rounded-t-\[30px\]/);
  assert.match(chatRoomScreenSource, /data-chat-room-canvas className="relative flex h-full w-full max-w-\[480px\] shrink-0 flex-col overflow-hidden bg-\[#fff1d1\] qling-figma-font"/);
  assert.match(chatRoomScreenSource, /data-chat-room-message-scroller[\s\S]*'min-h-0 w-full flex-1 bg-\[#fff1d1\]/);
  assert.match(chatRoomScreenSource, /isMessageScrollerScrollable[\s\S]*\? 'overflow-y-auto overscroll-contain/);
  assert.match(chatRoomScreenSource, /\: 'touch-none overscroll-none overflow-hidden'/);
  assert.match(reportUserScreenSource, /min-h-0 flex-1 overflow-y-auto/);

  assert.doesNotMatch(chatRoomScreenSource, /import \{ createPortal \} from 'react-dom'/);
  assert.match(chatRoomScreenSource, /function ChatRoomInputBar/);
  assert.match(chatRoomScreenSource, /const messageInputRef = useRef<HTMLTextAreaElement>\(null\)/);
  assert.match(chatRoomScreenSource, /data-chat-room-input-bar[\s\S]*className="relative h-\[var\(--chat-input-height\)\] w-full shrink-0 touch-none overscroll-none border-t border-\[#ede3d6\] bg-white qling-figma-font"[\s\S]*onTouchMove=\{blockStaticScroll\}[\s\S]*onWheel=\{blockStaticScroll\}/);
  assert.doesNotMatch(chatRoomScreenSource, /-translate-y-\[var\(--chat-keyboard-inset\)\]/);
  assert.match(chatRoomScreenSource, /<textarea[\s\S]*data-chat-room-message-input/);
  assert.match(chatRoomScreenSource, /data-chat-room-message-input/);
  assert.match(chatRoomScreenSource, /ref=\{inputRef\}[\s\S]*data-chat-room-message-input/);
  assert.match(chatRoomScreenSource, /onChange=\{onDraftChange\}/);
  assert.match(chatRoomScreenSource, /onKeyDown=\{onMessageKeyDown\}/);
  assert.match(chatRoomScreenSource, /onTouchStart=\{\(\) => onMessageInputIntent\('textarea\.touchstart'\)\}/);
  assert.match(chatRoomScreenSource, /onPointerDown=\{event => onMessageInputIntent\('textarea\.pointerdown', event\.pointerType\)\}/);
  assert.match(chatRoomScreenSource, /onFocus=\{\(\) => onMessageInputIntent\('textarea\.focus'\)\}/);
  assert.match(chatRoomScreenSource, /onBlur=\{onMessageInputBlur\}/);
  assert.doesNotMatch(chatRoomScreenSource, /contentEditable/);
  assert.doesNotMatch(chatRoomScreenSource, /safeInput/);
  assert.match(chatRoomScreenSource, /enterKeyHint="send"/);
  assert.match(chatRoomScreenSource, /data-lpignore="true"/);
  assert.doesNotMatch(chatRoomScreenSource, /className="fixed z-10/);
  assert.doesNotMatch(chatRoomScreenSource, /bottom-\[max\(0px,calc\(var\(--chat-keyboard-offset\)-var\(--chat-input-y-offset\)\)\)\]/);
  assert.doesNotMatch(chatRoomScreenSource, /top-\[790px\]/);
  assert.match(reportUserScreenSource, /flex h-full min-h-0 flex-col/);
});

test('chat room more menu uses the unscaled 480px bottom sheet', () => {
  assert.match(chatRoomScreenSource, /bg-\[rgba\(40,30,20,0\.42\)\]/);
  assert.match(chatRoomScreenSource, /className="fixed inset-0 z-\[60\] bg-\[rgba\(40,30,20,0\.42\)\]"/);
  assert.doesNotMatch(chatRoomScreenSource, /scale=\{viewportMetrics\.scale\}/);
  assert.doesNotMatch(chatRoomScreenSource, /393 \* scale/);
  assert.doesNotMatch(chatRoomScreenSource, /style=\{\{ transform: `scale/);
  assert.match(chatRoomScreenSource, /bottom-0 left-1\/2 h-\[284px\] w-full max-w-\[480px\] -translate-x-1\/2/);
  assert.match(chatRoomScreenSource, /bottom-0 left-0 flex h-\[284px\] w-full flex-col/);
  assert.doesNotMatch(chatRoomScreenSource, /w-\[393px\]/);
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
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.addEventListener\('resize', handleViewportResize\)/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.removeEventListener\('resize', handleViewportResize\)/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.addEventListener\('scroll', handleViewportScroll\)/);
  assert.match(chatRoomScreenSource, /window\.visualViewport\?\.removeEventListener\('scroll', handleViewportScroll\)/);
  assert.match(chatRoomScreenSource, /setViewportMetrics\(previousMetrics =>/);
  assert.match(chatRoomScreenSource, /const viewportHeightShrink = Math\.max\(0, fullViewportHeight - visibleHeight\)/);
  assert.match(chatRoomScreenSource, /const isKeyboardHeightVisible = viewportHeightShrink >= chatRoomKeyboardOpenThreshold/);
  assert.match(chatRoomScreenSource, /fullViewportHeightRef\.current = Math\.max\(fullViewportHeight, nextFullViewportHeight\)/);
  assert.match(chatRoomScreenSource, /visualViewport && keyboardInputIntentRef\.current && isKeyboardHeightVisible/);
  assert.match(chatRoomScreenSource, /visualViewport && isTopBarHiddenForKeyboard && !isKeyboardHeightVisible/);
  assert.doesNotMatch(chatRoomScreenSource, /offsetTop === 0/);
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

test('chat room supports left edge back swipe without global touch listeners', () => {
  assert.match(chatRoomScreenSource, /const chatRoomBackSwipeEdgeWidth = 32/);
  assert.match(chatRoomScreenSource, /const chatRoomBackSwipeMinDistance = 72/);
  assert.match(chatRoomScreenSource, /const backSwipeRef = useRef<ChatRoomBackSwipeState \| null>\(null\)/);
  assert.match(chatRoomScreenSource, /const handleBackSwipeStart = \(event: TouchEvent<HTMLElement>\) =>/);
  assert.match(chatRoomScreenSource, /touch\.clientX <= chatRoomBackSwipeEdgeWidth/);
  assert.match(chatRoomScreenSource, /const handleBackSwipeMove = \(event: TouchEvent<HTMLElement>\) =>/);
  assert.match(chatRoomScreenSource, /deltaX >= chatRoomBackSwipeMinDistance/);
  assert.match(chatRoomScreenSource, /onBack\(\)/);
  assert.match(chatRoomScreenSource, /onTouchStart=\{handleBackSwipeStart\}/);
  assert.match(chatRoomScreenSource, /onTouchMove=\{handleBackSwipeMove\}/);
  assert.match(chatRoomScreenSource, /onTouchEnd=\{resetBackSwipe\}/);
  assert.match(chatRoomScreenSource, /function isChatRoomBackSwipeIgnoredTarget\(target: EventTarget \| null\)/);
  assert.match(chatRoomScreenSource, /\[data-chat-room-top-bar\]/);
  assert.match(chatRoomScreenSource, /\[data-chat-room-input-bar\]/);
  assert.doesNotMatch(chatRoomScreenSource, /document\.addEventListener\('touchstart'/);
  assert.doesNotMatch(chatRoomScreenSource, /window\.addEventListener\('touchstart'/);
});

test('chat room keyboard handling avoids document root fixed lock', () => {
  assert.doesNotMatch(chatRoomScreenSource, /qling-chat-room-keyboard-lock/);
  assert.doesNotMatch(chatRoomScreenSource, /setChatRoomKeyboardLock/);
  assert.doesNotMatch(chatRoomScreenSource, /classList\.toggle/);
  assert.doesNotMatch(indexCssSource, /qling-chat-room-keyboard-lock/);
  assert.doesNotMatch(indexCssSource, /html\.qling-chat-room-keyboard-lock/);
  assert.doesNotMatch(chatRoomScreenSource, /type ChatRoomDocumentLockSnapshot = \{/);
  assert.doesNotMatch(chatRoomScreenSource, /snapshotChatRoomDocumentLockStyle/);
  assert.doesNotMatch(chatRoomScreenSource, /applyChatRoomDocumentLockStyle/);
  assert.doesNotMatch(chatRoomScreenSource, /restoreChatRoomDocumentLockStyle/);
  assert.doesNotMatch(chatRoomScreenSource, /element\.style\.position = 'fixed'/);
  assert.match(chatRoomScreenSource, /isMessageScrollerScrollable[\s\S]*\? 'overflow-y-auto overscroll-contain/);
  assert.match(chatRoomScreenSource, /\: 'touch-none overscroll-none overflow-hidden'/);
});

test('chat room keyboard diagnostics log repeated focus viewport state in dev or PWA opt-in mode', () => {
  assert.match(chatRoomScreenSource, /const chatRoomKeyboardDebugStorageKey = 'qling\.chatRoomKeyboardDebug'/);
  assert.match(chatRoomScreenSource, /const chatRoomKeyboardDebugQueryParam = 'chatRoomKeyboardDebug'/);
  assert.match(chatRoomScreenSource, /function isChatRoomKeyboardDebugEnabled\(\)/);
  assert.match(chatRoomScreenSource, /if \(import\.meta\.env\.DEV\) return true/);
  assert.match(chatRoomScreenSource, /window\.localStorage\.getItem\(chatRoomKeyboardDebugStorageKey\) === '1'/);
  assert.match(chatRoomScreenSource, /new URLSearchParams\(window\.location\.search\)\.get\(chatRoomKeyboardDebugQueryParam\) === '1'/);
  assert.match(chatRoomScreenSource, /catch \{\s*return false;\s*\}/);
  assert.match(chatRoomScreenSource, /function logChatRoomKeyboardMetric\(source: string\)/);
  assert.match(chatRoomScreenSource, /if \(!isChatRoomKeyboardDebugEnabled\(\)\) return/);
  assert.match(chatRoomScreenSource, /console\.info\('\[chat-room-keyboard\]'/);
  assert.match(chatRoomScreenSource, /if \(source === 'textarea\.touchstart' \|\| source === 'textarea\.focus' \|\| pointerType === 'touch'\) \{\s*keyboardInputIntentRef\.current = true;\s*\}/);
  assert.doesNotMatch(chatRoomScreenSource, /setIsTopBarHiddenForKeyboard\(true\);\s*\}\s*logChatRoomKeyboardMetric\(source\)/);
  assert.match(chatRoomScreenSource, /if \(!window\.visualViewport\) \{\s*setIsTopBarHiddenForKeyboard\(false\);\s*\}\s*logChatRoomKeyboardMetric\('textarea\.blur'\)/);
  assert.doesNotMatch(chatRoomScreenSource, /bodyLocked/);
  assert.doesNotMatch(chatRoomScreenSource, /rootLocked/);
  assert.match(chatRoomScreenSource, /scrollY: window\.scrollY/);
  assert.match(chatRoomScreenSource, /documentScrollTop: document\.documentElement\.scrollTop/);
  assert.match(chatRoomScreenSource, /visualViewportHeight: visualViewport\?\.height \?\? null/);
  assert.match(chatRoomScreenSource, /visualViewportOffsetTop: visualViewport\?\.offsetTop \?\? null/);
  assert.match(chatRoomScreenSource, /const topBarLayerRect = readChatRoomElementRect\('\[data-chat-room-top-bar-layer\]'\)/);
  assert.match(chatRoomScreenSource, /const topBarRect = readChatRoomElementRect\('\[data-chat-room-top-bar\]'\)/);
  assert.match(chatRoomScreenSource, /topBarLayerTop: topBarLayerRect\?\.top \?\? null/);
  assert.match(chatRoomScreenSource, /topBarLayerHeight: topBarLayerRect\?\.height \?\? null/);
  assert.match(chatRoomScreenSource, /topBarTop: topBarRect\?\.top \?\? null/);
  assert.match(chatRoomScreenSource, /topBarHeight: topBarRect\?\.height \?\? null/);
  assert.match(chatRoomScreenSource, /function readChatRoomElementRect\(selector: string\)/);
  assert.match(chatRoomScreenSource, /document\.querySelector<HTMLElement>\(selector\)/);
  assert.match(chatRoomScreenSource, /logChatRoomKeyboardMetric\('textarea\.blur'\)/);
  assert.match(chatRoomScreenSource, /logChatRoomKeyboardMetric\(source\)/);
  assert.match(chatRoomScreenSource, /const handleViewportResize = \(\) => updateViewportMetrics\('visualViewport\.resize'\)/);
  assert.match(chatRoomScreenSource, /const handleViewportScroll = \(\) => updateViewportMetrics\('visualViewport\.scroll'\)/);
});

test('chat list header matches the Figma vertical positions', () => {
  assert.match(chatScreenSource, /top-\[calc\(var\(--qling-space-safe-top\)\+34px\)\] w-full text-center text-\[17px\]/);
  assert.match(chatScreenSource, /right-\[17px\] top-\[calc\(var\(--qling-space-safe-top\)\+21px\)\] h-\[49px\] w-\[49px\]/);
  assert.match(chatScreenSource, /absolute left-4 right-4 top-\[calc\(var\(--qling-space-safe-top\)\+75px\)\] flex h-10/);
  assert.doesNotMatch(chatScreenSource, /absolute left-4 top-\[75px\] flex h-10 w-\[361px\]/);
  assert.match(chatScreenSource, /<CreamContentBackground height=\{contentViewportHeight\} top=\{contentTop\} \/>/);
  assert.match(chatScreenSource, /className="absolute left-0 w-full overflow-hidden rounded-t-\[30px\] bg-\[#fff1d1\]"[\s\S]*style=\{\{ height, top \}\}/);
  assert.doesNotMatch(chatScreenSource, /top-\[calc\(var\(--qling-space-safe-top\)\+136px\)\] h-\[calc\(716px-var\(--qling-space-safe-top\)\)\]/);
});

test('chat list cards and empty state scale from their container width', () => {
  assert.match(chatScreenSource, /const chatListCardStyle = \{[\s\S]*padding: 'calc\(14 \/ 361 \* 100cqw\)'/);
  assert.match(chatScreenSource, /className="relative w-full cursor-pointer[\s\S]*\[container-type:inline-size\]"/);
  assert.match(chatScreenSource, /className="flex w-full flex-col items-start overflow-visible" style=\{chatListCardStyle\}/);
  assert.match(chatScreenSource, /style=\{chatListCardStyle\}/);
  assert.match(chatScreenSource, /style=\{chatListCardAvatarStyle\}/);
  assert.match(chatScreenSource, /style=\{chatListCardUnreadStyle\}/);
  assert.match(chatScreenSource, /const chatEmptyStateStyle = \{[\s\S]*width: 'calc\(301 \/ 393 \* 100cqw\)'/);
  assert.match(chatScreenSource, /className="flex flex-col items-center justify-center overflow-hidden text-center \[container-type:inline-size\]"/);
  assert.match(chatScreenSource, /style=\{chatEmptyTipTextStyle\}/);
  assert.match(chatScreenSource, /className="absolute bottom-0 left-0 flex w-full flex-col[\s\S]*\[container-type:inline-size\]"/);
  assert.match(chatScreenSource, /style=\{chatListActionSheetButtonStyle\}/);
});

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}
