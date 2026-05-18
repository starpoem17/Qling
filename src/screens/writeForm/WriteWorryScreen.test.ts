import test from 'node:test';
import assert from 'node:assert/strict';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WriteWorryScreen } from './WriteWorryScreen';
import type { WriteWorryScreenProps } from './contract';

const validDraft = {
  value: '',
  characterCount: 0,
  maxLength: 1000,
  validation: { status: 'invalid', message: '내용을 입력해주세요.' },
  moderation: { status: 'idle' },
  isProcessing: false,
  submitDisabledReason: 'empty',
} as const;

function baseProps(overrides: Partial<WriteWorryScreenProps> = {}): WriteWorryScreenProps {
  return {
    draft: validDraft,
    onBack: () => undefined,
    onDraftChange: () => undefined,
    onPublish: () => undefined,
    ...overrides,
  };
}

test('write worry screen renders pencil visual placeholder only for an empty draft', () => {
  const emptyHtml = renderToStaticMarkup(WriteWorryScreen(baseProps()));
  const filledHtml = renderToStaticMarkup(WriteWorryScreen(baseProps({
    draft: {
      ...validDraft,
      value: '오늘은 고민이 있습니다.',
      characterCount: 12,
      validation: { status: 'valid' },
      submitDisabledReason: undefined,
    },
  })));

  assert.match(emptyHtml, /당신의 솔직한 이야기를 들려주세요/);
  assert.match(emptyHtml, /write-worry-pencil/);
  assert.doesNotMatch(emptyHtml, /placeholder=/);
  assert.doesNotMatch(filledHtml, /당신의 솔직한 이야기를 들려주세요/);
  assert.doesNotMatch(filledHtml, /write-worry-pencil/);
});

test('write worry screen forwards typing, back, and publish events', () => {
  const events: string[] = [];
  const tree = WriteWorryScreen(baseProps({
    draft: {
      ...validDraft,
      value: '보낼 수 있는 고민',
      characterCount: 9,
      validation: { status: 'valid' },
      submitDisabledReason: undefined,
    },
    onBack: () => events.push('back'),
    onDraftChange: value => events.push(`draft:${value}`),
    onPublish: () => events.push('publish'),
  }));

  change(findElement(tree, element => element.type === 'textarea'), '바뀐 고민');
  click(findButtonByAriaLabel(tree, /나의 고민으로 돌아가기/));
  click(findElement(tree, element => element.props.accessibilityLabel === '고민 전송'));

  assert.deepEqual(events, ['draft:바뀐 고민', 'back', 'publish']);
});

test('write worry screen reflects validation disabled state and moderation copy', () => {
  const rejectedHtml = renderToStaticMarkup(WriteWorryScreen(baseProps({
    draft: {
      ...validDraft,
      value: '차단된 내용',
      characterCount: 6,
      validation: { status: 'valid' },
      moderation: { status: 'rejected', reason: '개인정보가 포함되어 있어요.', helpMessage: '연락처는 지워주세요.' },
      submitDisabledReason: undefined,
    },
  })));
  const failedHtml = renderToStaticMarkup(WriteWorryScreen(baseProps({
    draft: {
      ...validDraft,
      value: '실패한 내용',
      characterCount: 6,
      validation: { status: 'valid' },
      moderation: { status: 'failed', message: '전송 실패: network down' },
      submitDisabledReason: undefined,
    },
  })));
  const disabledCta = findElement(WriteWorryScreen(baseProps()), element => element.props.accessibilityLabel === '고민 전송');

  assert.equal(propsOf(disabledCta).disabled, true);
  assert.match(rejectedHtml, /개인정보가 포함되어 있어요\./);
  assert.match(rejectedHtml, /연락처는 지워주세요\./);
  assert.match(failedHtml, /전송 실패: network down/);
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
  const children = element.props.children as ReactNode;
  let found: TestElement | null = null;
  Children.forEach(children, child => {
    if (found) return;
    found = findOptionalElement(child, predicate);
  });
  return found;
}

function propsOf(element: TestElement): Record<string, unknown> {
  return element.props;
}

function click(element: TestElement): void {
  const onClick = propsOf(element).onClick;
  assert.equal(typeof onClick, 'function');
  (onClick as () => void)();
}

function change(element: TestElement, value: string): void {
  const onChange = propsOf(element).onChange;
  assert.equal(typeof onChange, 'function');
  (onChange as (event: { currentTarget: { value: string } }) => void)({ currentTarget: { value } });
}
