import type { KeyboardEvent, MouseEvent, TouchEvent, WheelEvent } from 'react';
import type { CSSProperties } from 'react';
import {
  EmptyState,
  ErrorState,
  QlingCard,
} from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import { QlingPeekHeader } from '../shared/QlingPeekHeader';
import { useScrollPeekHeader } from '../shared/scrollPeekHeader';
import type { ReceivedWorriesScreenProps } from './contract';

export function ReceivedWorriesScreen(props: ReceivedWorriesScreenProps) {
  const passingDeliveryIds = new Set(props.passingDeliveryIds);
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';
  const screenClassName = '-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d]';
  const scrollPeekHeader = useScrollPeekHeader();
  const contentClassName = 'qling-received-worries-font h-[836px] overflow-y-auto rounded-t-[32px] bg-[#fff1d1] px-4 pt-5 transform-gpu [-webkit-overflow-scrolling:touch]';
  const loadingContentClassName = 'qling-received-worries-font h-[752px] touch-none overscroll-none overflow-hidden rounded-t-[32px] bg-[#fff1d1] px-4 pt-5';
  const contentStyle = {
    '--qling-peek-progress': scrollPeekHeader.isHeaderCollapsed ? '1' : '0',
    transform: 'translateY(calc(var(--qling-peek-progress, 0) * -84px))',
  } as CSSProperties;

  const header = (
    <QlingPeekHeader
      isCollapsed={scrollPeekHeader.isHeaderCollapsed}
      maskIdPrefix="received-worries"
      onOpenMyPage={props.onOpenMyPage}
    />
  );

  if (props.state.status === 'loading') {
    return (
      <section className={screenClassName}>
        <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
          <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
            {header}
            <section
              className={`relative ${loadingContentClassName}`}
              onWheel={blockLoadingScroll}
              onTouchMove={blockLoadingScroll}
            >
              <FigmaTabLoading label={props.state.label} />
            </section>
          </div>
        </div>
      </section>
    );
  }

  if (props.state.status === 'error') {
    return (
      <section className={screenClassName}>
        <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
          <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
            {header}
            <section className={contentClassName} data-header-state="expanded" style={contentStyle} onScroll={scrollPeekHeader.onScroll} onTouchStart={scrollPeekHeader.onTouchStart} onTouchMove={scrollPeekHeader.onTouchMove} onTouchEnd={scrollPeekHeader.onTouchEnd} onWheel={scrollPeekHeader.onWheel}>
              <ErrorState title="답변 피드를 불러오지 못했어요" message={props.state.message} />
            </section>
          </div>
        </div>
      </section>
    );
  }

  if (props.state.status === 'empty') {
    return (
      <section className={screenClassName}>
        <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
          <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
            {header}
            <section className={contentClassName} data-header-state="expanded" style={contentStyle} onScroll={scrollPeekHeader.onScroll} onTouchStart={scrollPeekHeader.onTouchStart} onTouchMove={scrollPeekHeader.onTouchMove} onTouchEnd={scrollPeekHeader.onTouchEnd} onWheel={scrollPeekHeader.onWheel}>
              <EmptyState title={props.state.message} />
            </section>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={screenClassName}>
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
        <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
          {header}
          <section
            className={`${contentClassName} pb-[calc(108px+env(safe-area-inset-bottom,0px))]`}
            data-header-state="expanded"
            style={contentStyle}
            aria-label="받은 고민 목록"
            onScroll={scrollPeekHeader.onScroll}
            onTouchStart={scrollPeekHeader.onTouchStart}
            onTouchMove={scrollPeekHeader.onTouchMove}
            onTouchEnd={scrollPeekHeader.onTouchEnd}
            onWheel={scrollPeekHeader.onWheel}
          >
            <div className="grid gap-[14px]">
              {props.items.map(item => {
                const isPassing = passingDeliveryIds.has(item.deliveryId);
                const content = item.bodyText ?? item.previewText;
                const displayContent = content.length > 45 ? content.replace(/\n/g, ' ').slice(0, 45).trim() + '...' : content;

                return (
                  <QlingCard
                    key={item.deliveryId}
                    className="relative h-[135px] overflow-hidden rounded-[18px] border-0 bg-white p-0 shadow-[0_4px_4px_rgb(0_0_0/0.25)]"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => props.onOpen({ deliveryId: item.deliveryId, worryId: item.worryId })}
                      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        props.onOpen({ deliveryId: item.deliveryId, worryId: item.worryId });
                      }}
                      aria-label={`${item.category} 고민에 답변 작성하기`}
                      className="block h-full w-full px-[18px] pb-7 pt-[11px] text-left focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="inline-flex shrink-0 items-start overflow-hidden rounded-[var(--qling-radius-pill)] bg-[#ffe4cc] px-3 py-[5px] text-[11px] font-bold leading-normal text-[#ff8b3d]">
                            {item.category}
                          </span>
                          <time
                            className="text-[12px] font-bold leading-6 text-[#b8b8b8]"
                            dateTime={item.receivedAt.isoValue}
                          >
                            {item.receivedAt.label}
                          </time>
                        </span>
                        <span role="presentation">
                          <button
                            type="button"
                            onClick={(event: MouseEvent<HTMLButtonElement>) => {
                              event.stopPropagation();
                              props.onPass(item.deliveryId);
                            }}
                            disabled={isPassing}
                            aria-label={`${item.category} 고민 건너뛰기`}
                            className="inline-flex h-[23px] w-[65px] shrink-0 items-center justify-center rounded-[var(--qling-radius-pill)] border border-[#ff8b3d] bg-[#ff8b3d] text-[11px] font-bold leading-normal text-white transition-colors hover:bg-[var(--qling-color-secondary-orange)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isPassing ? '처리 중' : '건너뛰기'}
                          </button>
                        </span>
                      </span>
                      {item.isUnread && <span className="sr-only">새 고민</span>}
                      <span className="mt-[21px] block break-words text-[16px] font-extrabold leading-6 tracking-[-0.03em] text-[#2a2a2a]">
                        {displayContent}
                      </span>
                    </div>
                  </QlingCard>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function blockLoadingScroll(event: WheelEvent<HTMLElement> | TouchEvent<HTMLElement>) {
  const { preventDefault, stopPropagation } = event;
  preventDefault.call(event);
  stopPropagation.call(event);
}
