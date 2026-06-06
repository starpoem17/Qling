import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TUTORIAL_STEPS,
  isLastTutorialStep,
  nextTutorialStepIndex,
  previousTutorialStepIndex,
} from './tutorialFlow';

test('defines the seven tutorial image steps in order', () => {
  assert.equal(TUTORIAL_STEPS.length, 7);
  assert.deepEqual(TUTORIAL_STEPS.map(step => step.id), [
    'tutorial-1',
    'tutorial-2',
    'tutorial-3',
    'tutorial-4',
    'tutorial-5',
    'tutorial-6',
    'tutorial-7',
  ]);
  for (const step of TUTORIAL_STEPS) {
    assert.match(step.imageUrl, /assets\/tutorial\/[1-7]\.png|tutorial\/[1-7]\.png|\/src\/assets\/tutorial\/[1-7]\.png/);
    assert.match(step.alt, /큐링 사용법 튜토리얼/);
  }
});

test('advances tutorial steps without moving past the last image', () => {
  assert.equal(nextTutorialStepIndex(0, 7), 1);
  assert.equal(nextTutorialStepIndex(5, 7), 6);
  assert.equal(nextTutorialStepIndex(6, 7), 6);
  assert.equal(nextTutorialStepIndex(0, 0), 0);
});

test('moves tutorial steps backward without moving before the first image', () => {
  assert.equal(previousTutorialStepIndex(4), 3);
  assert.equal(previousTutorialStepIndex(1), 0);
  assert.equal(previousTutorialStepIndex(0), 0);
});

test('detects the final tutorial step only when the flow has steps', () => {
  assert.equal(isLastTutorialStep(0, 7), false);
  assert.equal(isLastTutorialStep(6, 7), true);
  assert.equal(isLastTutorialStep(0, 0), false);
});
