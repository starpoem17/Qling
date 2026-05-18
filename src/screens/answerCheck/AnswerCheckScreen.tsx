import { ArrowLeft, MessageCircle, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ErrorState, LoadingState, QlingCard, QlingTextArea, PrimaryCTA, SecondaryCTA } from '../shared/ui';
import type { AnswerCheckReplyProps, AnswerCheckScreenProps } from './contract';

export function AnswerCheckScreen(props: AnswerCheckScreenProps) {
  if (props.state.status === 'loading') {
    return (
      <AnswerCheckFrame onBack={props.onBack}>
        <LoadingState title={props.state.label} />
      </AnswerCheckFrame>
    );
  }

  if (props.state.status === 'error') {
    return (
      <AnswerCheckFrame onBack={props.onBack}>
        <ErrorState title="답변을 불러오지 못했어요." message={props.state.message} />
      </AnswerCheckFrame>
    );
  }

  return (
    <AnswerCheckFrame onBack={props.onBack}>
      {props.worry && (
        <QlingCard className="space-y-3 bg-[var(--qling-color-cream-soft)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[var(--qling-radius-pill)] bg-white px-3 py-1 text-xs font-bold text-[var(--qling-color-primary-orange)]">
              {props.worry.categoryLabel}
            </span>
            <span className="text-xs font-semibold text-[var(--qling-color-muted)]">{props.worry.createdAtLabel}</span>
          </div>
          <p className="text-xs font-bold text-[var(--qling-color-muted)]">내 고민</p>
          <p className="whitespace-pre-wrap break-words text-base font-extrabold leading-7 text-[var(--qling-color-text)]">
            {props.worry.bodyText}
          </p>
        </QlingCard>
      )}

      <div className="space-y-4" aria-label="도착한 답변 목록">
        {props.replies.map(reply => (
          <AnswerCard
            key={reply.replyId}
            reply={reply}
            onLike={props.onLike}
            onDislike={props.onDislike}
            onOpenComment={props.onOpenComment}
          />
        ))}
      </div>

      {props.commentDialog && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 px-4 pb-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={props.commentDialog.feedbackState === 'liked' ? '좋아요 코멘트 입력' : '싫어요 코멘트 입력'}
            className="w-full max-w-[360px] rounded-[var(--qling-radius-card)] bg-white p-5 shadow-[var(--qling-shadow-sheet)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-[var(--qling-color-text)]">코멘트 남기기</h2>
              <button
                type="button"
                aria-label="코멘트 창 닫기"
                onClick={props.onCommentClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--qling-color-muted)] hover:bg-[var(--qling-color-cream)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {props.commentDialog.moderationMessage && (
              <p className="mb-3 whitespace-pre-wrap text-sm font-semibold text-[var(--qling-color-danger)]">
                {props.commentDialog.moderationMessage}
              </p>
            )}
            <QlingTextArea
              value={props.commentDialog.draft}
              onChange={props.onCommentChange}
              maxLength={props.commentDialog.maxLength}
              label="코멘트"
              placeholder="전하고 싶은 말을 남겨주세요."
              errorMessage={props.commentDialog.validationMessage}
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SecondaryCTA onClick={props.onCommentClose}>건너뛰기</SecondaryCTA>
              <PrimaryCTA
                onClick={props.onCommentSubmit}
                disabled={Boolean(props.commentDialog.validationMessage)}
              >
                제출
              </PrimaryCTA>
            </div>
          </section>
        </div>
      )}
    </AnswerCheckFrame>
  );
}

function AnswerCheckFrame({ onBack, children }: { readonly onBack: () => void; readonly children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 pb-6">
      <div className="sticky top-0 z-20 -mx-[var(--qling-space-shell-x)] bg-white/95 px-[var(--qling-space-shell-x)] py-3 backdrop-blur-md">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
          <button
            type="button"
            onClick={onBack}
            aria-label="나의 고민으로 돌아가기"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--qling-color-text)] hover:bg-[var(--qling-color-cream-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--qling-color-primary-orange)]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="text-center text-lg font-extrabold text-[var(--qling-color-text)]">답변 확인</h1>
        </div>
      </div>
      {children}
    </div>
  );
}

function AnswerCard({
  reply,
  onLike,
  onDislike,
  onOpenComment,
}: {
  readonly reply: AnswerCheckReplyProps;
  readonly onLike: (replyId: string) => void;
  readonly onDislike: (replyId: string) => void;
  readonly onOpenComment: (replyId: string) => void;
}) {
  const liked = reply.feedbackState === 'liked';
  const disliked = reply.feedbackState === 'disliked';
  return (
    <QlingCard className={cn('space-y-4', liked && 'border-[var(--qling-color-primary-orange)]')}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold text-[var(--qling-color-primary-orange)]">도착한 답변</p>
        {reply.createdAtLabel && <span className="text-xs font-semibold text-[var(--qling-color-muted)]">{reply.createdAtLabel}</span>}
      </div>
      <p className="whitespace-pre-wrap break-words text-base font-semibold leading-8 text-[var(--qling-color-text)]">
        {reply.bodyText}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <FeedbackAction
          label="좋아요"
          selected={liked}
          disabled={!reply.canLike || reply.isFeedbackProcessing}
          onClick={() => onLike(reply.replyId)}
        >
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        </FeedbackAction>
        <FeedbackAction
          label="싫어요"
          selected={disliked}
          disabled={!reply.canDislike || reply.isFeedbackProcessing}
          onClick={() => onDislike(reply.replyId)}
        >
          <ThumbsDown className="h-4 w-4" aria-hidden="true" />
        </FeedbackAction>
        <FeedbackAction
          label="코멘트"
          selected={false}
          disabled={!reply.canComment || reply.isCommentProcessing}
          onClick={() => onOpenComment(reply.replyId)}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </FeedbackAction>
      </div>
    </QlingCard>
  );
}

function FeedbackAction({
  label,
  selected,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-11 items-center justify-center gap-1 rounded-[var(--qling-radius-cta)] border px-2 text-xs font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-[var(--qling-color-primary-orange)] bg-[var(--qling-color-cream-soft)] text-[var(--qling-color-primary-orange)]'
          : 'border-[var(--qling-color-border)] bg-white text-[var(--qling-color-text)]',
      )}
    >
      {children}
      {label}
    </button>
  );
}
