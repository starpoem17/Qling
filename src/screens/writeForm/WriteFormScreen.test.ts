import test from 'node:test';
import assert from 'node:assert/strict';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import { WriteFormScreen } from './WriteFormScreen';
import type { WriteFormScreenProps } from './contract';

const baseDraft = {
  value: '',
  characterCount: 0,
  maxLength: 1000,
  validation: { status: 'invalid', message: '내용을 입력해주세요.' },
  moderation: { status: 'idle' },
  isProcessing: false,
  submitDisabledReason: 'empty',
} as const;

function baseProps(overrides: Partial<WriteFormScreenProps> = {}): WriteFormScreenProps {
  return {
    kind: 'write-reply',
    originalWorry: {
      deliveryId: 'delivery-1',
      worryId: 'worry-1',
      category: WORRY_CATEGORIES[0],
      summaryText: '요약만 기본 카드에 표시됩니다.',
      originalBodyText: '원문 전체는 overlay 안에서만 표시됩니다.',
      receivedAt: { label: '2026-05-18', isoValue: '2026-05-18T00:00:00.000Z' },
    },
    draft: baseDraft,
    isOriginalOverlayOpen: false,
    onBack: () => undefined,
    onDraftChange: () => undefined,
    onOpenOriginal: () => undefined,
    onCloseOriginal: () => undefined,
    onPublish: () => undefined,
    ...overrides,
  };
}

test('write reply screen shows summary on the base card and keeps original body out until overlay opens', () => {
  const closedHtml = renderToStaticMarkup(WriteFormScreen(baseProps()));
  const openHtml = renderToStaticMarkup(WriteFormScreen(baseProps({ isOriginalOverlayOpen: true })));

  assert.match(closedHtml, /요약만 기본 카드에 표시됩니다\./);
  assert.doesNotMatch(closedHtml, /원문 전체는 overlay 안에서만 표시됩니다\./);
  assert.match(openHtml, /원문 전체는 overlay 안에서만 표시됩니다\./);
  assert.match(openHtml, /role="dialog"/);
});

test('write reply screen renders visual pencil placeholder only for an empty draft', () => {
  const emptyHtml = renderToStaticMarkup(WriteFormScreen(baseProps()));
  const filledHtml = renderToStaticMarkup(WriteFormScreen(baseProps({
    draft: {
      ...baseDraft,
      value: '작성 중인 답변',
      characterCount: 8,
      validation: { status: 'valid' },
      submitDisabledReason: undefined,
    },
  })));

  assert.match(emptyHtml, /고민자에게 따뜻한 말을 전달해주세요!/);
  assert.match(emptyHtml, /write-reply-pencil-placeholder/);
  assert.doesNotMatch(emptyHtml, /placeholder=/);
  assert.doesNotMatch(filledHtml, /write-reply-pencil-placeholder/);
  assert.doesNotMatch(filledHtml, /고민자에게 따뜻한 말을 전달해주세요!/);
});

test('write reply screen forwards back, overlay, draft, close, and publish events without route objects', () => {
  const events: string[] = [];
  const tree = WriteFormScreen(baseProps({
    draft: {
      ...baseDraft,
      value: '보낼 수 있는 답변',
      characterCount: 9,
      validation: { status: 'valid' },
      submitDisabledReason: undefined,
    },
    onBack: () => events.push('back'),
    onDraftChange: value => events.push(`draft:${value}`),
    onOpenOriginal: () => events.push('open-original'),
    onCloseOriginal: () => events.push('close-original'),
    onPublish: target => events.push(`publish:${target.deliveryId}:${target.worryId}`),
    isOriginalOverlayOpen: true,
  }));

  click(findButtonByAriaLabel(tree, /원문 보기/));
  change(findElement(tree, element => element.type === 'textarea'), '바뀐 답변');
  click(findButtonByAriaLabel(tree, /원문 닫기/));
  click(findButtonByAriaLabel(tree, /답변하기로 돌아가기/));
  click(findElement(tree, element => element.props.accessibilityLabel === '답변 전송'));

  assert.deepEqual(events, [
    'open-original',
    'draft:바뀐 답변',
    'close-original',
    'back',
    'publish:delivery-1:worry-1',
  ]);
});

test('write reply screen does not expose publisher profile metadata', () => {
  const html = renderToStaticMarkup(WriteFormScreen(baseProps({
    isOriginalOverlayOpen: true,
  })));

  for (const forbidden of ['publisher nickname', 'gender', 'age', 'interests', 'profile metadata', 'author-uid']) {
    assert.equal(html.includes(forbidden), false);
  }
});

type TestElement = ReactElement<Record<string, unknown>>;

function findButtonByAriaLabel(tree: ReactNode, pattern: RegExp): TestElement {
  return findElement(tree, element => element.type === 'button' && pattern.test(String(element.props['aria-label'] ?? '')));
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

function click(element: TestElement): void {
  const onClick = element.props.onClick;
  assert.equal(typeof onClick, 'function');
  (onClick as () => void)();
}

function change(element: TestElement, value: string): void {
  const onChange = element.props.onChange;
  assert.equal(typeof onChange, 'function');
  (onChange as (event: { currentTarget: { value: string } }) => void)({ currentTarget: { value } });
}
