import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
      previewText: 'Preview text',
      bodyText: 'Body text',
      receivedAt: { label: 'Today', isoValue: '2026-05-16T00:00:00.000Z' },
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

test('received-worries feed item includes ids needed for pass and open events', () => {
  const props = {
    state: { status: 'ready' },
    items: [{
      deliveryId: 'delivery-1',
      worryId: 'worry-1',
      category: WORRY_CATEGORIES[0],
      previewText: 'Preview text',
      bodyText: 'Body text',
      receivedAt: { label: 'Today', isoValue: '2026-05-16T00:00:00.000Z' },
      isUnread: true,
    }],
    waitingCount: 1,
    passingDeliveryIds: ['delivery-1'],
    onPass: () => undefined,
    onOpen: () => undefined,
    onOpenMyPage: () => undefined,
  } satisfies ReceivedWorriesScreenProps;

  assert.equal(props.items[0].deliveryId, 'delivery-1');
  assert.equal(props.items[0].worryId, 'worry-1');
  assert.equal(props.items[0].isUnread, true);
  assert.equal(props.waitingCount, 1);
  assert.deepEqual(props.passingDeliveryIds, ['delivery-1']);
});

test('received-worries ready state renders waiting count from feed items', () => {
  const html = renderToStaticMarkup(ReceivedWorriesScreen(baseProps({
    waitingCount: 2,
    items: [
      baseProps().items[0],
      {
        ...baseProps().items[0],
        deliveryId: 'delivery-2',
        worryId: 'worry-2',
      },
    ],
  })));

  assert.match(html, /답변하기/);
  assert.match(html, /다른 친구의 고민에 마음을 나눠주세요/);
  assert.match(html, /지금 <strong class="text-\[#e8631a\]">2명<\/strong>이 답변을 기다리고 있어요/);

  const source = fs.readFileSync(path.join(process.cwd(), 'src/screens/receivedWorries/ReceivedWorriesScreen.tsx'), 'utf8');
  assert.doesNotMatch(source, /useScrollPeekHeader/);
  assert.doesNotMatch(source, /PeekHeaderScrollArea/);
  assert.doesNotMatch(source, /QlingPeekHeader/);
  assert.doesNotMatch(source, /qling-peek-progress|translateY\(calc/);
});

test('received-worries contract represents loading, error, and empty states', () => {
  const states: ReceivedWorriesScreenProps['state'][] = [
    { status: 'loading', label: 'Loading feed' },
    { status: 'error', message: 'Feed failed', canRetry: true },
    { status: 'empty', message: 'No items' },
  ];

  assert.deepEqual(states.map(state => state.status), ['loading', 'error', 'empty']);
});

test('received-worries contract has no completed-reply display state', () => {
  const itemKeys = Object.keys({
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    category: WORRY_CATEGORIES[0],
    previewText: 'Preview text',
    receivedAt: { label: 'Today' },
    isUnread: false,
  });

  for (const forbidden of ['completedReply', 'answered', 'replyCompletedDisplay', 'showCompletedReply']) {
    assert.equal(itemKeys.includes(forbidden), false);
  }
});

test('received-worries pass callback accepts delivery id without a DOM event', () => {
  type PassCallbackParameter = Parameters<ReceivedWorriesScreenProps['onPass']>[0];
  const deliveryId: PassCallbackParameter = 'delivery-1';

  assert.equal(deliveryId, 'delivery-1');
});

test('received-worries contract exposes my-page intent without reply duplicate intent', () => {
  const callbacks = {
    onPass: () => undefined,
    onOpen: () => undefined,
    onOpenMyPage: () => undefined,
  } satisfies Pick<ReceivedWorriesScreenProps, 'onPass' | 'onOpen' | 'onOpenMyPage'>;

  assert.equal(typeof callbacks.onOpenMyPage, 'function');
  assert.equal(Object.keys(callbacks).includes('onReply'), false);
});

test('received-worries empty state renders the fixed Figma intro without an empty card', () => {
  const html = renderToStaticMarkup(ReceivedWorriesScreen(baseProps({
    state: { status: 'empty', message: '지금은 도착한 고민이 없어요.' },
    items: [],
    waitingCount: 0,
  })));

  assert.match(html, /답변하기/);
  assert.match(html, /다른 친구의 고민에 마음을 나눠주세요/);
  assert.match(html, /지금 <strong class="text-\[#e8631a\]">0명<\/strong>이 답변을 기다리고 있어요/);
  assert.doesNotMatch(html, /다른 사람들의 고민을 기다리는 중이에요/);
  assert.doesNotMatch(html, /지금은 도착한 고민이 없어요\./);
  assert.doesNotMatch(html, /첫 고민을 남겨보세요/);
  assert.doesNotMatch(html, /고민 쓰기|다시 시도|네트워크/);
  assert.match(html, /mx-auto flex h-full w-full justify-center overflow-hidden max-w-\[480px\]/);
  assert.match(html, /relative h-full min-h-0 w-full max-w-\[480px\] shrink-0 origin-top overflow-hidden bg-\[#ff8b3d\]/);
  assert.doesNotMatch(html, /transform:scale/);
  assert.match(html, /right-\[17px\] top-\[calc\(var\(--qling-space-safe-top\)\+21px\)\] h-\[49px\] w-\[49px\]/);
  assert.doesNotMatch(html, /left-\[327px\] top-\[21px\]/);
  assert.match(html, /absolute left-0 w-full rounded-t-\[32px\] bg-\[#fff1d1\]/);
  assert.match(html, /absolute left-0 w-full touch-none overscroll-none overflow-hidden rounded-t-\[32px\] px-4 pt-4/);
  assert.match(html, /height:max\(320px, calc\(\(var\(--qling-tab-viewport-height\)\) - 74px - var\(--qling-space-safe-top\)\)\);top:calc\(74px \+ var\(--qling-space-safe-top\)\)/);
  assert.doesNotMatch(html, /min\(752px/);
  assert.doesNotMatch(html, /받은 고민 목록/);
  assert.doesNotMatch(html, /overflow-y-auto/);

  const source = fs.readFileSync(path.join(process.cwd(), 'src/screens/receivedWorries/ReceivedWorriesScreen.tsx'), 'utf8');
  const emptyStart = source.indexOf("props.state.status === 'empty'");
  const emptyBranch = source.slice(emptyStart, source.indexOf('\n  return (', emptyStart));
  assert.match(emptyBranch, /onWheel=\{blockLoadingScroll\}/);
  assert.match(emptyBranch, /onTouchMove=\{blockLoadingScroll\}/);
  assert.doesNotMatch(emptyBranch, /PeekHeaderScrollArea/);
  assert.doesNotMatch(emptyBranch, /overflow-y-auto/);
  assert.doesNotMatch(emptyBranch, /QlingCard/);
});

test('received-worries loading state renders the Figma spinner status without visible copy', () => {
  const html = renderToStaticMarkup(ReceivedWorriesScreen(baseProps({
    state: { status: 'loading', label: '답변할 고민을 불러오는 중이에요.' },
    items: [],
  })));

  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /data-testid="figma-tab-loading-indicator"/);
  assert.match(html, /left-1\/2 h-10 w-10 -translate-x-1\/2 top-\[332px\]/);
  assert.match(html, /답변할 고민을 불러오는 중이에요\./);
  assert.doesNotMatch(html, /고민을 불러오고 있어요/);
  assert.doesNotMatch(html, /skeleton|Skeleton|data-testid=".*skeleton/i);
  assert.match(html, /-mx-\[var\(--qling-space-shell-x\)\] h-\[var\(--qling-tab-viewport-height\)\] overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /mx-auto flex h-full w-full justify-center overflow-hidden max-w-\[480px\]/);
  assert.match(html, /relative h-full min-h-0 w-full max-w-\[480px\] shrink-0 origin-top overflow-hidden bg-\[#ff8b3d\]/);
  assert.doesNotMatch(html, /transform:scale/);
  assert.match(html, /h-\[calc\(74px\+var\(--qling-space-safe-top\)\)\]/);
  assert.match(html, /bg-\[#ff8b3d\]/);
  assert.match(html, /w-full touch-none overscroll-none overflow-hidden/);
  assert.match(html, /height:max\(320px, calc\(\(var\(--qling-tab-viewport-height\)\) - 74px - var\(--qling-space-safe-top\)\)\);top:calc\(74px \+ var\(--qling-space-safe-top\)\)/);
  assert.doesNotMatch(html, /min\(752px/);
  assert.doesNotMatch(html, /h-\[752px\] overflow-y-auto/);
  assert.doesNotMatch(html, /w-\[100dvw\]/);
  assert.doesNotMatch(html, /min-h-\[calc\(100dvh-180px\)\]/);
  assert.doesNotMatch(html, /100dvh-120px-var\(--qling-space-nav-height\)/);
  assert.doesNotMatch(html, /100dvh-120px-var\(--qling-space-scroll-bottom\)/);

  const source = fs.readFileSync(path.join(process.cwd(), 'src/screens/receivedWorries/ReceivedWorriesScreen.tsx'), 'utf8');
  const loadingBranch = source.slice(source.indexOf("props.state.status === 'loading'"), source.indexOf("if (props.state.status === 'error')"));
  assert.match(loadingBranch, /onWheel=\{blockLoadingScroll\}/);
  assert.match(loadingBranch, /onTouchMove=\{blockLoadingScroll\}/);
  assert.doesNotMatch(loadingBranch, /scrollPeekHeader\.onScroll/);
  assert.doesNotMatch(loadingBranch, /scrollPeekHeader\.onTouchStart/);
  assert.doesNotMatch(loadingBranch, /PeekHeaderScrollArea/);
});
