import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
  accessibilityLabel: '답변 확인으로 이동, 카테고리 외모, 작성일 2026.05.02, 5명이 답변했어요',
} as const;

function baseProps(overrides: Partial<MyWorriesScreenProps> = {}): MyWorriesScreenProps {
  return {
    state: { status: 'ready' },
    items: [item],
    activitySummary: {
      worryCount: 2,
      replyCount: 12,
      unreadReplyCount: 3,
    },
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

test('my worries screen renders activity summary for my worries and unread replies', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps()));

  assert.match(html, /나의 고민/);
  assert.match(html, /내가 남긴 고민과 받은 답변이에요/);
  assert.match(html, /내 활동 요약/);
  assert.match(html, />2<\/p><p class="text-\[11px\] font-medium leading-normal text-\[#8a8a8a\]">남긴 고민<\/p>/);
  assert.match(html, />12<\/p><p class="text-\[11px\] font-medium leading-normal text-\[#8a8a8a\]">받은 답변<\/p>/);
  assert.match(html, /text-\[#ff8b3d\]">3<\/p><p class="text-\[11px\] font-medium leading-normal text-\[#8a8a8a\]">새 답변<\/p>/);
  assert.doesNotMatch(html, /새 답장/);
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

test('my worries cards truncate summaries at 50 characters only when needed', () => {
  const exactText = '12345678901234567890123456789012345678901234567890';
  const longText = `${exactText}1`;
  const exactHtml = renderToStaticMarkup(MyWorriesScreen(baseProps({
    items: [{
      ...item,
      summaryText: exactText,
    }],
  })));
  const longHtml = renderToStaticMarkup(MyWorriesScreen(baseProps({
    items: [{
      ...item,
      summaryText: longText,
    }],
  })));

  assert.match(exactHtml, new RegExp(`>${exactText}<`));
  assert.doesNotMatch(exactHtml, new RegExp(`${exactText}\\.\\.\\.`));
  assert.match(longHtml, new RegExp(`>${exactText}\\.\\.\\.<`));
  assert.equal(`${exactText}...`.length, 53);
  assert.doesNotMatch(longHtml, new RegExp(longText));
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

  const header = findElement(tree, candidate => typeof candidate.type === 'function' && candidate.type.name === 'MyWorriesStaticHeader');
  assert.ok(header);

  const openMyPage = propsOf(header).onOpenMyPage;
  assert.equal(typeof openMyPage, 'function');
  (openMyPage as () => void)();
  click(findButtonByAriaLabel(tree, /고민 작성 화면으로 이동/));

  assert.equal(openedMyPage, true);
  assert.equal(openedWrite, true);
});

test('my worries write button uses the widened unscaled Figma canvas coordinates', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps()));

  assert.match(html, /-mx-\[var\(--qling-space-shell-x\)\] h-\[var\(--qling-tab-viewport-height\)\] overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /mx-auto flex h-full w-full justify-center overflow-hidden max-w-\[480px\]/);
  assert.match(html, /relative h-full min-h-0 w-full max-w-\[480px\] shrink-0 overflow-hidden bg-\[#ff8b3d\]/);
  assert.doesNotMatch(html, /transform:scale/);
  assert.match(html, /고민 작성 화면으로 이동/);
  assert.match(html, /absolute right-\[18px\] z-40 flex items-center gap-\[7px\]/);
  assert.doesNotMatch(html, /absolute left-\[258px\]/);
  assert.match(html, /relative aspect-\[361\/168\] overflow-hidden rounded-\[18px\]/);
  assert.doesNotMatch(html, /h-\[168px\]/);
  assert.match(html, /style="top:min\(710px, calc\(\(var\(--qling-tab-viewport-height\)\) - 62px\)\)"/);
  assert.match(html, /my_concerns\/write_plus\.svg/);
  assert.match(html, /h-\[15\.563px\] w-\[15\.563px\] shrink-0/);
  assert.match(html, /고민 쓰기/);
  assert.doesNotMatch(html, /my_concerns\/send\.svg/);
  assert.doesNotMatch(html, /rounded-sm bg-white/);
  assert.doesNotMatch(html, /fixed bottom-\[calc\(var\(--qling-space-nav-height\)\+29\.5px\)\]/);
});

test('my worries screen does not render the fixed bottom fade overlay', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps()));

  assert.doesNotMatch(html, /FixedBottomFade/);
  assert.doesNotMatch(html, /bg-gradient-to-b/);
  assert.doesNotMatch(html, /top-\[558px\]/);
  assert.doesNotMatch(html, /from-\[rgba\(255,241,209,0\)\]/);
});

test('my worries my-page button aligns to the widened header right edge', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps()));

  assert.match(html, /aria-label="마이페이지 열기"/);
  assert.match(html, /right-\[17px\] top-\[calc\(var\(--qling-space-safe-top\)\+21px\)\] h-\[49px\] w-\[49px\]/);
  assert.doesNotMatch(html, /left-\[327px\] top-\[21px\]/);
  assert.match(html, /left-3 top-3 h-\[25px\] w-\[25px\]/);
});

test('my worries empty state renders Figma intro without the previous static card', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps({
    state: { status: 'empty', message: '첫 고민을 남겨보세요.' },
    items: [],
  })));

  assert.match(html, /나의 고민 빈 상태/);
  assert.match(html, /나의 고민/);
  assert.match(html, /내가 남긴 고민과 받은 답변이에요/);
  assert.match(html, /내 활동 요약/);
  assert.doesNotMatch(html, /첫 고민을 올려보세요!/);
  assert.doesNotMatch(html, /오른쪽 아래 버튼으로 고민을 작성할 수 있어요/);
  assert.doesNotMatch(html, /첫 고민을 남겨보세요\./);
  assert.match(html, /고민 작성 화면으로 이동/);
  assert.match(html, /고민 쓰기/);
  assert.equal((html.match(/고민 작성 화면으로 이동/g) ?? []).length, 1);
  assert.match(html, /absolute left-0 w-full touch-none overscroll-none overflow-hidden rounded-t-\[32px\] px-4 pt-4/);
  assert.match(html, /style="height:min\(733px, max\(320px, calc\(\(var\(--qling-tab-viewport-height\)\) - 74px - var\(--qling-space-safe-top\)\)\)\);top:calc\(74px \+ var\(--qling-space-safe-top\)\)"/);
  assert.doesNotMatch(html, /h-\[168px\] w-full overflow-hidden rounded-\[18px\]/);
  assert.doesNotMatch(html, /나의 고민 목록/);
  assert.doesNotMatch(html, /overflow-y-auto/);

  const source = fs.readFileSync(path.join(process.cwd(), 'src/screens/myPage/MyWorriesScreen.tsx'), 'utf8');
  const emptyStart = source.indexOf("props.state.status === 'empty'");
  const emptyBranch = source.slice(emptyStart, source.indexOf('          ) : (', emptyStart));
  assert.match(emptyBranch, /onWheel=\{blockLoadingScroll\}/);
  assert.match(emptyBranch, /onTouchMove=\{blockLoadingScroll\}/);
  assert.doesNotMatch(emptyBranch, /PeekHeaderScrollArea/);
  assert.doesNotMatch(emptyBranch, /overflow-y-auto/);
});

test('my worries loading state renders the Figma spinner status without visible copy', () => {
  const html = renderToStaticMarkup(MyWorriesScreen(baseProps({
    state: { status: 'loading', label: '작성한 고민을 불러오고 있습니다.' },
    items: [],
  })));

  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /data-testid="figma-tab-loading-indicator"/);
  assert.match(html, /left-1\/2 h-10 w-10 -translate-x-1\/2 top-\[332px\]/);
  assert.match(html, /작성한 고민을 불러오고 있습니다\./);
  assert.doesNotMatch(html, /나의 고민을 불러오는 중/);
  assert.match(html, /-mx-\[var\(--qling-space-shell-x\)\] h-\[var\(--qling-tab-viewport-height\)\] overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /mx-auto flex h-full w-full justify-center overflow-hidden max-w-\[480px\]/);
  assert.match(html, /relative h-full min-h-0 w-full max-w-\[480px\] shrink-0 overflow-hidden bg-\[#ff8b3d\]/);
  assert.doesNotMatch(html, /transform:scale/);
  assert.match(html, /w-full touch-none overscroll-none overflow-hidden/);
  assert.match(html, /height:min\(733px, max\(320px, calc\(\(var\(--qling-tab-viewport-height\)\) - 74px - var\(--qling-space-safe-top\)\)\)\);top:calc\(74px \+ var\(--qling-space-safe-top\)\)/);
  assert.doesNotMatch(html, /h-\[733px\] w-full overflow-y-auto/);
  assert.match(html, /bg-\[#ff8b3d\]/);
  assert.doesNotMatch(html, /w-\[100dvw\]/);
  assert.doesNotMatch(html, /skeleton|Skeleton|data-testid=".*skeleton/i);

  const source = fs.readFileSync(path.join(process.cwd(), 'src/screens/myPage/MyWorriesScreen.tsx'), 'utf8');
  const loadingBranch = source.slice(source.indexOf("props.state.status === 'loading'"), source.indexOf("props.state.status === 'error'"));
  assert.match(loadingBranch, /onWheel=\{blockLoadingScroll\}/);
  assert.match(loadingBranch, /onTouchMove=\{blockLoadingScroll\}/);
  assert.doesNotMatch(loadingBranch, /scrollPeekHeader/);
  assert.doesNotMatch(loadingBranch, /PeekHeaderScrollArea/);
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
    const isPresent = forbidden === 'age'
      ? /\bage\b/.test(html)
      : html.includes(forbidden);
    assert.equal(isPresent, false);
  }
});

type TestElement = ReactElement<Record<string, unknown>>;

function findButtonByAriaLabel(tree: ReactNode, pattern: RegExp): TestElement {
  const element = findElement(tree, candidate => candidate.type === 'button' && pattern.test(String(candidate.props['aria-label'] ?? '')));
  assert.ok(element, `button matching ${pattern} not found`);
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
