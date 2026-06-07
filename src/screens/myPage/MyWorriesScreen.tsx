import type { CSSProperties, TouchEvent, WheelEvent } from 'react';
import {
  ErrorState,
  FigmaCanvasFrame,
  QlingCard,
} from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import type { MyWorriesScreenProps } from './contract';

const headerEyeUrl = new URL('../../../assets/my_concerns/header_eye.svg', import.meta.url).href;
const myPageIconUrl = new URL('../../../assets/my_concerns/my_page_icon.svg', import.meta.url).href;
const titleHeartUrl = new URL('../../../assets/my_concerns/title_heart.svg', import.meta.url).href;
const replyHeartUrl = new URL('../../../assets/my_concerns/reply_heart.svg', import.meta.url).href;
const writePlusUrl = new URL('../../../assets/my_concerns/write_plus.svg', import.meta.url).href;
const cardSummaryLimit = 50;
const myWorryCardTopStyle = {
  padding: 'calc(11 / 361 * 100cqw) calc(18 / 361 * 100cqw) 0',
} satisfies CSSProperties;
const myWorryCardMetaRowStyle = {
  gap: 'calc(12 / 361 * 100cqw)',
} satisfies CSSProperties;
const myWorryCardChipStyle = {
  padding: 'calc(5 / 361 * 100cqw) calc(12 / 361 * 100cqw)',
  fontSize: 'calc(11 / 361 * 100cqw)',
} satisfies CSSProperties;
const myWorryCardTimeStyle = {
  fontSize: 'calc(12 / 361 * 100cqw)',
  lineHeight: 'calc(23 / 361 * 100cqw)',
} satisfies CSSProperties;
const myWorryCardSummaryStyle = {
  marginTop: 'calc(21 / 361 * 100cqw)',
  fontSize: 'calc(16 / 361 * 100cqw)',
  lineHeight: 'calc(24 / 361 * 100cqw)',
} satisfies CSSProperties;
const myWorryCardReplyMetaStyle = {
  bottom: 'calc(23 / 361 * 100cqw)',
  left: 'calc(18 / 361 * 100cqw)',
  gap: 'calc(6 / 361 * 100cqw)',
  fontSize: 'calc(12 / 361 * 100cqw)',
} satisfies CSSProperties;
const myWorryCardReplyIconStyle = {
  width: 'calc(14 / 361 * 100cqw)',
  height: 'calc(14 / 361 * 100cqw)',
} satisfies CSSProperties;

export function MyWorriesScreen(props: MyWorriesScreenProps) {
  const tabViewportHeight = 'var(--qling-tab-viewport-height)';
  const contentTop = 'calc(74px + var(--qling-space-safe-top))';
  const contentViewportHeight = `max(320px, calc((${tabViewportHeight}) - 74px - var(--qling-space-safe-top)))`;
  const screenClassName = '-mx-[var(--qling-space-shell-x)] h-[var(--qling-tab-viewport-height)] overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-full min-h-0 w-full max-w-[480px] shrink-0 overflow-hidden bg-[#ff8b3d]';
  const scrollableContentStyle = {
    height: contentViewportHeight,
    top: contentTop,
    paddingBottom: '78px',
  } satisfies CSSProperties;
  const writeButtonStyle = {
    bottom: '16px',
  } satisfies CSSProperties;

  const writeButton = (
    <button
      type="button"
      aria-label="고민 작성 화면으로 이동"
      onClick={props.onWriteWorry}
      className="absolute right-[18px] z-40 flex items-center gap-[7px] overflow-hidden rounded-full bg-[#ff8b3d] py-[14px] pl-[18px] pr-5 text-white shadow-[0_5px_14px_rgb(255_139_61/0.45)] transition-colors hover:bg-[var(--qling-color-secondary-orange)] focus:outline-none focus:ring-2 focus:ring-white"
      style={writeButtonStyle}
    >
      <img src={writePlusUrl} alt="" className="h-[15.563px] w-[15.563px] shrink-0" aria-hidden="true" draggable={false} />
      <span className="whitespace-nowrap text-[15px] font-bold leading-normal tracking-[-0.3px]">
        고민 쓰기
      </span>
    </button>
  );

  return (
    <section className={screenClassName}>
      <FigmaCanvasFrame className="max-w-[480px]">
        <div className={canvasClassName}>
          <MyWorriesStaticHeader onOpenMyPage={props.onOpenMyPage} />
          <CreamContentBackground height={contentViewportHeight} />

          {props.state.status === 'loading' ? (
            <section
              className="qling-received-worries-font absolute left-0 w-full touch-none overscroll-none overflow-hidden rounded-t-[32px]"
              style={{ height: contentViewportHeight, top: contentTop }}
              aria-label="나의 고민 로딩 상태"
              onWheel={blockLoadingScroll}
              onTouchMove={blockLoadingScroll}
            >
              <FigmaTabLoading label={props.state.label} className="top-[332px]" />
            </section>
          ) : props.state.status === 'error' ? (
            <section
              className="qling-received-worries-font absolute left-0 w-full overflow-y-auto rounded-t-[32px] px-4 pt-4 [-webkit-overflow-scrolling:touch]"
              style={scrollableContentStyle}
            >
              <ErrorState title="나의 고민을 불러오지 못했어요" message={props.state.message} />
            </section>
          ) : props.state.status === 'empty' ? (
            <section
              className="qling-received-worries-font absolute left-0 w-full touch-none overscroll-none overflow-hidden rounded-t-[32px] px-4 pt-4"
              style={{ height: contentViewportHeight, top: contentTop }}
              aria-label="나의 고민 빈 상태"
              onWheel={blockLoadingScroll}
              onTouchMove={blockLoadingScroll}
            >
              <MyWorriesIntro activitySummary={props.activitySummary} />
            </section>
          ) : (
            <section
              className="qling-received-worries-font absolute left-0 w-full overflow-y-auto rounded-t-[32px] px-4 pt-4 [-webkit-overflow-scrolling:touch]"
              style={scrollableContentStyle}
              aria-label="나의 고민 목록"
            >
              <div className="grid gap-[14px]">
                <MyWorriesIntro activitySummary={props.activitySummary} />
                {props.items.map(worry => (
                  <button
                    key={worry.worryId}
                    type="button"
                    aria-label={worry.accessibilityLabel}
                    onClick={() => props.onSelectWorryForAnswers(worry)}
                    className="w-full rounded-[18px] text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2"
                  >
                    <QlingCard className="relative aspect-[361/168] overflow-hidden rounded-[18px] border-0 bg-white p-0 shadow-[0_4px_4px_rgb(0_0_0/0.25)] [container-type:inline-size]">
                      <div style={myWorryCardTopStyle}>
                        <div className="flex min-w-0 items-center" style={myWorryCardMetaRowStyle}>
                          <span className="inline-flex shrink-0 items-start overflow-hidden rounded-[var(--qling-radius-pill)] bg-[#ffe4cc] font-bold leading-normal text-[#ff8b3d]" style={myWorryCardChipStyle}>
                            {worry.categoryLabel}
                          </span>
                          {worry.createdAtLabel && (
                            <time className="font-semibold text-[#b8b8b8]" style={myWorryCardTimeStyle}>
                              {worry.createdAtLabel}
                            </time>
                          )}
                        </div>
                        <p className="line-clamp-2 whitespace-pre-wrap break-words font-extrabold text-[#2a2a2a]" style={myWorryCardSummaryStyle}>
                          {truncateDisplayText(worry.summaryText, cardSummaryLimit)}
                        </p>
                      </div>
                      <div className="absolute flex items-center font-medium text-[#7a7a7a]" style={myWorryCardReplyMetaStyle}>
                        <img src={replyHeartUrl} alt="" className="shrink-0" style={myWorryCardReplyIconStyle} aria-hidden="true" draggable={false} />
                        <span>{worry.replyCountLabel}</span>
                      </div>
                    </QlingCard>
                  </button>
                ))}
              </div>
            </section>
          )}

          {writeButton}
        </div>
      </FigmaCanvasFrame>
    </section>
  );
}

function MyWorriesStaticHeader({ onOpenMyPage }: { readonly onOpenMyPage: () => void }) {
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
        data-testid="my-worries-top-left-eye"
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
      className="absolute left-0 w-full overflow-hidden rounded-t-[32px] bg-[#fff1d1]"
      style={{ height, top: 'calc(74px + var(--qling-space-safe-top))' }}
    />
  );
}

function MyWorriesIntro({ activitySummary }: { readonly activitySummary: MyWorriesScreenProps['activitySummary'] }) {
  return (
    <>
      <div className="flex items-center justify-between overflow-hidden pt-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="w-[183px] pl-2 text-[22px] font-extrabold leading-normal tracking-[-0.44px] text-[#f26c0f]">
            나의 고민
          </h1>
          <p className="w-[271px] pl-2 text-[13px] font-medium leading-normal tracking-[-0.13px] text-[#8a8a8a]">
            내가 남긴 고민과 받은 답변이에요
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffe4cc]" aria-hidden="true">
          <img src={titleHeartUrl} alt="" className="h-[22px] w-[22px]" draggable={false} />
        </div>
      </div>
      <section
        aria-label="내 활동 요약"
        className="grid grid-cols-[1fr_1px_1fr_1px_1fr] items-center overflow-hidden rounded-[16px] bg-white px-2 py-[15px] text-center shadow-[0_3px_10px_rgb(0_0_0/0.08)]"
      >
        <ActivitySummaryMetric value={activitySummary.worryCount} label="남긴 고민" />
        <div className="h-[26px] bg-[#eee]" aria-hidden="true" />
        <ActivitySummaryMetric value={activitySummary.replyCount} label="받은 답변" />
        <div className="h-[26px] bg-[#eee]" aria-hidden="true" />
        <ActivitySummaryMetric value={activitySummary.unreadReplyCount} label="새 답변" accent />
      </section>
    </>
  );
}

function ActivitySummaryMetric(props: {
  readonly value: number;
  readonly label: string;
  readonly accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className={`text-[20px] font-black leading-normal tracking-[-0.01em] ${props.accent ? 'text-[#ff8b3d]' : 'text-[#2a2a2a]'}`}>
        {props.value}
      </p>
      <p className="text-[11px] font-medium leading-normal text-[#8a8a8a]">
        {props.label}
      </p>
    </div>
  );
}

function blockLoadingScroll(event: WheelEvent<HTMLElement> | TouchEvent<HTMLElement>) {
  const { preventDefault, stopPropagation } = event;
  preventDefault.call(event);
  stopPropagation.call(event);
}
