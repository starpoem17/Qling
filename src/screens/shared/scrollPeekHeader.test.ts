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
  const first = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 32);
  const second = nextPeekHeaderScrollState(first, 63);
  const layout = peekHeaderLayoutForState(first);

  assert.equal(second.collapsed, false);
  assert.equal(second.lastScrollTop, 63);
  assert.equal(second.accumulatedDelta, 63);
  assert.equal(second.gestureStartCollapsed, false);
  assert.equal(layout.headerHeight, 58);
  assert.equal(layout.contentHeight, 794);
  assert.equal(layout.isTrackingGesture, true);
});

test('peek header scroll policy collapses after accumulated upward threshold', () => {
  const partial = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 32);
  const collapsed = nextPeekHeaderScrollState(partial, 64);

  assert.equal(collapsed.collapsed, true);
  assert.equal(collapsed.lastScrollTop, 64);
  assert.equal(collapsed.accumulatedDelta, 0);
  assert.equal(collapsed.gestureStartCollapsed, null);
});

test('peek header scroll policy expands after accumulated downward threshold', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 128);
  const partial = nextPeekHeaderScrollState(collapsed, 96);
  const expanded = nextPeekHeaderScrollState(partial, 64);

  assert.equal(partial.collapsed, true);
  assert.equal(partial.accumulatedDelta, -32);
  assert.equal(expanded.collapsed, false);
  assert.equal(expanded.lastScrollTop, 64);
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
  const partial = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 32);
  const settled = settlePeekHeaderScrollState(partial);
  const layout = peekHeaderLayoutForState(settled);

  assert.equal(settled.collapsed, false);
  assert.equal(settled.lastScrollTop, 32);
  assert.equal(settled.accumulatedDelta, 0);
  assert.equal(settled.gestureStartCollapsed, null);
  assert.equal(layout.headerHeight, 100);
  assert.equal(layout.contentHeight, 752);
  assert.equal(layout.isTrackingGesture, false);
});

test('peek header scroll policy keeps threshold-crossed state after settle', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 64);
  const settled = settlePeekHeaderScrollState(collapsed);

  assert.equal(settled.collapsed, true);
  assert.equal(settled.lastScrollTop, 64);
  assert.equal(settled.accumulatedDelta, 0);
  assert.equal(settled.gestureStartCollapsed, null);
});

test('peek header scroll policy expands at scroll top without reveal input', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 12);
  const atTop = nextPeekHeaderScrollState(collapsed, 0);

  assert.deepEqual(atTop, initialPeekHeaderScrollState);
});

test('peek header renders expanded and collapsed height classes', () => {
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
  assert.match(collapsed, /h-\[16px\]/);
  assert.match(collapsed, /overflow-hidden/);
  assert.match(expanded, /duration-\[180ms\]/);
  assert.match(expanded, /ease-\[cubic-bezier\(0\.22,1,0\.36,1\)\]/);
  assert.match(expanded, /aria-label="마이페이지 열기"/);
  assert.match(expanded, /role="presentation"/);
  assert.match(expanded, /aria-hidden="true"/);
});

test('peek header screens preserve total canvas height with collapsed content height', () => {
  const receivedSource = fs.readFileSync(path.join(process.cwd(), 'src/screens/receivedWorries/ReceivedWorriesScreen.tsx'), 'utf8');
  const myWorriesSource = fs.readFileSync(path.join(process.cwd(), 'src/screens/myPage/MyWorriesScreen.tsx'), 'utf8');

  for (const source of [receivedSource, myWorriesSource]) {
    assert.match(source, /h-\[836px\]/);
    assert.match(source, /h-\[752px\]/);
    assert.match(source, /duration-\[180ms\]/);
    assert.match(source, /ease-\[cubic-bezier\(0\.22,1,0\.36,1\)\]/);
    assert.match(source, /onTouchStart/);
    assert.match(source, /onTouchMove/);
    assert.match(source, /onTouchEnd/);
    assert.match(source, /onWheel/);
  }
});
