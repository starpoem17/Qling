import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import { TutorialScreen } from './TutorialScreen';
import { TUTORIAL_STEPS, nextTutorialStepIndex, previousTutorialStepIndex } from './tutorialFlow';

const params = new URLSearchParams(window.location.search);
const initialStep = Math.max(0, Math.min(Number(params.get('step') ?? '1') - 1, TUTORIAL_STEPS.length - 1));

function TutorialVisualHarness() {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);

  return (
    <TutorialScreen
      steps={TUTORIAL_STEPS}
      currentStepIndex={currentStepIndex}
      isCompleting={false}
      onPrevious={() => setCurrentStepIndex(current => previousTutorialStepIndex(current))}
      onNext={() => setCurrentStepIndex(current => nextTutorialStepIndex(current, TUTORIAL_STEPS.length))}
      onComplete={() => undefined}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TutorialVisualHarness />
  </StrictMode>,
);
