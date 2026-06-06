import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatRoomScreen } from './ChatRoomScreen';

function renderChatRoom(answerAdoptionRatePercent: number | null) {
  return renderToStaticMarkup(createElement(ChatRoomScreen, {
    loading: false,
    error: null,
    messages: [],
    opponent: { nickname: '상대', profileColor: '#FF8B3D' },
    answerAdoptionRatePercent,
    worryInfo: { category: '일상', title: '고민 제목', createdAtStr: '2026. 6. 5' },
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
  assert.match(html, /left-\[6px\] top-\[calc\(45px\+var\(--qling-pwa-direct-topbar-shift\)\)\] flex h-\[45px\] w-\[44px\]/);
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
