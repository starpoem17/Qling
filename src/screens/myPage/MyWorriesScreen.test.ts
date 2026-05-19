import test from 'node:test';
import assert from 'node:assert/strict';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MyWorriesScreen } from './MyWorriesScreen';
import type { MyWorriesScreenProps } from './contract';

const item = {
  worryId: 'worry-1',
  summaryText: '꾸미고 싶은데 안 꾸며봐서 어떻게 꾸며야 할 지 잘 모르겠어요...',
  categoryLabel: '외모',
  createdAtLabel: '2026.05.02',
  replyCountLabel: '5명이 답변했어요',
  hasUnreadReplies: true,
  accessibilityLabel: '답변 확인으로 이동, 카테고리 외모, 작성일 2026.05.02, 5명이 답변했어요, 읽지 않은 답장 있음',
} as const;

function baseProps(overrides: Partial<MyWorriesScreenProps> = {}): MyWorriesScreenProps {
  return {
    state: { status: 'ready' },
    items: [item],
    onWriteWorry: () => undefined,
    onOpenMyPage: () => undefined,
    onSelectWorryForAnswers: () => undefined,
    ...overrides,
  };
}

test('my worries screen is a list-only screen without inline received-reply panel', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps()));

  assert.match(html, /나의 고민 목록/);
  assert.match(html, /꾸미고 싶은데/);
  assert.doesNotMatch(html, /선택한 고민/);
  assert.doesNotMatch(html, /도착한 답장/);
  assert.doesNotMatch(html, /누군가의 따뜻한 답장/);
  assert.doesNotMatch(html, /받은 답장 상세로 이동/);
});

test('my worries card click invokes answer-check intent with the selected worry item', () => {
  let selectedWorryId: string | undefined;
  const tree = MyWorriesScreen(baseProps({
    onSelectWorryForAnswers: selected => {
      selectedWorryId = selected.worryId;
    },
  }));

  const button = findButtonByAriaLabel(tree, /답변 확인으로 이동/);
  click(button);

  assert.equal(selectedWorryId, 'worry-1');
});

test('my worries screen actions match PRD entry points', () => {
  let openedMyPage = false;
  let openedWrite = false;
  const tree = MyWorriesScreen(baseProps({
    onOpenMyPage: () => {
      openedMyPage = true;
    },
    onWriteWorry: () => {
      openedWrite = true;
    },
  }));

  const eye = findElementByTestId(tree, 'my-worries-top-left-eye');
  assert.equal(eye.type, 'div');
  assert.equal(typeof propsOf(eye).onClick, 'undefined');

  click(findButtonByAriaLabel(tree, /마이페이지 열기/));
  click(findButtonByAriaLabel(tree, /고민 작성 화면으로 이동/));

  assert.equal(openedMyPage, true);
  assert.equal(openedWrite, true);
});

test('my worries empty state uses PRD copy without a separate empty CTA', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps({
    state: { status: 'empty', message: '첫 고민을 남겨보세요.' },
    items: [],
  })));

  assert.match(html, /첫 고민을 남겨보세요\./);
  assert.match(html, /고민 작성 화면으로 이동/);
  assert.doesNotMatch(html, /고민 쓰기/);
  assert.equal((html.match(/고민 작성 화면으로 이동/g) ?? []).length, 1);
});

test('my worries loading state renders the shared spinner status without skeleton UI', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps({
    state: { status: 'loading', label: '작성한 고민을 불러오고 있습니다.' },
    items: [],
  })));

  assert.match(html, /role="status"/);
  assert.match(html, /aria-label="나의 고민을 불러오는 중"/);
  assert.match(html, /작성한 고민을 불러오고 있습니다\./);
  assert.doesNotMatch(html, /skeleton|Skeleton|data-testid=".*skeleton/i);
});

test('my worries DOM does not render answer writer private data', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps({
    items: [{
      ...item,
      summaryText: '요약만 표시합니다...',
      accessibilityLabel: '답변 확인으로 이동, 카테고리 외모, 1명이 답변했어요',
    }],
  })));

  for (const forbidden of ['답변자닉', 'gender', 'age', 'interests', 'profileMetadata', 'replierUid', '답변 본문 preview']) {
    assert.equal(html.includes(forbidden), false);
  }
});

type TestElement = ReactElement<Record<string, unknown>>;

function findButtonByAriaLabel(tree: ReactNode, pattern: RegExp): TestElement {
  const element = findElement(tree, candidate => candidate.type === 'button' && pattern.test(String(candidate.props['aria-label'] ?? '')));
  assert.ok(element, `button matching ${pattern} not found`);
  return element;
}

function findElementByTestId(tree: ReactNode, testId: string): TestElement {
  const element = findElement(tree, candidate => candidate.props['data-testid'] === testId);
  assert.ok(element, `element ${testId} not found`);
  return element;
}

function findElement(tree: ReactNode, predicate: (element: TestElement) => boolean): TestElement | null {
  if (!isValidElement(tree)) return null;
  const element = tree as TestElement;
  if (predicate(element)) return element;
  const children = element.props.children as ReactNode;
  let found: TestElement | null = null;
  Children.forEach(children, child => {
    if (found) return;
    found = findElement(child, predicate);
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
