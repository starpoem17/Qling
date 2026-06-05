import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { TutorialScreen } from './TutorialScreen';
import {
  TUTORIAL_STEPS,
  nextTutorialStepIndex,
  previousTutorialStepIndex,
} from './tutorialFlow';

type Props = {
  readonly user: User | null;
  readonly onComplete: (completedAt: Date) => void;
  readonly onError: (message: string) => void;
};

export function TutorialContainer(props: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleNext = () => {
    if (isCompleting) return;
    setCurrentStepIndex(current => nextTutorialStepIndex(current, TUTORIAL_STEPS.length));
  };

  const handlePrevious = () => {
    if (isCompleting) return;
    setCurrentStepIndex(current => previousTutorialStepIndex(current));
  };

  const handleComplete = async () => {
    if (!props.user || isCompleting) return;

    setIsCompleting(true);
    try {
      await updateDoc(doc(db, 'users', props.user.uid), {
        tutorialCompletedAt: serverTimestamp(),
      });
      props.onComplete(new Date());
    } catch (error) {
      console.error('Tutorial completion failed:', error);
      props.onError('튜토리얼 완료 처리 중 문제가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <TutorialScreen
      steps={TUTORIAL_STEPS}
      currentStepIndex={currentStepIndex}
      isCompleting={isCompleting}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onComplete={handleComplete}
    />
  );
}
