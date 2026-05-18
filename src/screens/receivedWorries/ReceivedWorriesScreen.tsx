import { Loader2, UserRound, XCircle } from 'lucide-react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { cn } from '../../lib/utils';
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
    <header className="-mx-[var(--qling-space-shell-x)] -mt-6 h-[120px] bg-[#ff8b3d] px-4 pt-[68px]">
      <div className="flex items-start justify-between">
        <div
          role="presentation"
          aria-hidden="true"
          className="flex h-10 items-center gap-1"
        >
          <span className="block h-9 w-6 rounded-full bg-white shadow-[inset_-8px_0_0_#2a2a2a]" />
          <span className="block h-9 w-6 rounded-full bg-white shadow-[inset_-8px_0_0_#2a2a2a]" />
        </div>
        <button
          type="button"
          aria-label="마이페이지 열기"
          onClick={props.onOpenMyPage}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <UserRound className="h-7 w-7" aria-hidden="true" />
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
        <div className="grid gap-4">
          {props.items.map(item => {
            const isPassing = passingDeliveryIds.has(item.deliveryId);
            const content = item.bodyText ?? item.previewText;

            return (
              <QlingCard
                key={item.deliveryId}
                className={cn(
                  'relative overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_5px_9px_rgb(42_42_42/0.24)]',
                  item.isUnread && 'ring-2 ring-[#ff8b3d]',
                )}
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
                  className="block w-full px-5 pb-9 pt-3 text-left focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <CategoryChip
                        label={item.category}
                        selected
                        disabled
                        className="pointer-events-none min-h-0 w-auto px-3 py-1 text-[12px] leading-4 text-[#ff8b3d] disabled:opacity-100"
                      />
                      <time
                        className="text-[12px] font-medium leading-7 text-[#b8b8b8]"
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
                        className="inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-[var(--qling-radius-pill)] bg-[#ff8b3d] px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-[var(--qling-color-secondary-orange)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPassing ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <XCircle className="h-3 w-3" aria-hidden="true" />}
                        {isPassing ? '처리 중' : '건너뛰기'}
                      </button>
                    </span>
                  </span>
                  {item.isUnread && <span className="sr-only">새 고민</span>}
                  <span className="mt-6 block whitespace-pre-wrap break-words text-[16px] font-extrabold leading-7 text-[#2a2a2a]">
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
