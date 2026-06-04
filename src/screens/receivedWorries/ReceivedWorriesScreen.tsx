import type { KeyboardEvent, MouseEvent, TouchEvent, WheelEvent } from 'react';
import { ErrorState, QlingCard } from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import type { ReceivedWorriesScreenProps } from './contract';

const headerEyeUrl = new URL('../../../assets/reply/profile_icon.svg', import.meta.url).href;
const myPageIconUrl = new URL('../../../assets/reply/my_page_icon.svg', import.meta.url).href;
const titleChatIconUrl = new URL('../../../assets/reply/title_chat_icon.svg', import.meta.url).href;
const waitingCountIconUrl = new URL('../../../assets/reply/waiting_count_icon.svg', import.meta.url).href;

export function ReceivedWorriesScreen(props: ReceivedWorriesScreenProps) {
  const passingDeliveryIds = new Set(props.passingDeliveryIds);
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';
  const screenClassName = '-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d]';

  if (props.state.status === 'loading') {
    return (
      <section className={screenClassName}>
        <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
          <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
            <ReplyStaticHeader onOpenMyPage={props.onOpenMyPage} />
            <CreamContentBackground />
            <section
              className="qling-received-worries-font absolute left-0 top-[74px] h-[752px] w-full touch-none overscroll-none overflow-hidden rounded-t-[32px]"
              aria-label="받은 고민 로딩 상태"
              onWheel={blockLoadingScroll}
              onTouchMove={blockLoadingScroll}
            >
              <FigmaTabLoading label={props.state.label} className="top-[332px]" />
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
            <ReplyStaticHeader onOpenMyPage={props.onOpenMyPage} />
            <CreamContentBackground />
            <section className="qling-received-worries-font absolute left-0 top-[74px] h-[752px] w-full overflow-y-auto rounded-t-[32px] px-4 pb-[108px] pt-4 [-webkit-overflow-scrolling:touch]">
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
            <ReplyStaticHeader onOpenMyPage={props.onOpenMyPage} />
            <CreamContentBackground />
            <section
              className="qling-received-worries-font absolute left-0 top-[74px] h-[752px] w-full touch-none overscroll-none overflow-hidden rounded-t-[32px] px-4 pt-4"
              aria-label="받은 고민 빈 상태"
              onWheel={blockLoadingScroll}
              onTouchMove={blockLoadingScroll}
            >
              <ReplyFeedIntro waitingCount={props.waitingCount} />
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
          <ReplyStaticHeader onOpenMyPage={props.onOpenMyPage} />
          <CreamContentBackground />
          <section
            className="qling-received-worries-font absolute left-0 top-[74px] h-[752px] w-full overflow-y-auto rounded-t-[32px] px-4 pb-[108px] pt-4 [-webkit-overflow-scrolling:touch]"
            aria-label="받은 고민 목록"
          >
            <div className="grid gap-[14px]">
              <ReplyFeedIntro waitingCount={props.waitingCount} />
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

function ReplyStaticHeader({ onOpenMyPage }: { readonly onOpenMyPage: () => void }) {
  return (
    <header
      className="absolute left-0 top-0 h-[74px] w-full touch-none overscroll-none bg-[#ff8b3d]"
      onTouchMove={blockLoadingScroll}
      onWheel={blockLoadingScroll}
    >
      <img
        src={headerEyeUrl}
        alt=""
        role="presentation"
        aria-hidden="true"
        className="absolute left-8 top-5 h-[38.179px] w-[48.001px]"
        draggable={false}
      />
      <button
        type="button"
        aria-label="마이페이지 열기"
        onClick={onOpenMyPage}
        className="absolute left-[327px] top-[21px] h-[49px] w-[49px] rounded-full transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <img
          src={myPageIconUrl}
          alt=""
          aria-hidden="true"
          className="absolute left-3 top-3 h-[25px] w-[25px]"
          draggable={false}
        />
      </button>
    </header>
  );
}

function CreamContentBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 top-[74px] h-[752px] w-full rounded-t-[32px] bg-[#fff1d1]"
    />
  );
}

function ReplyFeedIntro({ waitingCount }: { readonly waitingCount: number }) {
  return (
    <>
      <div className="flex items-center gap-2 overflow-hidden pt-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="w-[187px] pl-2 text-[22px] font-extrabold leading-normal tracking-[-0.44px] text-[#f26c0f]">
            답변하기
          </h1>
          <p className="w-[275px] pl-2 text-[13px] font-medium leading-normal tracking-[-0.13px] text-[#8a8a8a]">
            다른 친구의 고민에 마음을 나눠주세요
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffe4cc]" aria-hidden="true">
          <img src={titleChatIconUrl} alt="" className="h-[22px] w-[22px]" draggable={false} />
        </div>
      </div>
      <div className="flex items-center gap-[9px] overflow-hidden rounded-[14px] bg-[#ffe4cc] px-[14px] py-3 text-[13.5px] font-bold leading-normal tracking-[-0.135px] text-[#7a4b22]">
        <img src={waitingCountIconUrl} alt="" className="h-[17px] w-[17px] shrink-0" aria-hidden="true" draggable={false} />
        <p className="min-w-0 flex-1">
          지금 <strong className="text-[#e8631a]">{waitingCount}명</strong>이 답변을 기다리고 있어요
        </p>
      </div>
    </>
  );
}

function blockLoadingScroll(event: WheelEvent<HTMLElement> | TouchEvent<HTMLElement>) {
  const { preventDefault, stopPropagation } = event;
  preventDefault.call(event);
  stopPropagation.call(event);
}
