import test from 'node:test';
import assert from 'node:assert/strict';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { WriteWorrySuccessContainer } from './WriteWorrySuccessContainer';
import { WriteWorrySuccessScreen } from './WriteWorrySuccessScreen';

test('write worry success container confirms back to my worries tab alias', () => {
  let nextRoute: unknown;
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { scrollTo: () => undefined },
  });

  try {
    const tree = WriteWorrySuccessContainer({
      setView: value => {
        nextRoute = typeof value === 'function' ? value('write_worry_success') : value;
      },
    });

    confirm(findSuccessScreen(tree));
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  }

  assert.equal(nextRoute, '나의 고민');
});

type TestElement = ReactElement<Record<string, unknown>>;

function findSuccessScreen(tree: ReactNode): TestElement {
  const found = findElement(tree, element => element.type === WriteWorrySuccessScreen);
  assert.ok(found, 'success screen not found');
  return found;
}

function findElement(tree: ReactNode, predicate: (element: TestElement) => boolean): TestElement | null {
  if (!isValidElement(tree)) return null;
  const element = tree as TestElement;
  if (predicate(element)) return element;
  let found: TestElement | null = null;
  Children.forEach(element.props.children as ReactNode, child => {
    if (found) return;
    found = findElement(child, predicate);
  });
  return found;
}

function confirm(element: TestElement): void {
  const onConfirm = element.props.onConfirm;
  assert.equal(typeof onConfirm, 'function');
  (onConfirm as () => void)();
}
