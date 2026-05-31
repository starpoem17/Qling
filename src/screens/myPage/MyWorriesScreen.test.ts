import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QlingPeekHeader } from '../shared/QlingPeekHeader';
import { MyWorriesScreen } from './MyWorriesScreen';
import type { MyWorriesScreenProps } from './contract';

const item = {
  worryId: 'worry-1',
  summaryText: '꾸미고 싶은데 안 꾸며봐서 어떻게 꾸며야 할 지 잘 모르겠어요...',
  categoryLabel: '외모',
  createdAtLabel: '2026.05.02',
  replyCountLabel: '5명이 답변했어요',
  accessibilityLabel: '답변 확인으로 이동, 카테고리 외모, 작성일 2026.05.02, 5명이 답변했어요',
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

test('my worries screen does not render new-reply emphasis', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps()));

  assert.doesNotMatch(html, /새 답장/);
  assert.doesNotMatch(html, /<span[^>]*>새 답장<\/span>/);
  assert.doesNotMatch(html, /읽지 않은 답장/);
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

  const eye = findElement(tree, candidate => candidate.type === QlingPeekHeader);
  assert.ok(eye);
  assert.equal(eye.type, QlingPeekHeader);
  assert.equal(propsOf(eye).eyeTestId, 'my-worries-top-left-eye');

  const openMyPage = propsOf(eye).onOpenMyPage;
  assert.equal(typeof openMyPage, 'function');
  (openMyPage as () => void)();
  click(findButtonByAriaLabel(tree, /고민 작성 화면으로 이동/));

  assert.equal(openedMyPage, true);
  assert.equal(openedWrite, true);
});

test('my worries write button stays outside the transformed full-bleed scroll wrapper', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps()));

  assert.match(html, /-mx-\[var\(--qling-space-shell-x\)\] -mb-\[var\(--qling-space-scroll-bottom\)\] -mt-6 h-dvh overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /transform:scale\(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)\)/);
  assert.match(html, /<\/section><button[^>]+고민 작성 화면으로 이동/);
  assert.match(html, /fixed bottom-\[calc\(var\(--qling-space-nav-height\)\+29\.5px\)\]/);
});

test('my worries my-page button aligns to the Figma header icon position', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps()));

  assert.match(html, /aria-label="마이페이지 열기"/);
  assert.match(html, /left-\[333\.5px\]/);
  assert.match(html, /top-\[53\.5px\]/);
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

test('my worries loading state renders the Figma spinner status without visible copy', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps({
    state: { status: 'loading', label: '작성한 고민을 불러오고 있습니다.' },
    items: [],
  })));

  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /data-testid="figma-tab-loading-indicator"/);
  assert.match(html, /left-1\/2 top-\[306px\] h-10 w-10/);
  assert.match(html, /작성한 고민을 불러오고 있습니다\./);
  assert.doesNotMatch(html, /나의 고민을 불러오는 중/);
  assert.match(html, /-mx-\[var\(--qling-space-shell-x\)\] -mb-\[var\(--qling-space-scroll-bottom\)\] -mt-6 h-dvh overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /mx-auto flex h-full w-full max-w-\[480px\] justify-center overflow-hidden/);
  assert.match(html, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /transform:scale\(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)\)/);
  assert.match(html, /h-\[752px\] touch-none overscroll-none overflow-hidden/);
  assert.doesNotMatch(html, /h-\[752px\] overflow-y-auto/);
  assert.match(html, /bg-\[#ff8b3d\]/);
  assert.doesNotMatch(html, /w-\[100dvw\]/);
  assert.doesNotMatch(html, /skeleton|Skeleton|data-testid=".*skeleton/i);

  const source = fs.readFileSync(path.join(process.cwd(), 'src/screens/myPage/MyWorriesScreen.tsx'), 'utf8');
  const loadingBranch = source.slice(source.indexOf("props.state.status === 'loading'"), source.indexOf("props.state.status === 'error'"));
  assert.match(loadingBranch, /onWheel=\{blockLoadingScroll\}/);
  assert.match(loadingBranch, /onTouchMove=\{blockLoadingScroll\}/);
  assert.doesNotMatch(loadingBranch, /scrollPeekHeader\.onScroll/);
  assert.doesNotMatch(loadingBranch, /scrollPeekHeader\.onTouchStart/);
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
