import { Heart, Send } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  QlingCard,
} from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import { QlingPeekHeader } from '../shared/QlingPeekHeader';
import { useScrollPeekHeader } from '../shared/scrollPeekHeader';
import type { MyWorriesScreenProps } from './contract';

export function MyWorriesScreen(props: MyWorriesScreenProps) {
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';
  const screenClassName = '-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d]';
  const scrollPeekHeader = useScrollPeekHeader();
  const contentHeightClassName = scrollPeekHeader.isHeaderCollapsed ? 'h-[836px]' : 'h-[752px]';
  const contentClassName = `qling-received-worries-font ${contentHeightClassName} overflow-y-auto rounded-t-[32px] bg-[#fff1d1] px-4 pt-5 transition-[height] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] [-webkit-overflow-scrolling:touch] motion-reduce:transition-none`;

  const header = (
    <QlingPeekHeader
      isCollapsed={scrollPeekHeader.isHeaderCollapsed}
      maskIdPrefix="my-worries"
      onOpenMyPage={props.onOpenMyPage}
      eyeTestId="my-worries-top-left-eye"
    />
  );

  const writeButton = (
    <button
      type="button"
      aria-label="고민 작성 화면으로 이동"
      onClick={props.onWriteWorry}
      className="fixed bottom-[calc(var(--qling-space-nav-height)+29.5px)] left-1/2 z-40 ml-[105.5px] flex h-[59.5px] w-[59.5px] items-center justify-center rounded-full bg-[#ff8b3d] text-white shadow-[0_8px_18px_rgb(42_42_42/0.20)] transition-colors hover:bg-[var(--qling-color-secondary-orange)] focus:outline-none focus:ring-2 focus:ring-white"
    >
      <Send className="h-7 w-7" aria-hidden="true" />
    </button>
  );

  return (
    <>
      <section className={screenClassName}>
        <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
          <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
            {header}

            {props.state.status === 'loading' ? (
              <section className={`relative ${contentClassName}`} onScroll={scrollPeekHeader.onScroll} onTouchStart={scrollPeekHeader.onTouchStart} onTouchMove={scrollPeekHeader.onTouchMove} onWheel={scrollPeekHeader.onWheel}>
                <FigmaTabLoading label={props.state.label} />
              </section>
            ) : props.state.status === 'error' ? (
              <section className={contentClassName} onScroll={scrollPeekHeader.onScroll} onTouchStart={scrollPeekHeader.onTouchStart} onTouchMove={scrollPeekHeader.onTouchMove} onWheel={scrollPeekHeader.onWheel}>
                <ErrorState title="나의 고민을 불러오지 못했어요" message={props.state.message} />
              </section>
            ) : props.state.status === 'empty' ? (
              <section className={contentClassName} onScroll={scrollPeekHeader.onScroll} onTouchStart={scrollPeekHeader.onTouchStart} onTouchMove={scrollPeekHeader.onTouchMove} onWheel={scrollPeekHeader.onWheel}>
                <EmptyState title={props.state.message} />
              </section>
            ) : (
              <section
                className={`${contentClassName} pb-[calc(108px+env(safe-area-inset-bottom,0px))]`}
                aria-label="나의 고민 목록"
                onScroll={scrollPeekHeader.onScroll}
                onTouchStart={scrollPeekHeader.onTouchStart}
                onTouchMove={scrollPeekHeader.onTouchMove}
                onWheel={scrollPeekHeader.onWheel}
              >
                <div className="grid gap-[14px]">
                {props.items.map(worry => (
                  <button
                    key={worry.worryId}
                    type="button"
                    aria-label={worry.accessibilityLabel}
                    onClick={() => props.onSelectWorryForAnswers(worry)}
                    className="w-full rounded-[18px] text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2"
                  >
                    <QlingCard className="relative h-[168px] overflow-hidden rounded-[18px] border-0 bg-white px-[18px] pb-0 pt-[11px] shadow-[0_4px_4px_rgb(0_0_0/0.25)]">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex shrink-0 items-start overflow-hidden rounded-[var(--qling-radius-pill)] bg-[#ffe4cc] px-3 py-[5px] text-[11px] font-bold leading-normal text-[#ff8b3d]">
                          {worry.categoryLabel}
                        </span>
                        {worry.createdAtLabel && (
                          <time className="text-[12px] font-semibold leading-[23px] text-[#b8b8b8]">
                            {worry.createdAtLabel}
                          </time>
                        )}
                      </div>
                      <p className="mt-[21px] line-clamp-2 whitespace-pre-wrap break-words text-[16px] font-extrabold leading-6 text-[#2a2a2a]">
                        {worry.summaryText}
                      </p>
                      <div className="absolute bottom-[23px] left-[18px] flex items-center gap-1.5 text-[12px] font-medium text-[#7a7a7a]">
                        <Heart className="h-3.5 w-3.5 fill-[#ff8b3d] text-[#ff8b3d]" aria-hidden="true" />
                        <span>{worry.replyCountLabel}</span>
                      </div>
                    </QlingCard>
                  </button>
                ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>

      {writeButton}
    </>
  );
}
