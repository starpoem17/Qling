import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ErrorState, FigmaTopBar } from '../shared/ui';
import type { AnswerCheckReplyProps, AnswerCheckScreenProps } from './contract';

const activeIndicatorUrl = new URL('../../../assets/loading/figma-progress-active.svg', import.meta.url).href;
const trackUrl = new URL('../../../assets/loading/figma-progress-track.svg', import.meta.url).href;
const goodIconUrl = new URL('../../../assets/my_concerns/good.svg', import.meta.url).href;
const goodActiveIconUrl = new URL('../../../assets/my_concerns/good_activate.svg', import.meta.url).href;
const badIconUrl = new URL('../../../assets/my_concerns/bad.svg', import.meta.url).href;
const badActiveIconUrl = new URL('../../../assets/my_concerns/bad_activate.svg', import.meta.url).href;

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
          summaryText={props.worry.summaryText}
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
            onOpenOneLineReply={props.onOpenOneLineReply}
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
    <section className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#fff1d1] text-[#2a2a2a]">
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
        <div
          className="relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#fff1d1] qling-received-worries-font"
          style={{ transform: `scale(${canvasScale})` }}
        >
          <FigmaTopBar title="답변 확인" onBack={onBack} backLabel="나의 고민으로 돌아가기" />
          <div
            className="absolute left-0 top-[127px] h-[725px] w-full overflow-y-auto overscroll-contain px-4 pb-[108px] [-webkit-overflow-scrolling:touch]"
            aria-label="답변 확인 내용"
          >
            <div className="grid gap-[22px]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorryCard({
  categoryLabel,
  createdAtLabel,
  summaryText,
  bodyText,
}: {
  readonly categoryLabel: string;
  readonly createdAtLabel: string;
  readonly summaryText: string;
  readonly bodyText: string;
}) {
  return (
    <section className="overflow-hidden rounded-[18px] bg-white px-[19px] pb-[24px] pt-[11px] shadow-[0_4px_4px_rgb(0_0_0/0.25)]">
      <div className="flex min-w-0 items-start gap-[18px]">
        <span className="inline-flex shrink-0 items-start overflow-hidden rounded-[999px] bg-[#ffe4cc] px-3 py-[5px] font-['Qling_Figma_Inter'] text-[11px] font-bold leading-normal text-[#ff8b3d]">
          {categoryLabel}
        </span>
        <time className="pt-[6px] text-[12px] font-semibold leading-none tracking-[-0.36px] text-[#b8b8b8]">
          {createdAtLabel}
        </time>
      </div>
      <p className="mt-[14px] whitespace-pre-wrap break-words text-[16px] font-extrabold leading-6 tracking-[-0.48px] text-[#2a2a2a]">
        {summaryText}
      </p>
      <div className="mt-[10px] h-[0.7px] rounded-[3px] bg-[#c2c4c8]" />
      <p className="mt-[13px] whitespace-pre-wrap break-words text-[12px] font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a]">
        {bodyText}
      </p>
    </section>
  );
}

function AnswerCard({
  reply,
  commentDialog,
  onLike,
  onDislike,
  onOpenOneLineReply,
  onCommentChange,
  onCommentSubmit,
  onCommentClose,
}: {
  readonly reply: AnswerCheckReplyProps;
  readonly commentDialog: AnswerCheckScreenProps['commentDialog'];
  readonly onLike: (replyId: string) => void;
  readonly onDislike: (replyId: string) => void;
  readonly onOpenOneLineReply: (replyId: string) => void;
  readonly onCommentChange: (value: string) => void;
  readonly onCommentSubmit: () => void;
  readonly onCommentClose: () => void;
}) {
  const liked = reply.feedbackState === 'liked';
  const disliked = reply.feedbackState === 'disliked';
  const hasComment = typeof reply.publisherComment === 'string' && reply.publisherComment.trim().length > 0;
  const showAfterLikeActions = liked && !hasComment && !commentDialog;
  const showDivider = showAfterLikeActions || hasComment || commentDialog;

  return (
    <section className={cn(
      'overflow-hidden rounded-[18px] bg-white px-[19px] pt-[17px] shadow-[0_4px_4px_rgb(0_0_0/0.25)]',
      showAfterLikeActions ? 'pb-0' : 'pb-[20px]',
    )}>
      {reply.createdAtLabel && (
        <time className="block text-[12px] font-semibold leading-none tracking-[-0.36px] text-[#b8b8b8]">
          {reply.createdAtLabel}
        </time>
      )}
      <p className="mt-[15px] whitespace-pre-wrap break-words text-[12px] font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a]">
        {reply.bodyText}
      </p>
      <div className="mt-[12px] flex items-center justify-end gap-3">
        <FeedbackAction
          label="좋아요"
          iconUrl={goodIconUrl}
          activeIconUrl={goodActiveIconUrl}
          selected={liked}
          disabled={!reply.canLike || reply.isFeedbackProcessing}
          onClick={() => onLike(reply.replyId)}
          className="h-5 w-5"
          iconClassName="h-5 w-5"
        />
        <FeedbackAction
          label="싫어요"
          iconUrl={badIconUrl}
          activeIconUrl={badActiveIconUrl}
          selected={disliked}
          disabled={!reply.canDislike || reply.isFeedbackProcessing}
          onClick={() => onDislike(reply.replyId)}
          className="h-5 w-5"
          iconClassName="h-5 w-5"
        />
      </div>
      {showDivider && <div className="mt-[10px] h-[0.7px] rounded-[3px] bg-[#c2c4c8]" />}
      {showAfterLikeActions && (
        <div className="relative -mx-[19px] mt-0 grid h-[50px] grid-cols-2 overflow-hidden rounded-b-[18px] bg-gradient-to-b from-white via-[#f7e9cb]/20 to-white text-[12px] font-bold leading-6 tracking-[-0.36px] text-black">
          <button
            type="button"
            onClick={() => undefined}
            className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#ff8b3d]"
          >
            채팅 시작
          </button>
          <div className="absolute left-1/2 top-[3px] h-[45px] w-px -translate-x-1/2 rounded-[3px] bg-[#c2c4c8]" aria-hidden="true" />
          <button
            type="button"
            disabled={!reply.canOneLineReply || reply.isCommentProcessing}
            onClick={() => onOpenOneLineReply(reply.replyId)}
            className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#ff8b3d] disabled:cursor-not-allowed disabled:opacity-45"
          >
            한 줄 답변
          </button>
        </div>
      )}
      {hasComment && (
        <p className="mt-[12px] whitespace-pre-wrap break-words text-[12px] font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a]">
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
  activeIconUrl,
  selected,
  disabled,
  onClick,
  className,
  iconClassName,
}: {
  readonly label: string;
  readonly iconUrl: string;
  readonly activeIconUrl: string;
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
        'inline-flex items-center justify-center rounded-full transition-colors hover:bg-[#fff1d1] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] disabled:cursor-not-allowed',
        className,
      )}
    >
      <img
        src={selected ? activeIconUrl : iconUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={cn('object-contain', iconClassName)}
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
  const label = feedbackState === 'liked' ? '한 줄 답변 입력' : '싫어요 코멘트 입력';

  return (
    <div className="mt-[12px]" aria-label={label}>
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
        placeholder="My example comment."
        className="min-h-[48px] w-full resize-none rounded-[8px] border border-[#c2c4c8] bg-white px-3 py-2 text-[12px] font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a] outline-none placeholder:text-[#b8b8b8] focus:border-[#ff8b3d] focus:ring-2 focus:ring-[#ff8b3d]/20"
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
          취소
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
