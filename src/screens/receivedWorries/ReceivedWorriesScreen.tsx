import { CircleUserRound } from 'lucide-react';
import type { KeyboardEvent, MouseEvent } from 'react';
import {
  CategoryChip,
  EmptyState,
  ErrorState,
  LoadingState,
  QlingCard,
} from '../shared/ui';
import type { ReceivedWorriesScreenProps } from './contract';

export function ReceivedWorriesScreen(props: ReceivedWorriesScreenProps) {
  const passingDeliveryIds = new Set(props.passingDeliveryIds);

  const header = (
    <header className="-mx-[var(--qling-space-shell-x)] -mt-6 h-[120px] bg-[#ff8b3d] px-8 pt-[68px]">
      <div className="flex items-start justify-between">
        <div
          role="presentation"
          aria-hidden="true"
          className="h-[39px] w-12"
        >
          <svg width="48" height="39" viewBox="0 0 48 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.7228 19.3387C21.8778 35.5589 16.8647 38.1786 10.8719 38.1786C4.87903 38.1786 -0.373688 34.667 0.0208912 19.3387C0.415471 4.01042 4.87903 0.49884 10.8719 0.49884C16.8647 0.49884 21.5678 3.11859 21.7228 19.3387Z" fill="#FFF5EB" />
            <mask id="received-worries-left-eye-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="23" height="39">
              <path d="M22.2634 19.0893C22.4222 35.5242 17.2843 38.1786 11.1424 38.1786C5.00044 38.1786 -0.382987 34.6205 0.0214111 19.0893C0.425809 3.55806 5.00044 0 11.1424 0C17.2843 0 22.1045 2.65443 22.2634 19.0893Z" fill="#FFF5EB" />
            </mask>
            <g mask="url(#received-worries-left-eye-mask)">
              <path d="M25.8168 19.8501C25.8168 27.528 22.0964 33.7521 17.507 33.7521C12.9177 33.7521 9.19727 30.2247 9.19727 19.8501C9.19727 12.1723 12.9177 5.94812 17.507 5.94812C22.0964 5.94812 25.8168 12.1723 25.8168 19.8501Z" fill="#1A1A1A" />
            </g>
            <path d="M47.9969 19.3387C48.1591 35.5589 42.9128 38.1786 36.6412 38.1786C30.3696 38.1786 24.8726 34.667 25.2855 19.3387C25.6985 4.01042 30.3696 0.49884 36.6412 0.49884C42.9128 0.49884 47.8346 3.11859 47.9969 19.3387Z" fill="#FFF5EB" />
            <mask id="received-worries-right-eye-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="25" y="0" width="23" height="39">
              <path d="M47.9958 19.0893C48.1546 35.5242 43.0168 38.1786 36.8748 38.1786C30.7329 38.1786 25.3494 34.6205 25.7538 19.0893C26.1582 3.55806 30.7329 0 36.8748 0C43.0168 0 47.8369 2.65443 47.9958 19.0893Z" fill="#FFF5EB" />
            </mask>
            <g mask="url(#received-worries-right-eye-mask)">
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

  if (props.state.status === 'loading') {
    return (
      <div>
        {header}
        <section className="-mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px)] rounded-t-[28px] bg-[#fff1d1] px-4 pt-5">
          <LoadingState title="고민을 불러오고 있어요" message={props.state.label} />
        </section>
      </div>
    );
  }

  if (props.state.status === 'error') {
    return (
      <div>
        {header}
        <section className="-mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px)] rounded-t-[28px] bg-[#fff1d1] px-4 pt-5">
          <ErrorState title="답변 피드를 불러오지 못했어요" message={props.state.message} />
        </section>
      </div>
    );
  }

  if (props.state.status === 'empty') {
    return (
      <div>
        {header}
        <section className="-mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px)] rounded-t-[28px] bg-[#fff1d1] px-4 pt-5">
          <EmptyState title={props.state.message} />
        </section>
      </div>
    );
  }

  return (
    <div>
      {header}
      <section
        className="-mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px)] rounded-t-[28px] bg-[#fff1d1] px-4 pb-4 pt-5"
        aria-label="받은 고민 목록"
      >
        <div className="grid gap-[14px]">
          {props.items.map(item => {
            const isPassing = passingDeliveryIds.has(item.deliveryId);
            const content = item.bodyText ?? item.previewText;

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
                      <CategoryChip
                        label={item.category}
                        selected
                        disabled
                        className="pointer-events-none h-6 min-h-0 w-auto border-0 bg-[#ffe4cc] px-3 py-0 text-[11px] font-bold leading-[14px] text-[#ff8b3d] disabled:opacity-100"
                      />
                      <time
                        className="text-[12px] font-medium leading-6 text-[#b8b8b8]"
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
                        className="inline-flex h-[23px] w-[65px] shrink-0 items-center justify-center rounded-[var(--qling-radius-pill)] border border-[#ff8b3d] bg-[#ff8b3d] text-[11px] font-bold leading-[14px] text-white transition-colors hover:bg-[var(--qling-color-secondary-orange)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPassing ? '처리 중' : '건너뛰기'}
                      </button>
                    </span>
                  </span>
                  {item.isUnread && <span className="sr-only">새 고민</span>}
                  <span className="mt-[21px] line-clamp-2 block whitespace-pre-wrap break-words text-[16px] font-extrabold leading-6 tracking-[-0.03em] text-[#2a2a2a]">
                    {content}
                  </span>
                </div>
              </QlingCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
