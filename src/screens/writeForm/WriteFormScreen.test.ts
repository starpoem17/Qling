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
      originalBodyText: '원문 전체는 펼친 카드 안에서만 표시됩니다.',
      receivedAt: { label: '2026.05.18', isoValue: '2026-05-18T00:00:00.000Z' },
    },
    draft: baseDraft,
    isOriginalExpanded: false,
    onBack: () => undefined,
    onDraftChange: () => undefined,
    onToggleOriginalExpanded: () => undefined,
    onPublish: () => undefined,
    ...overrides,
  };
}

test('write reply screen shows summary on the base card and keeps original body out until the card expands', () => {
  const closedHtml = renderToStaticMarkup(WriteFormScreen(baseProps()));
  const expandedHtml = renderToStaticMarkup(WriteFormScreen(baseProps({ isOriginalExpanded: true })));

  assert.match(closedHtml, /요약만 기본 카드에 표시됩니다\./);
  assert.match(closedHtml, />2026\.05\.18</);
  assert.doesNotMatch(closedHtml, />2026-05-18</);
  assert.doesNotMatch(closedHtml, /원문 전체는 펼친 카드 안에서만 표시됩니다\./);
  assert.match(closedHtml, /aria-expanded="false"/);
  assert.match(expandedHtml, /원문 전체는 펼친 카드 안에서만 표시됩니다\./);
  assert.match(expandedHtml, /aria-expanded="true"/);
  assert.match(expandedHtml, /id="write-reply-original-card"/);
  assert.doesNotMatch(expandedHtml, /role="dialog"/);
});

test('write reply collapsed card keeps the saved summary text and uses css line truncation', () => {
  const longSummary = '12345678901234567890123456';
  const closedLongHtml = renderToStaticMarkup(WriteFormScreen(baseProps({
    originalWorry: {
      ...baseProps().originalWorry,
      summaryText: longSummary,
    },
  })));
  const expandedLongHtml = renderToStaticMarkup(WriteFormScreen(baseProps({
    isOriginalExpanded: true,
    originalWorry: {
      ...baseProps().originalWorry,
      summaryText: longSummary,
    },
  })));

  assert.match(closedLongHtml, new RegExp(`>${longSummary}<`));
  assert.match(closedLongHtml, /truncate pl-\[19px\] pr-12 pt-\[44px\]/);
  assert.doesNotMatch(closedLongHtml, /\.\.\.<\/p>/);
  assert.match(expandedLongHtml, new RegExp(`>${longSummary}<`));
  assert.doesNotMatch(expandedLongHtml, /truncate pl-\[19px\] pr-12 pt-\[44px\]/);
});

test('write reply expanded card grows inline without an original-body-only scroller', () => {
  const html = renderToStaticMarkup(WriteFormScreen(baseProps({ isOriginalExpanded: true })));

  assert.match(html, /요약만 기본 카드에 표시됩니다\./);
  assert.match(html, /원문 전체는 펼친 카드 안에서만 표시됩니다\./);
  assert.match(html, /min-h-\[159px\] pb-\[18px\]/);
  assert.match(html, /whitespace-pre-wrap break-words px-\[19px\] pt-\[13px\]/);
  assert.match(html, /text-xs font-bold leading-6 tracking-\[-0\.36px\]/);
  assert.match(html, /overflow-y-auto overscroll-contain pb-\[calc\(var\(--qling-space-nav-height\)\+32px\)\]/);
  assert.doesNotMatch(html, /mt-\[13px\] min-h-0 flex-1 overflow-y-auto px-\[6px\] pb-4/);
  assert.doesNotMatch(html, /aria-modal="true"/);
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

test('write reply textarea starts at the visual placeholder position', () => {
  const html = renderToStaticMarkup(WriteFormScreen(baseProps()));

  assert.match(html, /pt-\[22px\]/);
  assert.match(html, /top-\[22px\]/);
  assert.doesNotMatch(html, /pt-\[63px\]/);
});

test('write reply screen uses Figma canvas positions while keeping the send button above the shell bottom nav', () => {
  const html = renderToStaticMarkup(WriteFormScreen(baseProps()));

  assert.match(html, /w-full/);
  assert.match(html, /h-full min-h-0/);
  assert.match(html, /max-w-\[480px\]/);
  assert.doesNotMatch(html, /transform:scale/);
  assert.match(html, /top:calc\(100px \+ var\(--qling-pwa-topbar-shift, 0px\)\)/);
  assert.match(html, /relative mx-4 overflow-hidden rounded-\[18px\] bg-white/);
  assert.match(html, /absolute inset-0 z-20 cursor-pointer appearance-none rounded-\[18px\] border-0 bg-transparent p-0 text-left/);
  assert.match(html, /height:max\(240px, calc\(calc\(calc\(\(var\(--qling-visual-viewport-height\) - var\(--qling-space-nav-height\)\) - 88px\) \+ var\(--qling-pwa-topbar-shift, 0px\)\) - calc\(200px \+ var\(--qling-pwa-topbar-shift, 0px\)\) - 23px\)\)/);
  assert.match(html, /mx-5 mt-\[21px\] block overflow-hidden/);
  assert.match(html, /mx-auto mt-\[23px\] flex h-12 w-\[267px\]/);
  assert.match(html, /pb-\[calc\(var\(--qling-space-nav-height\)\+32px\)\]/);
  assert.doesNotMatch(html, /min\(461px/);
  assert.doesNotMatch(html, /min\(684px/);
  assert.doesNotMatch(html, /writeCanvasScale/);
  assert.doesNotMatch(html, /min-height:calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \* 852 \/ 393\)/);
  assert.doesNotMatch(html, /top:calc\(calc\(\(var\(--qling-visual-viewport-height\) - var\(--qling-space-nav-height\)\) - 88px\) \+ var\(--qling-pwa-topbar-shift, 0px\)\)/);
});

test('write reply screen toggles expansion from the whole card and forwards other events without route objects', () => {
  const events: string[] = [];
  const collapsedTree = WriteFormScreen(baseProps({
    draft: {
      ...baseDraft,
      value: '보낼 수 있는 답변',
      characterCount: 9,
      validation: { status: 'valid' },
      submitDisabledReason: undefined,
    },
    onBack: () => events.push('back'),
    onDraftChange: value => events.push(`draft:${value}`),
    onToggleOriginalExpanded: () => events.push('toggle-original'),
    onPublish: target => events.push(`publish:${target.deliveryId}:${target.worryId}`),
  }));
  const expandedTree = WriteFormScreen(baseProps({
    draft: {
      ...baseDraft,
      value: '보낼 수 있는 답변',
      characterCount: 9,
      validation: { status: 'valid' },
      submitDisabledReason: undefined,
    },
    onBack: () => events.push('back'),
    onDraftChange: value => events.push(`draft:${value}`),
    onToggleOriginalExpanded: () => events.push('toggle-original'),
    onPublish: target => events.push(`publish:${target.deliveryId}:${target.worryId}`),
    isOriginalExpanded: true,
  }));

  click(findOriginalCardToggle(collapsedTree));
  change(findElement(collapsedTree, element => element.type === 'textarea'), '바뀐 답변');
  click(findOriginalCardToggle(expandedTree));
  click(findButtonByAriaLabel(collapsedTree, /답변하기로 돌아가기/));
  click(findButtonByAriaLabel(collapsedTree, /답변 전송/));

  assert.deepEqual(events, [
    'toggle-original',
    'draft:바뀐 답변',
    'toggle-original',
    'back',
    'publish:delivery-1:worry-1',
  ]);
});

test('write reply chevron is visual state only instead of a separate toggle button', () => {
  const tree = WriteFormScreen(baseProps({ isOriginalExpanded: true }));
  const toggle = findOriginalCardToggle(tree);
  const card = findElement(tree, element => element.type === 'section' && element.props.id === 'write-reply-original-card');
  const buttonsInCard = findElements(card, element => element.type === 'button');
  const chevronWrapper = findElement(card, element => element.type === 'span' && String(element.props.className ?? '').includes('pointer-events-none') && element.props['aria-hidden'] === 'true');

  assert.equal(buttonsInCard.length, 1);
  assert.equal(buttonsInCard[0], toggle);
  assert.equal(chevronWrapper.props['aria-hidden'], 'true');
  assert.equal(toggle.props['aria-expanded'], true);
  assert.equal(toggle.props['aria-controls'], 'write-reply-original-card');
});

test('write reply screen omits AI filter guidance from the Figma-aligned form', () => {
  const html = renderToStaticMarkup(WriteFormScreen(baseProps()));

  assert.doesNotMatch(html, /AI 안심 필터 적용 안내/);
  assert.doesNotMatch(html, /AI 안심 필터가 내용을 확인하고 있습니다\./);
});

test('write reply screen uses compact Figma category chips', () => {
  const html = renderToStaticMarkup(WriteFormScreen(baseProps({ isOriginalExpanded: true })));

  assert.match(html, /h-\[23px\]/);
  assert.match(html, /box-border/);
  assert.match(html, /py-0/);
  assert.doesNotMatch(html, /min-h-\[23px\]/);
  assert.doesNotMatch(html, /py-\[5px\]/);
});

test('write reply screen does not expose publisher profile metadata', () => {
  const html = renderToStaticMarkup(WriteFormScreen(baseProps({
    isOriginalExpanded: true,
  })));

  for (const forbidden of ['publisher nickname', 'gender', 'age', 'interests', 'profile metadata', 'author-uid']) {
    assert.equal(html.includes(forbidden), false);
  }
});

type TestElement = ReactElement<Record<string, unknown>>;

function findButtonByAriaLabel(tree: ReactNode, pattern: RegExp): TestElement {
  return findElement(tree, element => element.type === 'button' && pattern.test(String(element.props['aria-label'] ?? '')));
}

function findOriginalCardToggle(tree: ReactNode): TestElement {
  return findElement(tree, element => element.type === 'button' && element.props['aria-controls'] === 'write-reply-original-card');
}

function findElement(tree: ReactNode, predicate: (element: TestElement) => boolean): TestElement {
  const found = findOptionalElement(tree, predicate);
  assert.ok(found, 'element not found');
  return found;
}

function findElements(tree: ReactNode, predicate: (element: TestElement) => boolean): TestElement[] {
  const found: TestElement[] = [];
  collectElements(tree, predicate, found);
  return found;
}

function collectElements(tree: ReactNode, predicate: (element: TestElement) => boolean, found: TestElement[]) {
  if (!isValidElement(tree)) return;
  const element = tree as TestElement;
  if (predicate(element)) found.push(element);
  Children.forEach(element.props.children as ReactNode, child => {
    collectElements(child, predicate, found);
  });
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
