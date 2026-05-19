import test from 'node:test';
import assert from 'node:assert/strict';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WriteWorrySuccessScreen } from './WriteWorrySuccessScreen';

test('write worry success screen renders confirmation copy and exactly one interactive button', () => {
  const html = renderToStaticMarkup(WriteWorrySuccessScreen({ onConfirm: () => undefined }));
  const buttons = html.match(/<button\b/g) ?? [];

  assert.match(html, /고민 전송이 완료되었어요 !/);
  assert.match(html, /답변이 오면 알려드릴게요/);
  assert.equal(buttons.length, 1);
  assert.match(html, /aria-label="고민 전송 완료 확인"/);
});

test('write worry success screen forwards confirm intent only', () => {
  let confirmed = false;
  const confirmCta = findElement(WriteWorrySuccessScreen({
    onConfirm: () => {
      confirmed = true;
    },
  }), element => element.props.accessibilityLabel === '고민 전송 완료 확인');

  confirm(confirmCta);

  assert.equal(confirmed, true);
});

type TestElement = ReactElement<Record<string, unknown>>;

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
