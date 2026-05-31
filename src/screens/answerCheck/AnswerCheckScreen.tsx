import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ErrorState, FigmaTopBar } from '../shared/ui';
import type { AnswerCheckReplyProps, AnswerCheckScreenProps } from './contract';

const activeIndicatorUrl = new URL('../../../assets/loading/figma-progress-active.svg', import.meta.url).href;
const trackUrl = new URL('../../../assets/loading/figma-progress-track.svg', import.meta.url).href;
const goodIconUrl = new URL('../../../assets/my_concerns/good.svg', import.meta.url).href;
const badIconUrl = new URL('../../../assets/my_concerns/bad.svg', import.meta.url).href;
const commentIconUrl = new URL('../../../assets/my_concerns/comment.svg', import.meta.url).href;

export function AnswerCheckScreen(props: AnswerCheckScreenProps) {
  if (props.state.status === 'loading') {
    return <AnswerCheckLoadingScreen label={props.state.label} onBack={props.onBack} />;
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
        <WorryCard
          categoryLabel={props.worry.categoryLabel}
          createdAtLabel={props.worry.createdAtLabel}
          bodyText={props.worry.bodyText}
        />
      )}

      <div className="grid gap-[22px]" aria-label="도착한 답변 목록">
        {props.replies.map(reply => (
          <AnswerCard
            key={reply.replyId}
            reply={reply}
            commentDialog={props.commentDialog?.replyId === reply.replyId ? props.commentDialog : null}
            onLike={props.onLike}
            onDislike={props.onDislike}
            onOpenComment={props.onOpenComment}
            onCommentChange={props.onCommentChange}
            onCommentSubmit={props.onCommentSubmit}
            onCommentClose={props.onCommentClose}
          />
        ))}
      </div>
    </AnswerCheckFrame>
  );
}

function AnswerCheckLoadingScreen({ label, onBack }: { readonly label: string; readonly onBack: () => void }) {
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';

  return (
    <section className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#fff1d1] text-[#2a2a2a]">
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
        <div
          className="relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#fff1d1]"
          style={{ transform: `scale(${canvasScale})` }}
        >
          <button
            type="button"
            onClick={onBack}
            aria-label="나의 고민으로 돌아가기"
            className="absolute left-[14px] top-[49px] z-20 h-[44px] w-[28px] rounded-full transition-colors hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-[#2a2a2a]"
          >
            <span
              aria-hidden="true"
              className="absolute left-[8px] top-0 font-['Qling_Figma_Inter'] text-[32px] font-semibold leading-[38px] text-black"
            >
              ‹
            </span>
          </button>
          <h1 className="absolute left-0 top-[60px] z-10 w-full whitespace-nowrap text-center font-sans text-[17px] font-extrabold leading-[21px] tracking-[-0.34px] text-[#2a2a2a]">
            답변 확인
          </h1>
          <span
            role="status"
            aria-live="polite"
            className="absolute left-[177px] top-[406px] h-10 w-10"
            data-testid="answer-check-figma-loading-indicator"
          >
            <span className="block h-full w-full animate-spin" aria-hidden="true">
              <span className="absolute flex inset-[52.65%_0.66%_0.02%_63.31%] items-center justify-center">
                <span className="block h-[11.6075px] w-[17.1763px] rotate-[100deg]">
                  <img alt="" className="block h-full w-full" src={activeIndicatorUrl} draggable={false} />
                </span>
              </span>
              <span className="absolute flex inset-[-7.83%_-5.34%_-7.56%_-7.84%] items-center justify-center">
                <span className="block h-[38.9169px] w-[40.0038px] rotate-[100deg]">
                  <img alt="" className="block h-full w-full" src={trackUrl} draggable={false} />
                </span>
              </span>
            </span>
            <span className="sr-only">{label}</span>
          </span>
        </div>
      </div>
    </section>
  );
}

function AnswerCheckFrame({ onBack, children }: { readonly onBack: () => void; readonly children: ReactNode }) {
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';

  return (
    <section className="-mx-[var(--qling-space-shell-x)] -mt-6 min-h-full overflow-x-hidden bg-[#fff1d1] pb-[calc(24px+env(safe-area-inset-bottom,0px))] text-[#2a2a2a]">
      <div className="mx-auto flex w-full max-w-[480px] justify-center overflow-visible">
        <div
          className="relative min-h-[852px] w-[393px] shrink-0 origin-top bg-[#fff1d1] qling-received-worries-font"
          style={{ transform: `scale(${canvasScale})` }}
        >
          <FigmaTopBar title="답변 확인" onBack={onBack} backLabel="나의 고민으로 돌아가기" />
          <div className="grid gap-[22px] px-4 pt-[127px] pb-[36px]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function WorryCard({
  categoryLabel,
  createdAtLabel,
  bodyText,
}: {
  readonly categoryLabel: string;
  readonly createdAtLabel: string;
  readonly bodyText: string;
}) {
  return (
    <section className="rounded-[18px] bg-white px-[19px] pb-[24px] pt-[11px] shadow-[0_4px_4px_rgb(0_0_0/0.25)]">
      <div className="flex items-start gap-[18px]">
        <span className="inline-flex shrink-0 items-start overflow-hidden rounded-[999px] bg-[#ffe4cc] px-3 py-[5px] font-['Qling_Figma_Inter'] text-[11px] font-bold leading-normal text-[#ff8b3d]">
          {categoryLabel}
        </span>
        <time className="pt-[6px] text-[12px] font-semibold leading-none tracking-[-0.36px] text-[#b8b8b8]">
          {createdAtLabel}
        </time>
      </div>
      <p className="mt-[14px] whitespace-pre-wrap break-words text-[16px] font-extrabold leading-6 tracking-[-0.48px] text-[#2a2a2a]">
        {bodyText}
      </p>
      <div className="mt-[10px] h-px rounded-[3px] bg-[#c2c4c8]" />
    </section>
  );
}

function AnswerCard({
  reply,
  commentDialog,
  onLike,
  onDislike,
  onOpenComment,
  onCommentChange,
  onCommentSubmit,
  onCommentClose,
}: {
  readonly reply: AnswerCheckReplyProps;
  readonly commentDialog: AnswerCheckScreenProps['commentDialog'];
  readonly onLike: (replyId: string) => void;
  readonly onDislike: (replyId: string) => void;
  readonly onOpenComment: (replyId: string) => void;
  readonly onCommentChange: (value: string) => void;
  readonly onCommentSubmit: () => void;
  readonly onCommentClose: () => void;
}) {
  const liked = reply.feedbackState === 'liked';
  const disliked = reply.feedbackState === 'disliked';
  const hasComment = typeof reply.publisherComment === 'string' && reply.publisherComment.trim().length > 0;
  const commentActive = hasComment || Boolean(commentDialog);
  return (
    <section className="rounded-[18px] bg-white px-[19px] pb-[20px] pt-[17px] shadow-[0_4px_4px_rgb(0_0_0/0.25)]">
      {reply.createdAtLabel && (
        <time className="block text-[12px] font-semibold leading-none tracking-[-0.36px] text-[#b8b8b8]">
          {reply.createdAtLabel}
        </time>
      )}
      <p className="mt-[15px] whitespace-pre-wrap break-words text-[12px] font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a]">
        {reply.bodyText}
      </p>
      <div className="mt-[5px] flex items-center justify-end gap-[5px]">
        <FeedbackAction
          label="좋아요"
          iconUrl={goodIconUrl}
          selected={liked}
          disabled={!reply.canLike || reply.isFeedbackProcessing}
          onClick={() => onLike(reply.replyId)}
          className="h-[28px] w-[17px]"
          iconClassName="h-[17px] w-[17px]"
        />
        <FeedbackAction
          label="싫어요"
          iconUrl={badIconUrl}
          selected={disliked}
          disabled={!reply.canDislike || reply.isFeedbackProcessing}
          onClick={() => onDislike(reply.replyId)}
          className="h-[28px] w-[17px]"
          iconClassName="h-[17px] w-[17px] rotate-180"
        />
        <FeedbackAction
          label="코멘트"
          iconUrl={commentIconUrl}
          selected={commentActive}
          disabled={!reply.canComment || reply.isCommentProcessing}
          onClick={() => onOpenComment(reply.replyId)}
          className="h-[28px] w-[20px]"
          iconClassName="h-[15px] w-[15px]"
        />
      </div>
      {(hasComment || commentDialog) && <div className="mt-[8px] h-px rounded-[3px] bg-[#c2c4c8]" />}
      {hasComment && (
        <p className="mt-[13px] whitespace-pre-wrap break-words text-[12px] font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a]">
          {reply.publisherComment}
        </p>
      )}
      {commentDialog && (
        <InlineCommentEditor
          draft={commentDialog.draft}
          maxLength={commentDialog.maxLength}
          validationMessage={commentDialog.validationMessage}
          moderationMessage={commentDialog.moderationMessage}
          feedbackState={commentDialog.feedbackState}
          onChange={onCommentChange}
          onSubmit={onCommentSubmit}
          onClose={onCommentClose}
        />
      )}
    </section>
  );
}

function FeedbackAction({
  label,
  iconUrl,
  selected,
  disabled,
  onClick,
  className,
  iconClassName,
}: {
  readonly label: string;
  readonly iconUrl: string;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly className: string;
  readonly iconClassName: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors hover:bg-[#fff1d1] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
    >
      <img
        src={iconUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={cn(
          'object-contain',
          selected && 'filter sepia saturate-[4] hue-rotate-[335deg]',
          iconClassName,
        )}
      />
    </button>
  );
}

function InlineCommentEditor({
  draft,
  maxLength,
  validationMessage,
  moderationMessage,
  feedbackState,
  onChange,
  onSubmit,
  onClose,
}: {
  readonly draft: string;
  readonly maxLength: number;
  readonly validationMessage?: string;
  readonly moderationMessage?: string;
  readonly feedbackState: 'liked' | 'disliked';
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}) {
  const label = feedbackState === 'liked' ? '좋아요 코멘트 입력' : '싫어요 코멘트 입력';

  return (
    <div className="mt-[13px]" aria-label={label}>
      {moderationMessage && (
        <p className="mb-2 whitespace-pre-wrap text-[12px] font-bold leading-[18px] tracking-[-0.36px] text-[var(--qling-color-danger)]">
          {moderationMessage}
        </p>
      )}
      <textarea
        value={draft}
        onChange={event => onChange(event.target.value)}
        maxLength={maxLength}
        aria-label={label}
        placeholder="전하고 싶은 말을 남겨주세요."
        className="min-h-[72px] w-full resize-none rounded-[12px] border border-[#c2c4c8] bg-white px-3 py-2 text-[12px] font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a] outline-none placeholder:text-[#b8b8b8] focus:border-[#ff8b3d] focus:ring-2 focus:ring-[#ff8b3d]/20"
      />
      {validationMessage && (
        <p className="mt-1 text-[11px] font-bold leading-[16px] tracking-[-0.33px] text-[var(--qling-color-danger)]">
          {validationMessage}
        </p>
      )}
      <div className="mt-2 flex justify-end gap-3 text-[12px] font-extrabold leading-5 tracking-[-0.36px]">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-1 text-[#7a7a7a] hover:text-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d]"
        >
          건너뛰기
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={Boolean(validationMessage)}
          className="rounded-full px-1 text-[#ff8b3d] hover:text-[#e56f22] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] disabled:cursor-not-allowed disabled:opacity-45"
        >
          제출
        </button>
      </div>
    </div>
  );
}
