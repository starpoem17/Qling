import type { CSSProperties, KeyboardEvent, MouseEvent, TouchEvent, WheelEvent } from 'react';
import { ErrorState, FigmaCanvasFrame, QlingCard } from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import type { ReceivedWorriesScreenProps } from './contract';

const headerEyeUrl = new URL('../../../assets/reply/profile_icon.svg', import.meta.url).href;
const myPageIconUrl = new URL('../../../assets/reply/my_page_icon.svg', import.meta.url).href;
const titleChatIconUrl = new URL('../../../assets/reply/title_chat_icon.svg', import.meta.url).href;
const waitingCountIconUrl = new URL('../../../assets/reply/waiting_count_icon.svg', import.meta.url).href;
const cardSummaryLimit = 50;
const receivedWorryCardInnerStyle = {
  padding: 'calc(11 / 361 * 100cqw) calc(18 / 361 * 100cqw) calc(28 / 361 * 100cqw)',
} satisfies CSSProperties;
const receivedWorryCardMetaRowStyle = {
  gap: 'calc(12 / 361 * 100cqw)',
} satisfies CSSProperties;
const receivedWorryCardChipStyle = {
  padding: 'calc(5 / 361 * 100cqw) calc(12 / 361 * 100cqw)',
  fontSize: 'calc(11 / 361 * 100cqw)',
} satisfies CSSProperties;
const receivedWorryCardTimeStyle = {
  fontSize: 'calc(12 / 361 * 100cqw)',
  lineHeight: 'calc(24 / 361 * 100cqw)',
} satisfies CSSProperties;
const receivedWorryPassButtonStyle = {
  width: 'calc(65 / 361 * 100cqw)',
  height: 'calc(23 / 361 * 100cqw)',
  fontSize: 'calc(11 / 361 * 100cqw)',
} satisfies CSSProperties;
const receivedWorryCardBodyStyle = {
  marginTop: 'calc(21 / 361 * 100cqw)',
  fontSize: 'calc(16 / 361 * 100cqw)',
  lineHeight: 'calc(24 / 361 * 100cqw)',
} satisfies CSSProperties;

export function ReceivedWorriesScreen(props: ReceivedWorriesScreenProps) {
  const passingDeliveryIds = new Set(props.passingDeliveryIds);
  const tabViewportHeight = 'var(--qling-tab-viewport-height)';
  const contentTop = 'calc(74px + var(--qling-space-safe-top))';
  const contentViewportHeight = `max(320px, calc((${tabViewportHeight}) - 74px - var(--qling-space-safe-top)))`;
  const screenClassName = '-mx-[var(--qling-space-shell-x)] h-[var(--qling-tab-viewport-height)] overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-full min-h-0 w-full max-w-[480px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d]';

  if (props.state.status === 'loading') {
    return (
      <section className={screenClassName}>
        <FigmaCanvasFrame className="max-w-[480px]">
          <div className={canvasClassName}>
            <ReplyStaticHeader onOpenMyPage={props.onOpenMyPage} />
            <CreamContentBackground height={contentViewportHeight} />
            <section
              className="qling-received-worries-font absolute left-0 w-full touch-none overscroll-none overflow-hidden rounded-t-[32px]"
              style={{ height: contentViewportHeight, top: contentTop }}
              aria-label="받은 고민 로딩 상태"
              onWheel={blockLoadingScroll}
              onTouchMove={blockLoadingScroll}
            >
              <FigmaTabLoading label={props.state.label} className="top-[332px]" />
            </section>
          </div>
        </FigmaCanvasFrame>
      </section>
    );
  }

  if (props.state.status === 'error') {
    return (
      <section className={screenClassName}>
        <FigmaCanvasFrame className="max-w-[480px]">
          <div className={canvasClassName}>
            <ReplyStaticHeader onOpenMyPage={props.onOpenMyPage} />
            <CreamContentBackground height={contentViewportHeight} />
            <section
              className="qling-received-worries-font absolute left-0 w-full overflow-y-auto rounded-t-[32px] px-4 pb-[132px] pt-4 [-webkit-overflow-scrolling:touch]"
              style={{ height: contentViewportHeight, top: contentTop }}
            >
              <ErrorState title="답변 피드를 불러오지 못했어요" message={props.state.message} />
            </section>
          </div>
        </FigmaCanvasFrame>
      </section>
    );
  }

  if (props.state.status === 'empty') {
    return (
      <section className={screenClassName}>
        <FigmaCanvasFrame className="max-w-[480px]">
          <div className={canvasClassName}>
            <ReplyStaticHeader onOpenMyPage={props.onOpenMyPage} />
            <CreamContentBackground height={contentViewportHeight} />
            <section
              className="qling-received-worries-font absolute left-0 w-full touch-none overscroll-none overflow-hidden rounded-t-[32px] px-4 pt-4"
              style={{ height: contentViewportHeight, top: contentTop }}
              aria-label="받은 고민 빈 상태"
              onWheel={blockLoadingScroll}
              onTouchMove={blockLoadingScroll}
            >
              <ReplyFeedIntro waitingCount={props.waitingCount} />
            </section>
          </div>
        </FigmaCanvasFrame>
      </section>
    );
  }

  return (
    <section className={screenClassName}>
      <FigmaCanvasFrame className="max-w-[480px]">
        <div className={canvasClassName}>
          <ReplyStaticHeader onOpenMyPage={props.onOpenMyPage} />
          <CreamContentBackground height={contentViewportHeight} />
          <section
            className="qling-received-worries-font absolute left-0 w-full overflow-y-auto rounded-t-[32px] px-4 pb-[132px] pt-4 [-webkit-overflow-scrolling:touch]"
            style={{ height: contentViewportHeight, top: contentTop }}
            aria-label="받은 고민 목록"
          >
            <div className="grid gap-[14px]">
              <ReplyFeedIntro waitingCount={props.waitingCount} />
              {props.items.map(item => {
                const isPassing = passingDeliveryIds.has(item.deliveryId);
                const content = item.bodyText ?? item.previewText;
                const displayContent = truncateDisplayText(content, cardSummaryLimit);

                return (
                  <QlingCard
                    key={item.deliveryId}
                    className="relative aspect-[361/135] overflow-hidden rounded-[18px] border-0 bg-white p-0 shadow-[0_4px_4px_rgb(0_0_0/0.25)] [container-type:inline-size]"
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
                      className="block h-full w-full text-left focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset"
                      style={receivedWorryCardInnerStyle}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="flex min-w-0 items-center" style={receivedWorryCardMetaRowStyle}>
                          <span className="inline-flex shrink-0 items-start overflow-hidden rounded-[var(--qling-radius-pill)] bg-[#ffe4cc] font-bold leading-normal text-[#ff8b3d]" style={receivedWorryCardChipStyle}>
                            {item.category}
                          </span>
                          <time
                            className="font-bold text-[#b8b8b8]"
                            style={receivedWorryCardTimeStyle}
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
                            className="inline-flex shrink-0 items-center justify-center rounded-[var(--qling-radius-pill)] border border-[#ff8b3d] bg-[#ff8b3d] font-bold leading-normal text-white transition-colors hover:bg-[var(--qling-color-secondary-orange)] disabled:cursor-not-allowed disabled:opacity-60"
                            style={receivedWorryPassButtonStyle}
                          >
                            {isPassing ? '처리 중' : '건너뛰기'}
                          </button>
                        </span>
                      </span>
                      {item.isUnread && <span className="sr-only">새 고민</span>}
                      <span className="block break-words font-extrabold tracking-[-0.03em] text-[#2a2a2a]" style={receivedWorryCardBodyStyle}>
                        {displayContent}
                      </span>
                    </div>
                  </QlingCard>
                );
              })}
            </div>
          </section>
        </div>
      </FigmaCanvasFrame>
    </section>
  );
}

function ReplyStaticHeader({ onOpenMyPage }: { readonly onOpenMyPage: () => void }) {
  return (
    <header
      className="absolute left-0 top-0 h-[calc(74px+var(--qling-space-safe-top))] w-full touch-none overscroll-none bg-[#ff8b3d]"
      onTouchMove={blockLoadingScroll}
      onWheel={blockLoadingScroll}
    >
      <img
        src={headerEyeUrl}
        alt=""
        role="presentation"
        aria-hidden="true"
        className="absolute left-8 top-[calc(var(--qling-space-safe-top)+20px)] h-[38.179px] w-[48.001px]"
        draggable={false}
      />
      <button
        type="button"
        aria-label="마이페이지 열기"
        onClick={onOpenMyPage}
        className="absolute right-[17px] top-[calc(var(--qling-space-safe-top)+21px)] h-[49px] w-[49px] rounded-full transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
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

function truncateDisplayText(text: string, limit: number): string {
  const normalized = text.replace(/\n/g, ' ');
  const chars = Array.from(normalized);
  return chars.length > limit ? `${chars.slice(0, limit).join('').trim()}...` : text;
}

function CreamContentBackground({ height }: { readonly height: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 w-full rounded-t-[32px] bg-[#fff1d1]"
      style={{ height, top: 'calc(74px + var(--qling-space-safe-top))' }}
    />
  );
}

function ReplyFeedIntro({ waitingCount }: { readonly waitingCount: number }) {
  return (
    <>
      <div className="flex items-center justify-between overflow-hidden pt-0.5">
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
