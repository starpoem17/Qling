import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TutorialScreen } from './TutorialScreen';
import type { TutorialScreenProps } from './contract';
import { TUTORIAL_STEPS } from './tutorialFlow';

function baseProps(overrides: Partial<TutorialScreenProps> = {}): TutorialScreenProps {
  return {
    steps: TUTORIAL_STEPS,
    currentStepIndex: 0,
    isCompleting: false,
    onPrevious: () => undefined,
    onNext: () => undefined,
    onComplete: () => undefined,
    ...overrides,
  };
}

test('tutorial screen keeps the full-image responsive canvas without adding separate progress UI', () => {
  const html = renderToStaticMarkup(TutorialScreen(baseProps()));

  assert.match(html, /h-\[852px\] w-\[393px\]/);
  assert.match(html, /scale\(min\(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\), calc\(100dvh \/ 852px\)\)\)/);
  assert.match(html, /object-contain/);
  assert.doesNotMatch(html, /1 \/ 5/);
  assert.doesNotMatch(html, /다음<\/button>/);
  assert.doesNotMatch(html, /다음 튜토리얼 보기/);
});

test('tutorial slides advance and go back from horizontal swipe gestures', () => {
  let previousCount = 0;
  let nextCount = 0;
  const tree = TutorialScreen(baseProps({
    currentStepIndex: 2,
    onPrevious: () => {
      previousCount += 1;
    },
    onNext: () => {
      nextCount += 1;
    },
  }));

  const slideTarget = findByAriaLabel(tree, '튜토리얼 슬라이드 넘기기');
  propsOf(slideTarget).onDragEnd(null, { offset: { x: -55 }, velocity: { x: 0 } });
  propsOf(slideTarget).onDragEnd(null, { offset: { x: 55 }, velocity: { x: 0 } });

  assert.equal(nextCount, 1);
  assert.equal(previousCount, 1);
});

test('tutorial slides support keyboard previous and next navigation', () => {
  let previousCount = 0;
  let nextCount = 0;
  const tree = TutorialScreen(baseProps({
    currentStepIndex: 2,
    onPrevious: () => {
      previousCount += 1;
    },
    onNext: () => {
      nextCount += 1;
    },
  }));

  const slideTarget = findByAriaLabel(tree, '튜토리얼 슬라이드 넘기기');
  propsOf(slideTarget).onKeyDown({ key: 'ArrowLeft', preventDefault: () => undefined });
  propsOf(slideTarget).onKeyDown({ key: 'ArrowRight', preventDefault: () => undefined });

  assert.equal(previousCount, 1);
  assert.equal(nextCount, 1);
});

test('final tutorial step renders only the React start button at the blank CTA position', () => {
  let previousCount = 0;
  let completed = false;
  const tree = TutorialScreen(baseProps({
    currentStepIndex: 4,
    onPrevious: () => {
      previousCount += 1;
    },
    onComplete: () => {
      completed = true;
    },
  }));
  const html = renderToStaticMarkup(tree);

  assert.doesNotMatch(html, /다음 튜토리얼 보기/);
  assert.match(html, /left-\[54px\] top-\[471px\]/);
  assert.match(html, /h-\[49px\] w-\[285px\]/);
  assert.match(html, /큐링 시작하기/);

  const slideTarget = findByAriaLabel(tree, '튜토리얼 슬라이드 넘기기');
  propsOf(slideTarget).onDragEnd(null, { offset: { x: 55 }, velocity: { x: 0 } });

  const startButton = findByAriaLabel(tree, '큐링 시작하기');
  propsOf(startButton).onClick();

  assert.equal(previousCount, 1);
  assert.equal(completed, true);
});

function findByAriaLabel(node: ReactNode, ariaLabel: string): ReactElement {
  const found = findElement(node, element => propsOf(element)['aria-label'] === ariaLabel);
  assert.ok(found, `Expected element with aria-label ${ariaLabel}`);
  return found;
}

function findElement(node: ReactNode, predicate: (element: ReactElement) => boolean): ReactElement | null {
  if (!isValidElement(node)) return null;
  if (predicate(node)) return node;

  const children = propsOf(node).children;
  const childArray = Array.isArray(children) ? children : [children];
  for (const child of childArray) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
  return null;
}

function propsOf(element: ReactElement): Record<string, any> {
  return element.props as Record<string, any>;
}
