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

test('peek header scroll policy collapses after tiny upward content scroll', () => {
  const state = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 1);

  assert.equal(state.collapsed, true);
  assert.equal(state.lastScrollTop, 1);
  assert.equal(state.accumulatedDelta, 0);
});

test('peek header scroll policy keeps collapsed during repeated upward input', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 1);
  const repeated = nextPeekHeaderScrollState(collapsed, 2);

  assert.equal(repeated.collapsed, true);
  assert.equal(repeated.lastScrollTop, 2);
  assert.equal(repeated.accumulatedDelta, 0);
});

test('peek header scroll policy expands after tiny downward input away from scroll top', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 12);
  const expanded = nextPeekHeaderScrollState(collapsed, 11);

  assert.equal(expanded.collapsed, false);
  assert.equal(expanded.lastScrollTop, 11);
  assert.equal(expanded.accumulatedDelta, 0);
});

test('peek header scroll policy keeps expanded during repeated downward input', () => {
  const collapsed = nextPeekHeaderScrollState(initialPeekHeaderScrollState, 12);
  const expanded = nextPeekHeaderScrollState(collapsed, 11);
  const repeated = nextPeekHeaderScrollState(expanded, 10);

  assert.equal(repeated.collapsed, false);
  assert.equal(repeated.lastScrollTop, 10);
  assert.equal(repeated.accumulatedDelta, 0);
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
