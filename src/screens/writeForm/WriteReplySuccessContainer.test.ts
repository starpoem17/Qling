import test from 'node:test';
import assert from 'node:assert/strict';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import type { AppRouteViewState } from '../../services/appShell/prdNavigationPolicy';
import { WriteReplySuccessContainer } from './WriteReplySuccessContainer';
import { WriteReplySuccessScreen } from './WriteReplySuccessScreen';

test('write reply success confirmation suppresses answered delivery and returns to answer feed', () => {
  const events: string[] = [];
  let route: AppRouteViewState = { route: 'write_reply_success', deliveryId: 'delivery-1', worryId: 'worry-1' };
  const tree = WriteReplySuccessContainer({
    deliveryId: 'delivery-1',
    setView: next => {
      route = typeof next === 'function' ? next(route) : next;
    },
    onConfirmAnsweredDelivery: deliveryId => events.push(`suppress:${deliveryId}`),
  });

  confirm(findSuccessScreen(tree));

  assert.deepEqual(events, ['suppress:delivery-1']);
  assert.equal(route, '답변하기');
});

type TestElement = ReactElement<Record<string, unknown>>;

function findSuccessScreen(tree: ReactNode): TestElement {
  const found = findElement(tree, element => element.type === WriteReplySuccessScreen);
  return found;
}

function findElement(tree: ReactNode, predicate: (element: TestElement) => boolean): TestElement {
  const found = findOptionalElement(tree, predicate);
  assert.ok(found, 'element not found');
  return found;
}

function findOptionalElement(tree: ReactNode, predicate: (element: TestElement) => boolean): TestElement | null {
  if (!isValidElement(tree)) return null;
  const element = tree as TestElement;
  if (predicate(element)) return element;
  let found: TestElement | null = null;
  Children.forEach(element.props.children as ReactNode, child => {
    if (found) return;
    found = findOptionalElement(child, predicate);
  });
  return found;
}

function confirm(element: TestElement): void {
  const onConfirm = element.props.onConfirm;
  assert.equal(typeof onConfirm, 'function');
  (onConfirm as () => void)();
}
