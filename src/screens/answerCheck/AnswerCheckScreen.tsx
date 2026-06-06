import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ChatStartConfirmationPopup } from '../shared/ChatStartConfirmationPopup';
import { ErrorState, FigmaCanvasFrame, FigmaTopBar } from '../shared/ui';
import type { AnswerCheckReplyProps, AnswerCheckScreenProps } from './contract';

const activeIndicatorUrl = new URL('../../../assets/loading/figma-progress-active.svg', import.meta.url).href;
const trackUrl = new URL('../../../assets/loading/figma-progress-track.svg', import.meta.url).href;
const goodIconUrl = new URL('../../../assets/my_concerns/good.svg', import.meta.url).href;
const goodActiveIconUrl = new URL('../../../assets/my_concerns/good_activate.svg', import.meta.url).href;
const badIconUrl = new URL('../../../assets/my_concerns/bad.svg', import.meta.url).href;
const badActiveIconUrl = new URL('../../../assets/my_concerns/bad_activate.svg', import.meta.url).href;
const answerCheckViewportHeight = 'calc(var(--qling-visual-viewport-height) - var(--qling-space-nav-height))';
const pwaTopBarShift = 'var(--qling-pwa-topbar-shift, 0px)';
const shiftedTopBarTop = (top: number) => `calc(${top}px + ${pwaTopBarShift})`;
const answerCheckContentTop = shiftedTopBarTop(100);
const answerCheckContentHeight = `min(752px, max(320px, calc(${answerCheckViewportHeight} - ${answerCheckContentTop})))`;

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
    <AnswerCheckFrame
      onBack={props.onBack}
      overlay={props.chatStartConfirmationOpen ? (
        <ChatStartConfirmationPopup
          idPrefix="answer-check-chat-start-confirmation"
          onCancel={props.onCancelChatStartConfirmation}
          onConfirm={props.onConfirmChatStartConfirmation}
          isProcessing={Boolean(props.chatCreationReplyId)}
        />
      ) : null}
    >
      {props.worry && (
        <WorryCard
          categoryLabel={props.worry.categoryLabel}
          createdAtLabel={props.worry.createdAtLabel}
          summaryText={props.worry.summaryText}
          bodyText={props.worry.bodyText}
        />
      )}

      <div className="grid gap-[22px]" aria-label="도착한 답변 목록">
        {props.replies.length > 0 ? (
          props.replies.map(reply => (
            <AnswerCard
              key={reply.replyId}
              reply={reply}
              commentDialog={props.commentDialog?.replyId === reply.replyId ? props.commentDialog : null}
              chatCreationReplyId={props.chatCreationReplyId}
              onLike={props.onLike}
              onDislike={props.onDislike}
              onOpenLikeRequiredPopup={props.onOpenLikeRequiredPopup}
              onOpenOneLineReply={props.onOpenOneLineReply}
              onCommentChange={props.onCommentChange}
              onCommentSubmit={props.onCommentSubmit}
              onCommentClose={props.onCommentClose}
              onOpenChatStartConfirmation={props.onOpenChatStartConfirmation}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-[#b8b8b8]">
            <span className="text-[14px] font-bold">아직 도착한 답변이 없어요!</span>
            <span className="text-[12px] font-semibold mt-2">조금만 더 기다려주세요.</span>
          </div>
        )}
      </div>

      {props.likeRequiredPopupOpen && (
        <LikeRequiredPopup onClose={props.onCloseLikeRequiredPopup} />
      )}
    </AnswerCheckFrame>
  );
}

function AnswerCheckLoadingScreen({ label, onBack }: { readonly label: string; readonly onBack: () => void }) {
  return (
    <section className="-mx-[var(--qling-space-shell-x)] h-[var(--qling-tab-viewport-height)] overflow-hidden bg-[#fff1d1] text-[#2a2a2a]">
      <FigmaCanvasFrame className="max-w-[480px]">
        <div className="relative h-[852px] w-full max-w-[480px] shrink-0 overflow-hidden bg-[#fff1d1]">
          <FigmaTopBar title="답변 확인" onBack={onBack} backLabel="나의 고민으로 돌아가기" />
          <span
            role="status"
            aria-live="polite"
            className="absolute left-1/2 top-[406px] h-10 w-10 -translate-x-1/2"
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
      </FigmaCanvasFrame>
    </section>
  );
}

function AnswerCheckFrame({
  onBack,
  children,
  overlay = null,
}: {
  readonly onBack: () => void;
  readonly children: ReactNode;
  readonly overlay?: ReactNode;
}) {
  return (
    <section className="-mx-[var(--qling-space-shell-x)] h-[var(--qling-tab-viewport-height)] overflow-hidden bg-[#fff1d1] text-[#2a2a2a]">
      <FigmaCanvasFrame className="max-w-[480px]">
        <div className="relative h-[852px] w-full max-w-[480px] shrink-0 overflow-hidden bg-[#fff1d1] qling-received-worries-font">
          <FigmaTopBar title="답변 확인" onBack={onBack} backLabel="나의 고민으로 돌아가기" />
          <div
            className="absolute left-0 w-full overflow-y-auto overscroll-contain px-4 pb-[108px] [-webkit-overflow-scrolling:touch]"
            style={{ top: answerCheckContentTop, height: answerCheckContentHeight }}
            aria-label="답변 확인 내용"
          >
            <div className="grid gap-[22px]">
              {children}
            </div>
          </div>
          {overlay}
        </div>
      </FigmaCanvasFrame>
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
  chatCreationReplyId,
  onLike,
  onDislike,
  onOpenLikeRequiredPopup,
  onOpenOneLineReply,
  onCommentChange,
  onCommentSubmit,
  onCommentClose,
  onOpenChatStartConfirmation,
}: {
  readonly reply: AnswerCheckReplyProps;
  readonly commentDialog: AnswerCheckScreenProps['commentDialog'];
  readonly chatCreationReplyId?: string | null;
  readonly onLike: (replyId: string) => void;
  readonly onDislike: (replyId: string) => void;
  readonly onOpenLikeRequiredPopup: () => void;
  readonly onOpenOneLineReply: (replyId: string) => void;
  readonly onCommentChange: (value: string) => void;
  readonly onCommentSubmit: () => void;
  readonly onCommentClose: () => void;
  readonly onOpenChatStartConfirmation: (replyId: string) => void;
}) {
  const liked = reply.feedbackState === 'liked';
  const disliked = reply.feedbackState === 'disliked';
  const awaitingLike = reply.feedbackState === 'none';
  const hasComment = typeof reply.publisherComment === 'string' && reply.publisherComment.trim().length > 0;
  const showReplyActions = (liked || awaitingLike) && !hasComment && !commentDialog;
  const replyActionsEnabled = liked;
  const showDivider = showReplyActions || hasComment || commentDialog;
  const isChatCreationInProgress = Boolean(chatCreationReplyId);
  const isChatStarting = chatCreationReplyId === reply.replyId;

  return (
    <section className={cn(
      'overflow-hidden rounded-[18px] bg-white px-[19px] pt-[17px] shadow-[0_4px_4px_rgb(0_0_0/0.25)]',
      showReplyActions ? 'pb-0' : 'pb-[20px]',
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
          iconClassName="h-5 w-5 translate-y-px"
        />
      </div>
      {showDivider && <div className="mt-[10px] h-[0.7px] rounded-[3px] bg-[#c2c4c8]" />}
      {showReplyActions && (
        <div className={cn(
          'relative -mx-[19px] mt-0 grid h-[50px] grid-cols-2 overflow-hidden rounded-b-[18px] bg-gradient-to-b from-white via-[#f7e9cb]/20 to-white text-[12px] font-bold leading-6 tracking-[-0.36px]',
          replyActionsEnabled ? 'text-black' : 'text-[#c4b9a1]',
        )}>
          <button
            type="button"
            aria-disabled={!replyActionsEnabled}
            aria-busy={isChatStarting || undefined}
            disabled={isChatCreationInProgress}
            onClick={() => {
              if (!replyActionsEnabled) {
                onOpenLikeRequiredPopup();
                return;
              }
              onOpenChatStartConfirmation(reply.replyId);
            }}
            className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#ff8b3d]"
          >
            채팅 시작
          </button>
          <div className="absolute left-1/2 top-[3px] h-[45px] w-px -translate-x-1/2 rounded-[3px] bg-[#c2c4c8]" aria-hidden="true" />
          <button
            type="button"
            aria-disabled={!replyActionsEnabled || !reply.canOneLineReply || reply.isCommentProcessing}
            onClick={() => {
              if (!replyActionsEnabled) {
                onOpenLikeRequiredPopup();
                return;
              }
              if (!reply.canOneLineReply || reply.isCommentProcessing) return;
              onOpenOneLineReply(reply.replyId);
            }}
            className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#ff8b3d]"
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
        placeholder="한 줄 답변을 남겨주세요"
        className="min-h-[48px] w-full resize-none rounded-[8px] border border-[#c2c4c8] bg-white px-3 py-2 text-[12px] font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a] outline-none placeholder:text-[#b8b8b8] focus:border-[#ff8b3d] focus:ring-2 focus:ring-[#ff8b3d]/20"
      />
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

function LikeRequiredPopup({ onClose }: { readonly onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/32 px-[42px] pt-[251px]" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="answer-check-like-required-title"
        aria-describedby="answer-check-like-required-description"
        className="h-[288px] w-[310px] rounded-[24px] bg-white px-[24px] pb-[35px] pt-[30px] text-center shadow-[0_12px_20px_rgb(0_0_0/0.18)]"
      >
        <span className="relative mx-auto block h-[44px] w-[44px]" aria-hidden="true">
          <span className="absolute left-[13px] top-[5px] h-[18px] w-[18px] rounded-full bg-[#5cc15a]" />
          <span className="absolute left-[21px] top-[13px] h-[18px] w-[18px] rounded-full bg-[#5cc15a]" />
          <span className="absolute left-[13px] top-[21px] h-[18px] w-[18px] rounded-full bg-[#5cc15a]" />
          <span className="absolute left-[5px] top-[13px] h-[18px] w-[18px] rounded-full bg-[#5cc15a]" />
          <span className="absolute left-[21px] top-[37px] h-2 w-0.5 rounded-[1px] bg-[#5cc15a]" />
        </span>
        <h2
          id="answer-check-like-required-title"
          className="mt-[22px] whitespace-nowrap text-[19px] font-bold leading-normal tracking-[-0.38px] text-[#1a1a1e]"
        >
          먼저 좋아요를 눌러주세요!
        </h2>
        <p
          id="answer-check-like-required-description"
          className="mt-[19px] whitespace-pre-line text-[14px] font-bold leading-[21px] tracking-[-0.14px] text-[#6e7076]"
        >
          {'좋아요를 누른 답변에 한해\n채팅과 한 줄 답변을 남길 수 있어요'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-[29px] flex h-[52px] w-full items-center justify-center rounded-[12px] bg-[#ff8b3d] text-[15px] font-bold leading-normal tracking-[-0.15px] text-white focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2"
        >
          확인
        </button>
      </section>
    </div>
  );
}
