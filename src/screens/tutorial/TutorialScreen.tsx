import type { KeyboardEvent } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { cn } from '../../lib/utils';
import type { TutorialScreenProps } from './contract';
import { isLastTutorialStep } from './tutorialFlow';

const swipeOffsetThreshold = 54;
const swipeVelocityThreshold = 500;

export function TutorialScreen(props: TutorialScreenProps) {
  const currentStep = props.steps[props.currentStepIndex];
  const isLastStep = isLastTutorialStep(props.currentStepIndex, props.steps.length);
  const canvasScale = 'min(calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px), calc(100dvh / 852px))';

  if (!currentStep) {
    return (
      <section className="flex h-full w-full items-center justify-center bg-[#fff7e3]" aria-label="튜토리얼">
        <p className="text-[15px] font-bold text-[#333333]">튜토리얼을 불러오지 못했어요.</p>
      </section>
    );
  }

  const handleScreenKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (props.isCompleting) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      props.onPrevious();
      return;
    }

    if (event.key !== 'ArrowRight') return;
    event.preventDefault();
    props.onNext();
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (props.isCompleting) return;
    const shouldGoNext = info.offset.x < -swipeOffsetThreshold || info.velocity.x < -swipeVelocityThreshold;
    const shouldGoPrevious = info.offset.x > swipeOffsetThreshold || info.velocity.x > swipeVelocityThreshold;

    if (shouldGoNext) {
      props.onNext();
      return;
    }
    if (shouldGoPrevious) props.onPrevious();
  };

  return (
    <section className="h-full w-full overflow-hidden bg-[#5f2f17] text-[#1a1a1a]" aria-label="큐링 사용법 튜토리얼">
      <div className="mx-auto flex h-full w-full max-w-[480px] items-start justify-center overflow-hidden bg-[#5f2f17]">
        <div
          className="relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#5f2f17]"
          style={{ transform: `scale(${canvasScale})` }}
        >
          <motion.div
            role="group"
            tabIndex={0}
            aria-label="튜토리얼 슬라이드 넘기기"
            className="absolute inset-0 cursor-grab touch-pan-y focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/80 active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            onKeyDown={handleScreenKeyDown}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentStep.id}
                src={currentStep.imageUrl}
                alt={currentStep.alt}
                className="absolute inset-0 h-full w-full select-none object-contain"
                draggable={false}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              />
            </AnimatePresence>
          </motion.div>

          {isLastStep && (
            <button
              type="button"
              className={cn(
                'absolute left-[54px] top-[471px] z-20 flex h-[49px] w-[285px] items-center justify-center rounded-[18px]',
                'bg-[#ff8b3d] text-[18px] font-extrabold leading-none tracking-normal text-white',
                'shadow-[0_4px_10px_rgba(255,139,61,0.28)] transition-transform active:scale-[0.98]',
                'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#ff8b3d]',
                'disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100',
              )}
              disabled={props.isCompleting}
              onClick={props.onComplete}
              aria-label="큐링 시작하기"
            >
              {props.isCompleting ? '시작하는 중' : '큐링 시작하기'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
