export type TutorialStep = {
  readonly id: string;
  readonly imageUrl: string;
  readonly alt: string;
};

export type TutorialScreenProps = {
  readonly steps: readonly TutorialStep[];
  readonly currentStepIndex: number;
  readonly isCompleting: boolean;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onComplete: () => void;
};
