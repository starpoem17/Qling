import test from 'node:test';
import assert from 'node:assert/strict';
import { routeForMyWorryAnswerCheck, stateForMyWorries } from './MyWorriesContainerPolicy';
import type { MyWorryListItemProps } from './contract';
import type { MyWorryListItem } from '../../services/myWorries';

const screenItem: MyWorryListItemProps = {
  worryId: 'worry-1',
  summaryText: '요약...',
  categoryLabel: '잡담',
  createdAtLabel: '방금 전',
  replyCountLabel: '아직 답변이 없어요.',
  accessibilityLabel: '답변 확인으로 이동',
};

const worry: MyWorryListItem = {
  id: 'worry-1',
  authorUid: 'me',
  content: '원문',
  categories: ['잡담'],
  createdAt: null,
  humanReplyCount: 0,
  source: 'prd_worries',
};

test('my worries container policy maps loading error empty and ready states', () => {
  assert.deepEqual(stateForMyWorries({
    isLoading: true,
    error: null,
    itemCount: 0,
  }), { status: 'loading', label: '작성한 고민을 불러오고 있습니다.' });

  assert.deepEqual(stateForMyWorries({
    isLoading: false,
    error: 'load failed',
    itemCount: 0,
  }), { status: 'error', message: 'load failed', canRetry: false });

  assert.deepEqual(stateForMyWorries({
    isLoading: false,
    error: null,
    itemCount: 0,
  }), { status: 'empty', message: '첫 고민을 남겨보세요.' });

  assert.deepEqual(stateForMyWorries({
    isLoading: false,
    error: null,
    itemCount: 1,
  }), { status: 'ready' });
});

test('my worries container routes selected item to answer_check and stores selected worry', () => {
  const selection = routeForMyWorryAnswerCheck({
    item: screenItem,
    worries: [worry],
  });

  assert.deepEqual(selection, {
    selectedWorry: worry,
    route: { route: 'answer_check', worryId: 'worry-1' },
  });
});

test('my worries container ignores stale screen items not present in the read model', () => {
  assert.equal(routeForMyWorryAnswerCheck({
    item: { ...screenItem, worryId: 'missing' },
    worries: [worry],
  }), null);
});
