import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TUTORIAL_STEPS,
  isLastTutorialStep,
  nextTutorialStepIndex,
  previousTutorialStepIndex,
} from './tutorialFlow';

test('defines the five tutorial image steps in order', () => {
  assert.equal(TUTORIAL_STEPS.length, 5);
  assert.deepEqual(TUTORIAL_STEPS.map(step => step.id), [
    'tutorial-1',
    'tutorial-2',
    'tutorial-3',
    'tutorial-4',
    'tutorial-5',
  ]);
  for (const step of TUTORIAL_STEPS) {
    assert.match(step.imageUrl, /assets\/tutorial\/[1-5]\.png|tutorial\/[1-5]\.png|\/src\/assets\/tutorial\/[1-5]\.png/);
    assert.match(step.alt, /큐링 사용법 튜토리얼/);
  }
});

test('advances tutorial steps without moving past the last image', () => {
  assert.equal(nextTutorialStepIndex(0, 5), 1);
  assert.equal(nextTutorialStepIndex(3, 5), 4);
  assert.equal(nextTutorialStepIndex(4, 5), 4);
  assert.equal(nextTutorialStepIndex(0, 0), 0);
});

test('moves tutorial steps backward without moving before the first image', () => {
  assert.equal(previousTutorialStepIndex(4), 3);
  assert.equal(previousTutorialStepIndex(1), 0);
  assert.equal(previousTutorialStepIndex(0), 0);
});

test('detects the final tutorial step only when the flow has steps', () => {
  assert.equal(isLastTutorialStep(0, 5), false);
  assert.equal(isLastTutorialStep(4, 5), true);
  assert.equal(isLastTutorialStep(0, 0), false);
});
