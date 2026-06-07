import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createElement } from 'react';
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

function renderScreen(overrides: Partial<WriteFormScreenProps> = {}): string {
  return renderToStaticMarkup(createElement(WriteFormScreen, baseProps(overrides)));
}

test('write reply screen shows summary on the base card and keeps original body out until the card expands', () => {
  const closedHtml = renderScreen();
  const expandedHtml = renderScreen({ isOriginalExpanded: true });

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
  const closedLongHtml = renderScreen({
    originalWorry: {
      ...baseProps().originalWorry,
      summaryText: longSummary,
    },
  });
  const expandedLongHtml = renderScreen({
    isOriginalExpanded: true,
    originalWorry: {
      ...baseProps().originalWorry,
      summaryText: longSummary,
    },
  });

  assert.match(closedLongHtml, new RegExp(`>${longSummary}<`));
  assert.match(closedLongHtml, /truncate pl-\[19px\] pr-12 pt-\[44px\]/);
  assert.doesNotMatch(closedLongHtml, /\.\.\.<\/p>/);
  assert.match(expandedLongHtml, new RegExp(`>${longSummary}<`));
  assert.doesNotMatch(expandedLongHtml, /truncate pl-\[19px\] pr-12 pt-\[44px\]/);
});

test('write reply expanded card limits original body to its own scroller', () => {
  const html = renderScreen({ isOriginalExpanded: true });

  assert.match(html, /요약만 기본 카드에 표시됩니다\./);
  assert.match(html, /원문 전체는 펼친 카드 안에서만 표시됩니다\./);
  assert.match(html, /flex min-h-\[79px\] flex-col/);
  assert.match(html, /max-height:min\(30%, calc\(/);
  assert.match(html, /- 21px - 240px - 23px/);
  assert.match(html, /relative z-30 mt-\[13px\] min-h-0 flex-1 cursor-pointer overflow-y-auto overscroll-contain whitespace-pre-wrap break-words px-\[19px\] pb-\[18px\]/);
  assert.match(html, /text-xs font-bold leading-6 tracking-\[-0\.36px\]/);
  assert.doesNotMatch(html, /height:max\(79px, min\(30%, calc\(/);
  assert.doesNotMatch(html, /absolute inset-x-0 bottom-0 overflow-y-auto/);
  assert.doesNotMatch(html, /pb-\[calc\(var\(--qling-space-nav-height\)\+32px\)\]/);
  assert.doesNotMatch(html, /min-h-\[159px\] pb-\[18px\]/);
  assert.doesNotMatch(html, /aria-modal="true"/);
});

test('write reply expanded card sizes to content instead of forcing the old large minimum', () => {
  const html = renderScreen({
    isOriginalExpanded: true,
    originalWorry: {
      ...baseProps().originalWorry,
      originalBodyText: '짧은 원문',
    },
  });

  assert.match(html, /max-height:min\(30%, calc\(/);
  assert.match(html, /min-h-\[79px\]/);
  assert.doesNotMatch(html, /height:max\(79px, min\(30%, calc\(/);
  assert.doesNotMatch(html, /style="height:min\(30%, calc\(/);
});

test('write reply screen renders visual pencil placeholder only for an empty draft', () => {
  const emptyHtml = renderScreen();
  const filledHtml = renderScreen({
    draft: {
      ...baseDraft,
      value: '작성 중인 답변',
      characterCount: 8,
      validation: { status: 'valid' },
      submitDisabledReason: undefined,
    },
  });

  assert.match(emptyHtml, /고민자에게 따뜻한 말을 전달해주세요!/);
  assert.match(emptyHtml, /write-reply-pencil-placeholder/);
  assert.doesNotMatch(emptyHtml, /placeholder=/);
  assert.doesNotMatch(filledHtml, /write-reply-pencil-placeholder/);
  assert.doesNotMatch(filledHtml, /고민자에게 따뜻한 말을 전달해주세요!/);
});

test('write reply textarea starts at the visual placeholder position', () => {
  const html = renderScreen();

  assert.match(html, /pt-\[22px\]/);
  assert.match(html, /top-\[22px\]/);
  assert.doesNotMatch(html, /pt-\[63px\]/);
});

test('write reply screen uses Figma canvas positions while keeping the send button above the shell bottom nav', () => {
  const html = renderScreen();

  assert.match(html, /w-full/);
  assert.match(html, /h-full min-h-0/);
  assert.match(html, /max-w-\[480px\]/);
  assert.doesNotMatch(html, /transform:scale/);
  assert.match(html, /absolute left-4 right-4 overflow-hidden rounded-\[18px\] bg-white/);
  assert.match(html, /absolute inset-0 z-20 cursor-pointer appearance-none rounded-\[18px\] border-0 bg-transparent p-0 text-left/);
  assert.match(html, /height:79px/);
  assert.match(html, /absolute left-5 right-5 block overflow-hidden/);
  assert.match(html, /top:calc\(calc\(100px \+ var\(--qling-pwa-topbar-shift, 0px\)\) \+ 79px \+ 21px\)/);
  assert.match(html, /height:max\(240px, calc\(/);
  assert.match(html, /- calc\(calc\(100px \+ var\(--qling-pwa-topbar-shift, 0px\)\) \+ 79px \+ 21px\) - 23px/);
  assert.match(html, /absolute left-1\/2 flex h-12 w-\[267px\] -translate-x-1\/2/);
  assert.match(html, /top:calc\(calc\(\(var\(--qling-stable-viewport-height\) - var\(--qling-space-nav-height\)\) - var\(--qling-write-form-send-bottom-offset\)\) \+ var\(--qling-pwa-topbar-shift, 0px\)\)/);
  assert.doesNotMatch(html, /absolute left-4 right-4 flex min-h-0 flex-col gap-\[21px\] overflow-hidden/);
  assert.doesNotMatch(html, /relative mx-1 block min-h-\[240px\] flex-1 overflow-hidden/);
  assert.doesNotMatch(html, /absolute inset-x-0 bottom-0 overflow-y-auto/);
  assert.doesNotMatch(html, /pb-\[calc\(var\(--qling-space-nav-height\)\+32px\)\]/);
  assert.doesNotMatch(html, /min\(461px/);
  assert.doesNotMatch(html, /min\(684px/);
  assert.doesNotMatch(html, /writeCanvasScale/);
  assert.doesNotMatch(html, /min-height:calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \* 852 \/ 393\)/);
});

test('write reply PWA spacing uses the shared 24px bottom-nav gap variable', () => {
  const source = fs.readFileSync('src/screens/writeForm/WriteFormScreen.tsx', 'utf8');
  const cssSource = fs.readFileSync('src/index.css', 'utf8');

  assert.match(source, /var\(--qling-stable-viewport-height\)/);
  assert.match(source, /var\(--qling-write-form-send-bottom-offset\)/);
  assert.match(cssSource, /--qling-write-form-send-bottom-offset: 88px;/);
  assert.match(cssSource, /html\.qling-standalone-pwa[\s\S]*--qling-write-form-send-bottom-offset: calc\(72px \+ var\(--qling-pwa-topbar-shift, 0px\)\);/);
});

test('write reply source keeps input events separate from original-card toggle events', () => {
  const source = fs.readFileSync('src/screens/writeForm/WriteFormScreen.tsx', 'utf8');
  const textareaStart = source.indexOf('<textarea');
  const textareaEnd = source.indexOf('/>', textareaStart);
  const textareaSource = source.slice(textareaStart, textareaEnd);

  assert.match(textareaSource, /onChange=\{event => props\.onDraftChange\(event\.currentTarget\.value\)\}/);
  assert.doesNotMatch(textareaSource, /onToggleOriginalExpanded/);
  assert.match(source, /onClick=\{props\.onToggleOriginalExpanded\}/);
  assert.match(source, /if \(moved <= 8 && scrolled <= 2\) props\.onToggleOriginalExpanded\(\);/);
});

test('write reply screen omits AI filter guidance from the Figma-aligned form', () => {
  const html = renderScreen();

  assert.doesNotMatch(html, /AI 안심 필터 적용 안내/);
  assert.doesNotMatch(html, /AI 안심 필터가 내용을 확인하고 있습니다\./);
});

test('write reply screen uses compact Figma category chips', () => {
  const html = renderScreen({ isOriginalExpanded: true });

  assert.match(html, /h-\[23px\]/);
  assert.match(html, /box-border/);
  assert.match(html, /py-0/);
  assert.doesNotMatch(html, /min-h-\[23px\]/);
  assert.doesNotMatch(html, /py-\[5px\]/);
});

test('write reply screen does not expose publisher profile metadata', () => {
  const html = renderScreen({
    isOriginalExpanded: true,
  });

  for (const forbidden of ['publisher nickname', 'gender', 'age', 'interests', 'profile metadata', 'author-uid']) {
    assert.equal(html.includes(forbidden), false);
  }
});
