import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QlingPeekHeader } from './QlingPeekHeader';
import {
  initialPeekHeaderScrollState,
  nextPeekHeaderScrollState,
  peekHeaderLayoutForState,
  settlePeekHeaderScrollState,
} from './scrollPeekHeader';

test('peek header scroll policy keeps state for tiny upward content scroll', () => {
  const state = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 1);

  assert.equal(state.collapsed, false);
  assert.equal(state.lastScrollTop, 1);
  assert.equal(state.accumulatedDelta, 1);
  assert.equal(state.gestureStartCollapsed, false);
});

test('peek header scroll policy exposes intermediate layout before accumulated threshold', () => {
  const first = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 21);
  const second = nextPeekHeaderScrollState(first, 41);
  const layout = peekHeaderLayoutForState(first);

  assert.equal(second.collapsed, false);
  assert.equal(second.lastScrollTop, 41);
  assert.equal(second.accumulatedDelta, 41);
  assert.equal(second.gestureStartCollapsed, false);
  assert.equal(layout.progress, 0.5);
  assert.equal(layout.collapsed, false);
  assert.equal(layout.isTrackingGesture, true);
});

test('peek header scroll policy collapses after accumulated upward threshold', () => {
  const partial = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 21);
  const collapsed = nextPeekHeaderScrollState(partial, 42);

  assert.equal(collapsed.collapsed, true);
  assert.equal(collapsed.lastScrollTop, 42);
  assert.equal(collapsed.accumulatedDelta, 0);
  assert.equal(collapsed.gestureStartCollapsed, null);
});

test('peek header scroll policy expands after accumulated downward threshold', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 84);
  const partial = nextPeekHeaderScrollState(collapsed, 63);
  const expanded = nextPeekHeaderScrollState(partial, 42);

  assert.equal(partial.collapsed, true);
  assert.equal(partial.accumulatedDelta, -21);
  assert.equal(expanded.collapsed, false);
  assert.equal(expanded.lastScrollTop, 42);
  assert.equal(expanded.accumulatedDelta, 0);
  assert.equal(expanded.gestureStartCollapsed, null);
});

test('peek header scroll policy ignores bottom bounce while input direction is downward', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 42);
  const bounced = nextPeekHeaderScrollState(collapsed, 20, 'down', { maxScrollTop: 42 });

  assert.equal(bounced.collapsed, true);
  assert.equal(bounced.lastScrollTop, 20);
  assert.equal(bounced.accumulatedDelta, 0);
  assert.equal(bounced.gestureStartCollapsed, null);
});

test('peek header scroll policy ignores bottom bounce without upward input direction', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 42);
  const bounced = nextPeekHeaderScrollState(collapsed, 20, null, { maxScrollTop: 42 });

  assert.equal(bounced.collapsed, true);
  assert.equal(bounced.lastScrollTop, 20);
  assert.equal(bounced.accumulatedDelta, 0);
  assert.equal(bounced.gestureStartCollapsed, null);
});

test('peek header scroll policy allows upward input to reveal even near the bottom', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 84);
  const partial = nextPeekHeaderScrollState(collapsed, 63, 'up', { maxScrollTop: 84 });
  const expanded = nextPeekHeaderScrollState(partial, 42, 'up', { maxScrollTop: 84 });

  assert.equal(partial.collapsed, true);
  assert.equal(partial.lastScrollTop, 63);
  assert.equal(partial.accumulatedDelta, -21);
  assert.equal(partial.gestureStartCollapsed, true);
  assert.equal(expanded.collapsed, false);
  assert.equal(expanded.lastScrollTop, 42);
  assert.equal(expanded.accumulatedDelta, 0);
  assert.equal(expanded.gestureStartCollapsed, null);
});

test('peek header scroll policy resets accumulated distance when direction changes', () => {
  const upward = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 32);
  const downward = nextPeekHeaderScrollState(upward, 16);

  assert.equal(downward.collapsed, false);
  assert.equal(downward.lastScrollTop, 16);
  assert.equal(downward.accumulatedDelta, -16);
  assert.equal(downward.gestureStartCollapsed, false);
});

test('peek header scroll policy settles below threshold back to the gesture start state', () => {
  const partial = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 21);
  const settled = settlePeekHeaderScrollState(partial);
  const layout = peekHeaderLayoutForState(settled);

  assert.equal(settled.collapsed, false);
  assert.equal(settled.lastScrollTop, 21);
  assert.equal(settled.accumulatedDelta, 0);
  assert.equal(settled.gestureStartCollapsed, null);
  assert.equal(layout.progress, 0);
  assert.equal(layout.collapsed, false);
  assert.equal(layout.isTrackingGesture, false);
});

test('peek header scroll policy keeps threshold-crossed state after settle', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 42);
  const settled = settlePeekHeaderScrollState(collapsed);

  assert.equal(settled.collapsed, true);
  assert.equal(settled.lastScrollTop, 42);
  assert.equal(settled.accumulatedDelta, 0);
  assert.equal(settled.gestureStartCollapsed, null);
});

test('peek header scroll policy expands at scroll top without reveal input', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 12);
  const atTop = nextPeekHeaderScrollState(collapsed, 0);

  assert.deepEqual(atTop, initialPeekHeaderScrollState);
});

test('peek header renders fixed wrapper and transform-driven content', () => {
  const expanded = renderToStaticMarkup(createElement(QlingPeekHeader, {
    isCollapsed: false,
    maskIdPrefix: 'test-expanded',
    onOpenMyPage: () => undefined,
  }));
  const collapsed = renderToStaticMarkup(createElement(QlingPeekHeader, {
    isCollapsed: true,
    maskIdPrefix: 'test-collapsed',
    onOpenMyPage: () => undefined,
  }));

  assert.match(expanded, /h-\[100px\]/);
  assert.doesNotMatch(collapsed, /h-\[16px\]/);
  assert.match(expanded, /touch-none overscroll-none overflow-hidden/);
  assert.match(collapsed, /overflow-hidden/);
  assert.match(expanded, /--qling-peek-progress:0/);
  assert.match(collapsed, /--qling-peek-progress:1/);
  assert.match(expanded, /data-qling-peek-header-content="true"/);
  assert.match(expanded, /translateY\(calc\(var\(--qling-peek-progress, 0\) \* -84px\)\)/);
  assert.match(expanded, /aria-label="마이페이지 열기"/);
  assert.match(expanded, /role="presentation"/);
  assert.match(expanded, /aria-hidden="true"/);
});

test('peek header blocks header-started scroll gestures without changing my-page click', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/screens/shared/QlingPeekHeader.tsx'), 'utf8');

  assert.match(source, /onTouchMove=\{blockHeaderScroll\}/);
  assert.match(source, /onWheel=\{blockHeaderScroll\}/);
  assert.match(source, /preventDefault\.call\(event\)/);
  assert.match(source, /stopPropagation\.call\(event\)/);
  assert.match(source, /onClick=\{props\.onOpenMyPage\}/);
});

test('peek header screens use transform layout without scroll-time height transitions', () => {
  const receivedSource = fs.readFileSync(path.join(process.cwd(), 'src/screens/receivedWorries/ReceivedWorriesScreen.tsx'), 'utf8');
  const myWorriesSource = fs.readFileSync(path.join(process.cwd(), 'src/screens/myPage/MyWorriesScreen.tsx'), 'utf8');

  for (const source of [receivedSource, myWorriesSource]) {
    assert.match(source, /h-\[836px\]/);
    assert.match(source, /h-\[752px\]/);
    assert.match(source, /--qling-peek-progress/);
    assert.match(source, /translateY\(calc\(var\(--qling-peek-progress, 0\) \* -84px\)\)/);
    assert.doesNotMatch(source, /contentHeightClassName/);
    assert.doesNotMatch(source, /transition-\[height\]/);
    assert.match(source, /onTouchStart/);
    assert.match(source, /onTouchMove/);
    assert.match(source, /onTouchEnd/);
    assert.match(source, /onWheel/);
    assert.match(source, /blockLoadingScroll/);
    assert.match(source, /touch-none overscroll-none overflow-hidden/);
  }
});
