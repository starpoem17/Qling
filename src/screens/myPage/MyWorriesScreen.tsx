import { CircleUserRound, Heart, Send } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  QlingCard,
} from '../shared/ui';
import type { MyWorriesScreenProps } from './contract';

export function MyWorriesScreen(props: MyWorriesScreenProps) {
  const header = (
    <header className="-mx-[var(--qling-space-shell-x)] -mt-6 h-[120px] bg-[#ff8b3d] px-8 pt-[68px]">
      <div className="flex items-start justify-between">
        <div
          role="presentation"
          aria-hidden="true"
          data-testid="my-worries-top-left-eye"
          className="h-[39px] w-12"
        >
          <svg width="48" height="39" viewBox="0 0 48 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.7228 19.3387C21.8778 35.5589 16.8647 38.1786 10.8719 38.1786C4.87903 38.1786 -0.373688 34.667 0.0208912 19.3387C0.415471 4.01042 4.87903 0.49884 10.8719 0.49884C16.8647 0.49884 21.5678 3.11859 21.7228 19.3387Z" fill="#FFF5EB" />
            <mask id="my-worries-left-eye-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="23" height="39">
              <path d="M22.2634 19.0893C22.4222 35.5242 17.2843 38.1786 11.1424 38.1786C5.00044 38.1786 -0.382987 34.6205 0.0214111 19.0893C0.425809 3.55806 5.00044 0 11.1424 0C17.2843 0 22.1045 2.65443 22.2634 19.0893Z" fill="#FFF5EB" />
            </mask>
            <g mask="url(#my-worries-left-eye-mask)">
              <path d="M25.8168 19.8501C25.8168 27.528 22.0964 33.7521 17.507 33.7521C12.9177 33.7521 9.19727 30.2247 9.19727 19.8501C9.19727 12.1723 12.9177 5.94812 17.507 5.94812C22.0964 5.94812 25.8168 12.1723 25.8168 19.8501Z" fill="#1A1A1A" />
            </g>
            <path d="M47.9969 19.3387C48.1591 35.5589 42.9128 38.1786 36.6412 38.1786C30.3696 38.1786 24.8726 34.667 25.2855 19.3387C25.6985 4.01042 30.3696 0.49884 36.6412 0.49884C42.9128 0.49884 47.8346 3.11859 47.9969 19.3387Z" fill="#FFF5EB" />
            <mask id="my-worries-right-eye-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="25" y="0" width="23" height="39">
              <path d="M47.9958 19.0893C48.1546 35.5242 43.0168 38.1786 36.8748 38.1786C30.7329 38.1786 25.3494 34.6205 25.7538 19.0893C26.1582 3.55806 30.7329 0 36.8748 0C43.0168 0 47.8369 2.65443 47.9958 19.0893Z" fill="#FFF5EB" />
            </mask>
            <g mask="url(#my-worries-right-eye-mask)">
              <path d="M51.5492 19.8501C51.5492 27.528 47.8288 33.7521 43.2395 33.7521C38.6501 33.7521 34.9297 30.2247 34.9297 19.8501C34.9297 12.1723 38.6501 5.94812 43.2395 5.94812C47.8288 5.94812 51.5492 12.1723 51.5492 19.8501Z" fill="#1A1A1A" />
            </g>
          </svg>
        </div>
        <button
          type="button"
          aria-label="마이페이지 열기"
          onClick={props.onOpenMyPage}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <CircleUserRound className="h-7 w-7" aria-hidden="true" />
        </button>
      </div>
    </header>
  );

  const writeButton = (
    <button
      type="button"
      aria-label="고민 작성 화면으로 이동"
      onClick={props.onWriteWorry}
      className="fixed bottom-[calc(var(--qling-space-nav-height)+1.5rem)] left-1/2 z-40 ml-[119px] flex h-[59.5px] w-[59.5px] items-center justify-center rounded-full bg-[#ff8b3d] text-white shadow-[0_8px_18px_rgb(42_42_42/0.20)] transition-colors hover:bg-[var(--qling-color-secondary-orange)] focus:outline-none focus:ring-2 focus:ring-white"
    >
      <Send className="h-7 w-7" aria-hidden="true" />
    </button>
  );

  return (
    <div>
      {header}

      {props.state.status === 'loading' ? (
        <section className="qling-received-worries-font -mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px-var(--qling-space-scroll-bottom))] rounded-t-[32px] bg-[#fff1d1] px-4 pt-[30px]">
          <LoadingState title="나의 고민을 불러오는 중" message={props.state.label} />
        </section>
      ) : props.state.status === 'error' ? (
        <section className="qling-received-worries-font -mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px-var(--qling-space-scroll-bottom))] rounded-t-[32px] bg-[#fff1d1] px-4 pt-[30px]">
          <ErrorState title="나의 고민을 불러오지 못했어요" message={props.state.message} />
        </section>
      ) : props.state.status === 'empty' ? (
        <section className="qling-received-worries-font -mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px-var(--qling-space-scroll-bottom))] rounded-t-[32px] bg-[#fff1d1] px-4 pt-[30px]">
          <EmptyState title={props.state.message} />
        </section>
      ) : (
        <section
          className="qling-received-worries-font -mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px-var(--qling-space-scroll-bottom))] rounded-t-[32px] bg-[#fff1d1] px-4 pb-28 pt-[30px]"
          aria-label="나의 고민 목록"
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

      {writeButton}
    </div>
  );
}
