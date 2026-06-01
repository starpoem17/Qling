import { Heart } from 'lucide-react';
import type { CSSProperties, TouchEvent, WheelEvent } from 'react';
import {
  ErrorState,
  QlingCard,
} from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import { PeekHeaderScrollArea } from '../shared/PeekHeaderScrollArea';
import { QlingPeekHeader } from '../shared/QlingPeekHeader';
import { useScrollPeekHeader } from '../shared/scrollPeekHeader';
import type { MyWorriesScreenProps } from './contract';

const writeWorryIconUrl = new URL('../../../assets/my_concerns/send.svg', import.meta.url).href;

export function MyWorriesScreen(props: MyWorriesScreenProps) {
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';
  const writeButtonTop = `min(683px, calc((100dvh - var(--qling-space-nav-height) - 29.5px - 59.5px) / (${canvasScale})))`;
  const screenClassName = '-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d]';
  const scrollPeekHeader = useScrollPeekHeader();
  const contentClassName = 'qling-received-worries-font h-[836px] rounded-t-[32px] bg-[#fff1d1] px-4 pt-5 transform-gpu';
  const loadingContentClassName = 'qling-received-worries-font h-[752px] touch-none overscroll-none overflow-hidden rounded-t-[32px] bg-[#fff1d1] px-4 pt-5';
  const contentStyle = {
    '--qling-peek-progress': scrollPeekHeader.isHeaderCollapsed ? '1' : '0',
    transform: 'translateY(calc(var(--qling-peek-progress, 0) * -88px))',
  } as CSSProperties;

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
      className="absolute left-[302px] z-40 flex h-[59.5px] w-[59.5px] items-center justify-center rounded-full bg-[#ff8b3d] text-white shadow-[0_8px_18px_rgb(42_42_42/0.20)] transition-colors hover:bg-[var(--qling-color-secondary-orange)] focus:outline-none focus:ring-2 focus:ring-white"
      style={{ top: writeButtonTop }}
    >
      <img src={writeWorryIconUrl} alt="" className="h-[27px] w-[27px]" aria-hidden="true" draggable={false} />
    </button>
  );

  return (
    <>
      <section className={screenClassName}>
        <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
          <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
            {header}

            {props.state.status === 'loading' ? (
              <section
                className={`relative ${loadingContentClassName}`}
                onWheel={blockLoadingScroll}
                onTouchMove={blockLoadingScroll}
              >
                <FigmaTabLoading label={props.state.label} />
              </section>
            ) : props.state.status === 'error' ? (
              <PeekHeaderScrollArea className={contentClassName} style={contentStyle} resetKey="my-worries-error">
                <ErrorState title="나의 고민을 불러오지 못했어요" message={props.state.message} />
              </PeekHeaderScrollArea>
            ) : props.state.status === 'empty' ? (
              <section
                className="qling-received-worries-font h-[733px] touch-none overscroll-none overflow-hidden rounded-t-[32px] bg-[#fff1d1] px-4 pt-[30px]"
                aria-label="나의 고민 빈 상태"
                onWheel={blockLoadingScroll}
                onTouchMove={blockLoadingScroll}
              >
                <QlingCard className="relative h-[168px] w-full overflow-hidden rounded-[18px] border-0 bg-white p-0 shadow-[0_4px_4px_rgb(0_0_0/0.25)]">
                  <p className="absolute left-[18px] top-[60px] w-[325px] break-words text-[16px] font-extrabold leading-6 tracking-[-0.03em] text-[#2a2a2a]">
                    첫 고민을 올려보세요!
                    <br />
                    오른쪽 아래 버튼으로 고민을 작성할 수 있어요
                  </p>
                </QlingCard>
              </section>
            ) : (
              <PeekHeaderScrollArea
                className={`${contentClassName} pb-[calc(108px+env(safe-area-inset-bottom,0px))]`}
                style={contentStyle}
                ariaLabel="나의 고민 목록"
                resetKey="my-worries-ready"
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
              </PeekHeaderScrollArea>
            )}
            {writeButton}
          </div>
        </div>
      </section>
    </>
  );
}

function blockLoadingScroll(event: WheelEvent<HTMLElement> | TouchEvent<HTMLElement>) {
  const { preventDefault, stopPropagation } = event;
  preventDefault.call(event);
  stopPropagation.call(event);
}
