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
      previewText: 'Preview text',
      bodyText: 'Body text',
      receivedAt: { label: 'Today', isoValue: '2026-05-16T00:00:00.000Z' },
      isUnread: true,
    }],
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
    passingDeliveryIds: ['delivery-1'],
    onPass: () => undefined,
    onOpen: () => undefined,
    onOpenMyPage: () => undefined,
  } satisfies ReceivedWorriesScreenProps;

  assert.equal(props.items[0].deliveryId, 'delivery-1');
  assert.equal(props.items[0].worryId, 'worry-1');
  assert.equal(props.items[0].isUnread, true);
  assert.deepEqual(props.passingDeliveryIds, ['delivery-1']);
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

test('received-worries empty state renders exact PRD copy without extra helper text', () => {
  const html = renderToStaticMarkup(ReceivedWorriesScreen(baseProps({
    state: { status: 'empty', message: '지금은 도착한 고민이 없어요.' },
    items: [],
  })));

  assert.match(html, /지금은 도착한 고민이 없어요\./);
  assert.equal((html.match(/지금은 도착한 고민이 없어요\./g) ?? []).length, 1);
  assert.doesNotMatch(html, /첫 고민을 남겨보세요/);
  assert.doesNotMatch(html, /고민 쓰기|다시 시도|네트워크/);
});

test('received-worries loading state renders the shared spinner status without skeleton UI', () => {
  const html = renderToStaticMarkup(ReceivedWorriesScreen(baseProps({
    state: { status: 'loading', label: '답변할 고민을 불러오는 중이에요.' },
    items: [],
  })));

  assert.match(html, /role="status"/);
  assert.match(html, /aria-label="고민을 불러오고 있어요"/);
  assert.match(html, /답변할 고민을 불러오는 중이에요\./);
  assert.doesNotMatch(html, /skeleton|Skeleton|data-testid=".*skeleton/i);
  assert.match(html, /h-\[100px\]/);
  assert.match(html, /min-h-\[calc\(100%-100px\)\]/);
  assert.doesNotMatch(html, /100dvh-120px-var\(--qling-space-nav-height\)/);
  assert.doesNotMatch(html, /100dvh-120px-var\(--qling-space-scroll-bottom\)/);
});
