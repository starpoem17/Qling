import { ArrowLeft, Heart } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, OrangeHeaderBand, QlingCard, SuccessBadge } from '../shared/ui';
import type { MyAnswersScreenProps } from './contract';

export function MyAnswersScreen(props: MyAnswersScreenProps) {
  return (
    <div className="mx-auto max-w-xl space-y-5 pb-6">
      <OrangeHeaderBand className="-mx-[var(--qling-space-shell-x)] rounded-b-[32px] pb-10 pt-4">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
          <button
            type="button"
            onClick={props.onBack}
            aria-label="마이페이지로 돌아가기"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--qling-color-text)] transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[var(--qling-color-text)]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="text-center text-lg font-extrabold">내가 쓴 답변</h1>
        </div>
        <p className="mx-auto mt-4 max-w-xs text-center text-sm font-semibold leading-6 text-[var(--qling-color-text)]">
          내가 보낸 답변과 받은 반응을 확인합니다.
        </p>
      </OrangeHeaderBand>

      <div className="-mt-8 space-y-3">
        {props.state.status === 'loading' && <LoadingState title={props.state.label} />}
        {props.state.status === 'error' && <ErrorState title="내가 쓴 답변을 불러오지 못했어요." message={props.state.message} />}
        {props.state.status === 'empty' && (
          <EmptyState title="아직 내가 보낸 위로가 없어요." message={props.state.message} />
        )}
        {props.state.status === 'ready' && props.items.map(reply => (
          <article
            key={reply.replyId}
            aria-label={reply.accessibilityLabel}
            className="block w-full rounded-[18px] text-left"
          >
            <QlingCard className="space-y-3 rounded-[18px]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {reply.categoryLabel && (
                    <span className="rounded-[var(--qling-radius-pill)] bg-[#ffe4cc] px-3 py-1 text-xs font-extrabold text-[var(--qling-color-primary-orange)]">
                      {reply.categoryLabel}
                    </span>
                  )}
                  {reply.isUnread && <SuccessBadge label="새 반응" />}
                </div>
                {reply.hasReceivedHeart && <Heart className="h-5 w-5 shrink-0 fill-[var(--qling-color-danger)] text-[var(--qling-color-danger)]" aria-hidden="true" />}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--qling-color-muted)]">
                  {reply.dateLabel && <span>{reply.dateLabel}</span>}
                  {reply.feedbackLabel && <span>{reply.feedbackLabel}</span>}
                </div>
                <p className="whitespace-pre-wrap break-words text-base font-extrabold leading-7 text-[var(--qling-color-text)]">
                  {reply.originalWorryPreview}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-[var(--qling-color-muted)]">
                  {reply.previewText}
                </p>
                {reply.feedbackComment && (
                  <p className="whitespace-pre-wrap break-words border-t border-[var(--qling-color-border)] pt-2 text-xs font-semibold leading-5 text-[var(--qling-color-muted)]">
                    {reply.feedbackComment}
                  </p>
                )}
              </div>
            </QlingCard>
          </article>
        ))}
      </div>
    </div>
  );
}
