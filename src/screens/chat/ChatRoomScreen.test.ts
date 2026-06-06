import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatRoomScreen } from './ChatRoomScreen';

function renderChatRoom(answerAdoptionRatePercent: number | null) {
  const worryContent = '고민 제목';
  return renderToStaticMarkup(createElement(ChatRoomScreen, {
    loading: false,
    error: null,
    messages: [],
    opponent: { nickname: '상대', profileColor: '#FF8B3D' },
    answerAdoptionRatePercent,
    worryInfo: { category: '일상', content: worryContent, createdAtStr: '2026. 6. 5' },
    opponentUnreadCount: 0,
    onBack: () => undefined,
    onSendMessage: async () => ({ success: true }),
    onNotificationOff: () => undefined,
    onLeaveChat: () => undefined,
    onReportUser: () => undefined,
  }));
}

test('chat room top bar renders answer adoption rate from props without hardcoded value', () => {
  const html = renderChatRoom(75);

  assert.match(html, /답변 채택률 75%/);
  assert.match(html, /aria-label="뒤로가기"/);
  assert.match(html, /grid-cols-\[44px_minmax\(0,1fr\)_44px\][\s\S]*pt-\[calc\(45px\+var\(--qling-pwa-direct-topbar-shift\)\)\]/);
  assert.match(html, /flex h-\[45px\] w-\[44px\] items-center justify-center/);
  assert.match(html, /flex h-\[45px\] min-w-0 items-center justify-center/);
  assert.doesNotMatch(html, /답변 채택률 92%/);
});

test('chat room top bar hides answer adoption rate while metrics are loading', () => {
  const html = renderChatRoom(null);

  assert.doesNotMatch(html, /답변 채택률/);
  assert.doesNotMatch(html, /92%/);
});

test('chat room input matches the attachment-free Figma layout', () => {
  const html = renderChatRoom(null);

  assert.doesNotMatch(html, /첨부 추가/);
  assert.doesNotMatch(html, /room_plus/);
  assert.match(html, /left-\[19px\] right-\[64px\] top-\[10\.2px\]/);
  assert.match(html, /aria-label="메시지 보내기"/);
});

test('chat room worry card renders full original content without fixed-height truncation', () => {
  const longOriginalContent = '첫 줄의 긴 고민 원문입니다.\n두 번째 줄도 그대로 보여야 합니다. '.repeat(12);
  const html = renderToStaticMarkup(createElement(ChatRoomScreen, {
    loading: false,
    error: null,
    messages: [],
    opponent: { nickname: '상대', profileColor: '#FF8B3D' },
    answerAdoptionRatePercent: null,
    worryInfo: { category: '일상', content: longOriginalContent, createdAtStr: '2026. 6. 5' },
    opponentUnreadCount: 0,
    onBack: () => undefined,
    onSendMessage: async () => ({ success: true }),
    onNotificationOff: () => undefined,
    onLeaveChat: () => undefined,
    onReportUser: () => undefined,
  }));

  assert.match(html, /첫 줄의 긴 고민 원문입니다/);
  assert.match(html, /두 번째 줄도 그대로 보여야 합니다/);
  assert.match(html, /whitespace-pre-wrap break-words/);
  assert.doesNotMatch(html, /h-\[99\.425px\]/);
  assert.doesNotMatch(html, /class="truncate/);
  assert.doesNotMatch(html, /이 고민의 답변에서 시작된 대화예요/);
});
