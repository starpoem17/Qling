import type { TutorialStep } from './contract';

const tutorialImageUrls = [
  new URL('../../../assets/tutorial/1.png', import.meta.url).href,
  new URL('../../../assets/tutorial/2.png', import.meta.url).href,
  new URL('../../../assets/tutorial/3.png', import.meta.url).href,
  new URL('../../../assets/tutorial/4.png', import.meta.url).href,
  new URL('../../../assets/tutorial/5.png', import.meta.url).href,
  new URL('../../../assets/tutorial/6.png', import.meta.url).href,
  new URL('../../../assets/tutorial/7.png', import.meta.url).href,
] as const;

export const TUTORIAL_STEPS: readonly TutorialStep[] = tutorialImageUrls.map((imageUrl, index) => ({
  id: `tutorial-${index + 1}`,
  imageUrl,
  alt: `큐링 사용법 튜토리얼 ${index + 1}번째 화면`,
}));

export function isLastTutorialStep(currentStepIndex: number, totalSteps: number): boolean {
  return totalSteps > 0 && currentStepIndex === totalSteps - 1;
}

export function nextTutorialStepIndex(currentStepIndex: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.min(currentStepIndex + 1, totalSteps - 1);
}

export function previousTutorialStepIndex(currentStepIndex: number): number {
  return Math.max(currentStepIndex - 1, 0);
}
