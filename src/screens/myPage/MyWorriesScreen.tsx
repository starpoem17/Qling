import type { CSSProperties, TouchEvent, WheelEvent } from 'react';
import {
  ErrorState,
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

export function MyWorriesScreen(props: MyWorriesScreenProps) {
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';
  const tabViewportHeight = 'calc(var(--qling-visual-viewport-height) - var(--qling-space-nav-height))';
  const contentViewportHeight = `min(733px, max(320px, calc((${tabViewportHeight}) / (${canvasScale}) - 74px)))`;
  const screenClassName = '-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-[calc(var(--qling-visual-viewport-height)-var(--qling-space-nav-height))] overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d]';
  const writeButtonStyle = {
    top: `min(710px, calc((${tabViewportHeight}) / (${canvasScale}) - 62px))`,
  } satisfies CSSProperties;

  const writeButton = (
    <button
      type="button"
      aria-label="고민 작성 화면으로 이동"
      onClick={props.onWriteWorry}
      className="absolute left-[258px] z-40 flex items-center gap-[7px] overflow-hidden rounded-full bg-[#ff8b3d] py-[14px] pl-[18px] pr-5 text-white shadow-[0_5px_14px_rgb(255_139_61/0.45)] transition-colors hover:bg-[var(--qling-color-secondary-orange)] focus:outline-none focus:ring-2 focus:ring-white"
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
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
        <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
          <MyWorriesStaticHeader onOpenMyPage={props.onOpenMyPage} />
          <CreamContentBackground height={contentViewportHeight} />

          {props.state.status === 'loading' ? (
            <section
              className="qling-received-worries-font absolute left-0 top-[74px] w-full touch-none overscroll-none overflow-hidden rounded-t-[32px]"
              style={{ height: contentViewportHeight }}
              aria-label="나의 고민 로딩 상태"
              onWheel={blockLoadingScroll}
              onTouchMove={blockLoadingScroll}
            >
              <FigmaTabLoading label={props.state.label} className="top-[332px]" />
            </section>
          ) : props.state.status === 'error' ? (
            <section
              className="qling-received-worries-font absolute left-0 top-[74px] w-full overflow-y-auto rounded-t-[32px] px-4 pb-[calc(180px+env(safe-area-inset-bottom,0px))] pt-4 [-webkit-overflow-scrolling:touch]"
              style={{ height: contentViewportHeight }}
            >
              <ErrorState title="나의 고민을 불러오지 못했어요" message={props.state.message} />
            </section>
          ) : props.state.status === 'empty' ? (
            <section
              className="qling-received-worries-font absolute left-0 top-[74px] w-full touch-none overscroll-none overflow-hidden rounded-t-[32px] px-4 pt-4"
              style={{ height: contentViewportHeight }}
              aria-label="나의 고민 빈 상태"
              onWheel={blockLoadingScroll}
              onTouchMove={blockLoadingScroll}
            >
              <MyWorriesIntro activitySummary={props.activitySummary} />
            </section>
          ) : (
            <section
              className="qling-received-worries-font absolute left-0 top-[74px] w-full overflow-y-auto rounded-t-[32px] px-4 pb-[calc(180px+env(safe-area-inset-bottom,0px))] pt-4 [-webkit-overflow-scrolling:touch]"
              style={{ height: contentViewportHeight }}
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
                        {truncateDisplayText(worry.summaryText, cardSummaryLimit)}
                      </p>
                      <div className="absolute bottom-[23px] left-[18px] flex items-center gap-1.5 text-[12px] font-medium text-[#7a7a7a]">
                        <img src={replyHeartUrl} alt="" className="h-3.5 w-3.5" aria-hidden="true" draggable={false} />
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
      </div>
    </section>
  );
}

function MyWorriesStaticHeader({ onOpenMyPage }: { readonly onOpenMyPage: () => void }) {
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
        data-testid="my-worries-top-left-eye"
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

function truncateDisplayText(text: string, limit: number): string {
  const normalized = text.replace(/\n/g, ' ');
  const chars = Array.from(normalized);
  return chars.length > limit ? `${chars.slice(0, limit).join('').trim()}...` : text;
}

function CreamContentBackground({ height }: { readonly height: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 top-[74px] w-full overflow-hidden rounded-t-[32px] bg-[#fff1d1]"
      style={{ height }}
    />
  );
}

function MyWorriesIntro({ activitySummary }: { readonly activitySummary: MyWorriesScreenProps['activitySummary'] }) {
  return (
    <>
      <div className="flex items-center gap-[13px] overflow-hidden pt-0.5">
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
