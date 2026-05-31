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
  const state = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 10);

  assert.equal(state.collapsed, true);
  assert.equal(state.lastScrollTop, 10);
  assert.equal(state.accumulatedDelta, 0);
});

test('peek header scroll policy keeps collapsed during rebound without reveal input', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 20);
  const rebound = nextPeekHeaderScrollState(collapsed, 10);

  assert.equal(rebound.collapsed, true);
  assert.equal(rebound.lastScrollTop, 10);
  assert.equal(rebound.accumulatedDelta, 0);
});

test('peek header scroll policy expands after downward input and scroll exceeds threshold', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 20);
  const revealReady = { ...collapsed, canReveal: true };
  const partial = nextPeekHeaderScrollState(revealReady, 15);
  const expanded = nextPeekHeaderScrollState(partial, 10);

  assert.equal(partial.collapsed, true);
  assert.equal(partial.accumulatedDelta, -5);
  assert.equal(expanded.collapsed, false);
  assert.equal(expanded.accumulatedDelta, 0);
});

test('peek header scroll policy ignores small scroll jitter', () => {
  const first = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 3);
  const second = nextPeekHeaderScrollState(first, 6);
  const third = nextPeekHeaderScrollState(second, 5);

  assert.equal(first.collapsed, false);
  assert.equal(second.collapsed, false);
  assert.equal(third.collapsed, false);
});

test('peek header scroll policy does not expand at scroll top without reveal input', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 20);
  const atTop = nextPeekHeaderScrollState(collapsed, 0);

  assert.equal(atTop.collapsed, true);
  assert.equal(atTop.lastScrollTop, 0);
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
  assert.match(expanded, /duration-\[320ms\]/);
  assert.match(expanded, /ease-in-out/);
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
    assert.match(source, /duration-\[320ms\]/);
    assert.match(source, /ease-in-out/);
    assert.match(source, /onTouchStart/);
    assert.match(source, /onTouchMove/);
    assert.match(source, /onWheel/);
  }
});
