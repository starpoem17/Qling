import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import { ReceivedWorriesScreen } from './ReceivedWorriesScreen';
import type { ReceivedWorriesScreenProps } from './contract';

function baseProps(overrides: Partial<ReceivedWorriesScreenProps> = {}): ReceivedWorriesScreenProps {
  return {
    state: { status: 'ready' },
    items: [{
      deliveryId: 'delivery-1',
      worryId: 'worry-1',
      category: WORRY_CATEGORIES[0],
      previewText: '진로 고민이 있어요.',
      receivedAt: { label: '방금 전', isoValue: '2026-06-05T00:00:00.000Z' },
      isUnread: true,
    }],
    waitingCount: 1,
    passingDeliveryIds: [],
    onPass: () => undefined,
    onOpen: () => undefined,
    onOpenMyPage: () => undefined,
    ...overrides,
  };
}

test('received worries scroll sheet uses the visual viewport height and keeps bottom padding', () => {
  const html = renderToStaticMarkup(ReceivedWorriesScreen(baseProps()));

  assert.match(html, /답변하기/);
  assert.match(html, /답변하기 화면에?[^"]*|받은 고민 목록/);
  assert.match(html, /style="height:min\(752px, max\(320px, calc\(\(calc\(var\(--qling-visual-viewport-height\) - var\(--qling-space-nav-height\)\)\) \/ \(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)\) - 74px\)\)\)"/);
  assert.match(html, /overflow-y-auto rounded-t-\[32px\] px-4 pb-\[calc\(132px\+env\(safe-area-inset-bottom,0px\)\)\] pt-4/);
  assert.doesNotMatch(html, /h-\[752px\] w-full overflow-y-auto/);
});

test('received worries empty and loading states share the same visual viewport sheet height', () => {
  const emptyHtml = renderToStaticMarkup(ReceivedWorriesScreen(baseProps({
    state: { status: 'empty', message: '지금은 도착한 고민이 없어요.' },
    items: [],
  })));
  const loadingHtml = renderToStaticMarkup(ReceivedWorriesScreen(baseProps({
    state: { status: 'loading', label: '받은 고민을 불러오는 중' },
    items: [],
  })));

  assert.match(emptyHtml, /받은 고민 빈 상태/);
  assert.match(loadingHtml, /받은 고민 로딩 상태/);
  assert.match(emptyHtml, /var\(--qling-visual-viewport-height\)/);
  assert.match(loadingHtml, /var\(--qling-visual-viewport-height\)/);
  assert.doesNotMatch(emptyHtml, /h-\[752px\] w-full touch-none/);
  assert.doesNotMatch(loadingHtml, /h-\[752px\] w-full touch-none/);
});

test('received worries cards truncate text at 50 characters only when needed', () => {
  const exactText = '12345678901234567890123456789012345678901234567890';
  const longText = `${exactText}1`;
  const exactHtml = renderToStaticMarkup(ReceivedWorriesScreen(baseProps({
    items: [{
      ...baseProps().items[0],
      previewText: exactText,
    }],
  })));
  const longHtml = renderToStaticMarkup(ReceivedWorriesScreen(baseProps({
    items: [{
      ...baseProps().items[0],
      previewText: longText,
    }],
  })));

  assert.match(exactHtml, new RegExp(`>${exactText}<`));
  assert.doesNotMatch(exactHtml, new RegExp(`${exactText}\\.\\.\\.`));
  assert.match(longHtml, new RegExp(`>${exactText}\\.\\.\\.<`));
  assert.equal(`${exactText}...`.length, 53);
  assert.doesNotMatch(longHtml, new RegExp(longText));
});
