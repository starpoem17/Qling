import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidElement, type ReactNode } from 'react';
import { BottomNavigation } from './ui';
import type { BottomNavigationTab } from './uiContract';

type ElementRecord = {
  readonly type: unknown;
  readonly props: Record<string, unknown>;
};

function collectElements(node: ReactNode): ElementRecord[] {
  if (node === null || node === undefined || typeof node === 'boolean') return [];
  if (Array.isArray(node)) return node.flatMap(collectElements);
  if (!isValidElement(node)) return [];

  const props = node.props as Record<string, unknown>;
  return [
    { type: node.type, props },
    ...collectElements(props.children as ReactNode),
  ];
}

function renderBottomNavigation(onSelectTab: (tab: BottomNavigationTab) => void = () => undefined) {
  return BottomNavigation({
    tabs: [
      { tab: '답변하기', label: '답변하기' },
      { tab: '나의 고민', label: '나의 고민' },
      { tab: '마이페이지', label: '마이페이지' },
    ],
    activeTab: '답변하기',
    centralIndicator: {
      accessibleLabel: '중앙 눈 인디케이터',
      state: 'left',
    },
    onSelectTab,
  });
}

test('central bottom navigation indicator is not a button or action target', () => {
  const elements = collectElements(renderBottomNavigation());
  const indicator = elements.find(element => element.props['data-indicator-state'] === 'left');

  assert.ok(indicator);
  assert.equal(indicator.type, 'div');
  assert.equal(indicator.props.role, 'img');
  assert.equal(indicator.props['aria-label'], '중앙 눈 인디케이터');
  assert.equal(Object.hasOwn(indicator.props, 'onClick'), false);
  assert.equal(Object.hasOwn(indicator.props, 'data-target-route'), false);
});

test('bottom navigation tab buttons still call onSelectTab', () => {
  const selectedTabs: BottomNavigationTab[] = [];
  const elements = collectElements(renderBottomNavigation(tab => selectedTabs.push(tab)));
  const buttons = elements.filter(element => element.type === 'button');

  assert.equal(buttons.length, 3);
  buttons.forEach(button => {
    assert.equal(typeof button.props.onClick, 'function');
  });

  (buttons[0].props.onClick as () => void)();
  (buttons[1].props.onClick as () => void)();
  (buttons[2].props.onClick as () => void)();

  assert.deepEqual(selectedTabs, ['답변하기', '나의 고민', '마이페이지']);
});
