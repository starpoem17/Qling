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
} from './scrollPeekHeader';

test('peek header scroll policy collapses after upward content scroll exceeds threshold', () => {
  const state = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 6);

  assert.equal(state.collapsed, true);
  assert.equal(state.lastScrollTop, 6);
  assert.equal(state.accumulatedDelta, 0);
});

test('peek header scroll policy keeps collapsed during rebound without reveal input', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 12);
  const rebound = nextPeekHeaderScrollState(collapsed, 6);

  assert.equal(rebound.collapsed, true);
  assert.equal(rebound.lastScrollTop, 6);
  assert.equal(rebound.accumulatedDelta, 0);
});

test('peek header scroll policy expands after downward input and scroll exceeds threshold', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 12);
  const revealReady = { ...collapsed, canReveal: true };
  const partial = nextPeekHeaderScrollState(revealReady, 9);
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
    assert.match(source, /onWheel/);
  }
});
