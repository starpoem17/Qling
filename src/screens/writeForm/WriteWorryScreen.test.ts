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

test('write worry screen uses Figma canvas positions while keeping the send button above the shell bottom nav', () => {
  const html = renderToStaticMarkup(WriteWorryScreen(baseProps()));

  assert.match(html, /w-\[393px\]/);
  assert.match(html, /h-\[852px\]/);
  assert.match(html, /transform:scale\(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)\)/);
  assert.match(html, /고민 작성/);
  assert.doesNotMatch(html, /질문 작성/);
  assert.match(html, /left-5 top-\[120px\] w-\[353px\]/);
  assert.match(html, /height:min\(541px, max\(240px, calc\(min\(684px, calc\(\(100dvh - var\(--qling-space-nav-height\)\) \/ \(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)\) - 88px\)\) - 143px\)\)\)/);
  assert.match(html, /top:min\(684px, calc\(\(100dvh - var\(--qling-space-nav-height\)\) \/ \(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)\) - 88px\)\)/);
  assert.match(html, /pl-\[16\.5px\]/);
  assert.match(html, /text-\[16px\] font-bold leading-6 tracking-\[-0\.36px\]/);
  assert.match(html, /left-\[22\.5px\] top-\[20\.5px\]/);
  assert.match(html, /text-\[16px\] font-bold leading-6 tracking-\[-0\.64px\]/);
  assert.doesNotMatch(html, /100dvh-var\(--qling-space-scroll-bottom\)/);
  assert.doesNotMatch(html, /flex h-full min-h-0 flex-col/);
  assert.doesNotMatch(html, /top-\[684px\]/);
  assert.doesNotMatch(html, /top-\[69px\]/);
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

  change(findElement(tree, element => element.type === 'textarea'), '팉 킽 킻 킼');
  click(findButtonByAriaLabel(tree, /나의 고민으로 돌아가기/));
  click(findButtonByAriaLabel(tree, /고민 전송/));

  assert.deepEqual(events, ['draft:팉 킽 킻 킼', 'back', 'publish']);
});

test('write worry screen reflects validation disabled state and moderation copy', () => {
  const invalidHtml = renderToStaticMarkup(WriteWorryScreen(baseProps({
    draft: {
      ...validDraft,
      value: '짧음',
      characterCount: 2,
      validation: { status: 'invalid', message: '조금 더 자세히 적어주세요.' },
    },
  })));
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
  const checkingHtml = renderToStaticMarkup(WriteWorryScreen(baseProps({
    draft: {
      ...validDraft,
      value: '확인 중인 내용',
      characterCount: 7,
      validation: { status: 'valid' },
      moderation: { status: 'checking' },
      submitDisabledReason: 'moderation-pending',
    },
  })));
  const disabledCta = findButtonByAriaLabel(WriteWorryScreen(baseProps()), /고민 전송/);

  assert.equal(propsOf(disabledCta).disabled, true);
  assert.match(invalidHtml, /role="alertdialog"/);
  assert.match(invalidHtml, /조금 더 자세히 적어주세요\./);
  assert.match(invalidHtml, /확인/);
  assert.match(rejectedHtml, /개인정보가 포함되어 있어요\./);
  assert.match(rejectedHtml, /연락처는 지워주세요\./);
  assert.match(failedHtml, /전송 실패: network down/);
  assert.doesNotMatch(checkingHtml, /AI 안심 필터가 내용을 확인하고 있습니다\./);
  assert.doesNotMatch(checkingHtml, /role="alertdialog"/);
});

test('write worry popup confirm hides only the popup element', () => {
  let hidden = false;
  const tree = WriteWorryScreen(baseProps({
    draft: {
      ...validDraft,
      value: '짧음',
      characterCount: 2,
      validation: { status: 'invalid', message: '조금 더 자세히 적어주세요.' },
    },
  }));
  const confirmButton = findButtonByAriaLabel(tree, /고민 작성 알림 확인/);

  click(confirmButton, {
    currentTarget: {
      closest: () => ({
        setAttribute: (name: string, value: string) => {
          if (name === 'hidden' && value === '') hidden = true;
        },
      }),
    },
  });

  assert.equal(hidden, true);
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

function click(element: TestElement, event?: unknown): void {
  const onClick = propsOf(element).onClick;
  assert.equal(typeof onClick, 'function');
  (onClick as (event?: unknown) => void)(event);
}

function change(element: TestElement, value: string): void {
  const onChange = propsOf(element).onChange;
  assert.equal(typeof onChange, 'function');
  (onChange as (event: { currentTarget: { value: string } }) => void)({ currentTarget: { value } });
}
