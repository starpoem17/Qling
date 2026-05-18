import { Heart, Send, UserRound } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  CategoryChip,
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

  const writeButton = (
    <button
      type="button"
      aria-label="고민 작성 화면으로 이동"
      onClick={props.onWriteWorry}
      className="fixed bottom-[calc(var(--qling-space-nav-height)+1.25rem)] left-1/2 z-40 ml-[122px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#ff8b3d] text-white shadow-[0_8px_18px_rgb(42_42_42/0.20)] transition-colors hover:bg-[var(--qling-color-secondary-orange)] focus:outline-none focus:ring-2 focus:ring-white"
    >
      <Send className="h-7 w-7" aria-hidden="true" />
    </button>
  );

  return (
    <div>
      {header}

      {props.state.status === 'loading' ? (
        <section className="-mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px)] rounded-t-[28px] bg-[#fff1d1] px-4 pt-7">
          <LoadingState title="나의 고민을 불러오는 중" message={props.state.label} />
        </section>
      ) : props.state.status === 'error' ? (
        <section className="-mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px)] rounded-t-[28px] bg-[#fff1d1] px-4 pt-7">
          <ErrorState title="나의 고민을 불러오지 못했어요" message={props.state.message} />
        </section>
      ) : props.state.status === 'empty' ? (
        <section className="-mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px)] rounded-t-[28px] bg-[#fff1d1] px-4 pt-7">
          <EmptyState title={props.state.message} />
        </section>
      ) : (
        <section
          className="-mx-[var(--qling-space-shell-x)] min-h-[calc(100dvh-120px)] rounded-t-[28px] bg-[#fff1d1] px-4 pb-28 pt-7"
          aria-label="나의 고민 목록"
        >
          <div className="grid gap-4">
          {props.items.map(worry => (
            <button
              key={worry.worryId}
              type="button"
              aria-label={worry.accessibilityLabel}
              onClick={() => props.onSelectWorryForAnswers(worry)}
              className="w-full rounded-2xl text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2"
            >
              <QlingCard className={cn(
                'space-y-5 rounded-2xl border-0 bg-white px-5 pb-5 pt-3 shadow-[0_5px_9px_rgb(42_42_42/0.24)]',
                worry.hasUnreadReplies && 'ring-2 ring-[#ff8b3d]',
              )}>
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryChip
                    label={worry.categoryLabel}
                    selected
                    disabled
                    className="pointer-events-none min-h-0 w-auto px-3 py-1 text-[12px] leading-4 text-[#ff8b3d] disabled:opacity-100"
                  />
                  {worry.createdAtLabel && (
                    <time className="text-[12px] font-medium text-[#b8b8b8]">
                      {worry.createdAtLabel}
                    </time>
                  )}
                  {worry.hasUnreadReplies && (
                    <span className="ml-auto rounded-[var(--qling-radius-pill)] bg-[#ff8b3d] px-2.5 py-1 text-[11px] font-extrabold text-white">
                      새 답장
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-[16px] font-extrabold leading-7 text-[#2a2a2a]">
                  {worry.summaryText}
                </p>
                <div className="flex items-center gap-2 text-[12px] font-medium text-[#77716b]">
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
