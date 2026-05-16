import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import {
  canStartPassMutation,
  stateForReceivedWorries,
} from './containerPolicy';
import type { ReceivedWorryFeedItem } from './contract';

const item: ReceivedWorryFeedItem = {
  deliveryId: 'delivery-1',
  worryId: 'worry-1',
  category: WORRY_CATEGORIES[0],
  previewText: 'Preview',
  receivedAt: { label: '수신됨' },
  isUnread: false,
};

test('received-worries container policy maps loading error empty and ready states', () => {
  assert.deepEqual(stateForReceivedWorries({
    feedStatus: 'loading',
    feedError: null,
    items: [],
  }), { status: 'loading', label: '답변할 고민을 불러오는 중이에요.' });

  assert.deepEqual(stateForReceivedWorries({
    feedStatus: 'error',
    feedError: 'API failed',
    items: [],
  }), { status: 'error', message: 'API failed', canRetry: true });

  assert.deepEqual(stateForReceivedWorries({
    feedStatus: 'ready',
    feedError: null,
    items: [],
  }), { status: 'empty', message: '아직 답변할 고민이 없어요.' });

  assert.deepEqual(stateForReceivedWorries({
    feedStatus: 'ready',
    feedError: null,
    items: [item],
  }), { status: 'ready' });
});

test('received-worries pass mutation starts only once per delivery id', () => {
  assert.equal(canStartPassMutation({
    deliveryId: 'delivery-1',
    passingDeliveryIds: new Set(),
  }), true);

  assert.equal(canStartPassMutation({
    deliveryId: 'delivery-1',
    passingDeliveryIds: new Set(['delivery-1']),
  }), false);

  assert.equal(canStartPassMutation({
    deliveryId: 'delivery-2',
    passingDeliveryIds: new Set(['delivery-1']),
  }), true);
});
