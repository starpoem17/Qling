import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QlingPeekHeader } from './QlingPeekHeader';
import {
  initialPeekHeaderScrollState,
  nextPeekHeaderScrollState,
} from './scrollPeekHeader';

test('peek header scroll policy collapses after upward content scroll exceeds threshold', () => {
  const state = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 6);

  assert.equal(state.collapsed, true);
  assert.equal(state.lastScrollTop, 6);
  assert.equal(state.accumulatedDelta, 0);
});

test('peek header scroll policy expands after downward content scroll exceeds threshold', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 12);
  const partial = nextPeekHeaderScrollState(collapsed, 9);
  const expanded = nextPeekHeaderScrollState(partial, 6);

  assert.equal(partial.collapsed, true);
  assert.equal(partial.accumulatedDelta, -3);
  assert.equal(expanded.collapsed, false);
  assert.equal(expanded.accumulatedDelta, 0);
});

test('peek header scroll policy ignores small scroll jitter', () => {
  const first = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 2);
  const second = nextPeekHeaderScrollState(first, 4);
  const third = nextPeekHeaderScrollState(second, 3);

  assert.equal(first.collapsed, false);
  assert.equal(second.collapsed, false);
  assert.equal(third.collapsed, false);
});

test('peek header scroll policy expands at scroll top', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 12);
  const expanded = nextPeekHeaderScrollState(collapsed, 0);

  assert.deepEqual(expanded, initialPeekHeaderScrollState);
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
  assert.match(collapsed, /h-\[32px\]/);
  assert.match(collapsed, /overflow-hidden/);
  assert.match(expanded, /aria-label="마이페이지 열기"/);
  assert.match(expanded, /role="presentation"/);
  assert.match(expanded, /aria-hidden="true"/);
});
