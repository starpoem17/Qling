import { Heart, MessageSquare } from 'lucide-react';
import { useState, type ReactNode, type TouchEvent, type WheelEvent } from 'react';
import { ErrorState, FigmaCanvasFrame, SuccessBadge } from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import { ChatStartConfirmationPopup } from '../shared/ChatStartConfirmationPopup';
import type { MyAnswersScreenProps } from './contract';

export function MyAnswersScreen(props: MyAnswersScreenProps) {
  const [chatStartTarget, setChatStartTarget] = useState<MyAnswersScreenProps['items'][number] | null>(null);

  return (
    <MyAnswersScreenView
      {...props}
      chatStartTarget={chatStartTarget}
      onOpenChatStartConfirmation={setChatStartTarget}
      onCancelChatStartConfirmation={() => setChatStartTarget(null)}
      onConfirmChatStartConfirmation={() => {
        if (!chatStartTarget || props.chatCreationReplyId) return;
        const target = chatStartTarget;
        setChatStartTarget(null);
        props.onStartChat(target);
      }}
    />
  );
}

export function MyAnswersScreenView(props: MyAnswersScreenProps & {
  readonly chatStartTarget: MyAnswersScreenProps['items'][number] | null;
  readonly onOpenChatStartConfirmation: (item: MyAnswersScreenProps['items'][number]) => void;
  readonly onCancelChatStartConfirmation: () => void;
  readonly onConfirmChatStartConfirmation: () => void;
}) {
  const tabViewportHeight = 'calc(var(--qling-visual-viewport-height) - var(--qling-space-nav-height))';
  const directTopbarShift = 'var(--qling-pwa-direct-topbar-shift)';
  const contentViewportHeight = `min(752px, max(320px, calc(${tabViewportHeight} - 100px - ${directTopbarShift})))`;
  const screenClassName = '-mx-[var(--qling-space-shell-x)] h-[var(--qling-tab-viewport-height)] overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-[852px] w-full max-w-[480px] shrink-0 overflow-hidden bg-[#ff8b3d] qling-figma-font text-[#1a1a1e]';

  return (
    <section className={screenClassName}>
      <FigmaCanvasFrame className="max-w-[480px]">
        <div className={canvasClassName}>
          <MyAnswersHeader onBack={props.onBack} />

          {props.state.status === 'loading' ? (
            <section
              className="relative h-[752px] touch-none overscroll-none overflow-hidden px-4 pt-[27px]"
              style={{ height: contentViewportHeight }}
              onWheel={blockLockedScroll}
              onTouchMove={blockLockedScroll}
            >
              <FigmaTabLoading label={props.state.label} />
            </section>
          ) : props.state.status === 'error' ? (
            <section
              className="relative h-[752px] touch-none overscroll-none overflow-hidden px-4 pt-[27px]"
              style={{ height: contentViewportHeight }}
              onWheel={blockLockedScroll}
              onTouchMove={blockLockedScroll}
            >
              <MyAnswersStateCard>
                <ErrorState title="내가 쓴 답변을 불러오지 못했어요." message={props.state.message} />
              </MyAnswersStateCard>
            </section>
          ) : props.state.status === 'empty' ? (
            <section
              className="relative h-[752px] touch-none overscroll-none overflow-hidden px-4 pt-[27px]"
              style={{ height: contentViewportHeight }}
              onWheel={blockLockedScroll}
              onTouchMove={blockLockedScroll}
            />
          ) : (
            <section
              className="relative h-[752px] overflow-y-auto overscroll-contain px-4 pb-[calc(108px+env(safe-area-inset-bottom,0px))] pt-[27px] [-webkit-overflow-scrolling:touch]"
              style={{ height: contentViewportHeight }}
              aria-label="내가 쓴 답변 목록"
            >
              <div className="grid gap-[19px]">
                {props.items.map(reply => (
                  <MyAnswerCard
                    key={reply.replyId}
                    reply={reply}
                    chatCreationReplyId={props.chatCreationReplyId}
                    onStartChatConfirm={props.onOpenChatStartConfirmation}
                  />
                ))}
              </div>
            </section>
          )}
          {props.chatStartTarget && (
            <ChatStartConfirmationPopup
              onCancel={props.onCancelChatStartConfirmation}
              onConfirm={props.onConfirmChatStartConfirmation}
              isProcessing={props.chatCreationReplyId === props.chatStartTarget.replyId}
            />
          )}
        </div>
      </FigmaCanvasFrame>
    </section>
  );
}

function MyAnswersHeader({
  onBack,
}: {
  readonly onBack: () => void;
}) {
  return (
    <header
      className="h-[calc(100px+var(--qling-pwa-direct-topbar-shift))] touch-none overscroll-none overflow-hidden bg-[#ff8b3d]"
      onTouchMove={blockLockedScroll}
      onWheel={blockLockedScroll}
    >
      <div
        className="relative mx-auto h-[calc(100px+var(--qling-pwa-direct-topbar-shift))] w-full max-w-[480px]"
      >
        <button
          type="button"
          aria-label="마이페이지로 돌아가기"
          onClick={onBack}
          className="absolute left-[6px] top-[calc(45px+var(--qling-pwa-direct-topbar-shift))] flex h-[45px] w-[44px] items-center justify-center text-[32px] font-semibold leading-none text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <h1 className="absolute left-0 top-[calc(60px+var(--qling-pwa-direct-topbar-shift))] w-full text-center text-[17px] font-extrabold leading-none tracking-[-0.02em] text-white">
          내가 쓴 답변
        </h1>
      </div>
    </header>
  );
}

function MyAnswersStateCard({ children }: { readonly children: ReactNode }) {
  return (
    <div className="rounded-[18px] bg-white px-[18px] py-8 shadow-[0_4px_4px_rgb(0_0_0/0.25)]">
      {children}
    </div>
  );
}

function MyAnswerCard({
  reply,
  chatCreationReplyId,
  onStartChatConfirm,
}: {
  readonly reply: MyAnswersScreenProps['items'][number];
  readonly chatCreationReplyId?: string | null;
  readonly onStartChatConfirm: (item: MyAnswersScreenProps['items'][number]) => void;
}) {
  const hasComment = Boolean(reply.feedbackComment);
  const isChatCreationInProgress = Boolean(chatCreationReplyId);
  const isChatStarting = chatCreationReplyId === reply.replyId;

  return (
    <article
      aria-label={reply.accessibilityLabel}
      className="relative block w-full rounded-[18px] bg-white px-[18px] pb-[19px] pt-[11px] text-left shadow-[0_4px_4px_rgb(0_0_0/0.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {reply.categoryLabel && (
            <span className="inline-flex shrink-0 rounded-full bg-[#ffe4cc] px-3 py-[5px] text-[11px] font-bold leading-normal text-[#ff8b3d]">
              {reply.categoryLabel}
            </span>
          )}
          {reply.dateLabel && <span className="text-[12px] font-semibold leading-[23px] text-[#b8b8b8]">{reply.dateLabel}</span>}
          {reply.isUnread && <SuccessBadge label="새 반응" />}
        </div>
        {reply.hasReceivedHeart && <Heart className="mt-0.5 h-5 w-5 shrink-0 fill-[#e94335] text-[#e94335]" aria-hidden="true" />}
      </div>
      <p className="mt-[21px] whitespace-pre-wrap break-words text-[16px] font-extrabold leading-6 tracking-[-0.03em] text-[#2a2a2a]">
        {reply.originalWorryPreview}
      </p>
      <p className="mt-[14px] whitespace-pre-wrap break-words border-t border-[#c2c4c8] pt-[13px] text-[13px] font-semibold leading-[1.45] tracking-[-0.04em] text-[#1a1a1e]">
        {reply.previewText}
      </p>
      {reply.feedbackComment && (
        <p className="mt-3 whitespace-pre-wrap break-words border-t border-[#c2c4c8] pt-[9px] text-[13px] font-semibold leading-[1.45] tracking-[-0.04em] text-[#1a1a1e]">
          {reply.feedbackComment}
        </p>
      )}
      {hasComment && (
        <button
          type="button"
          aria-label="익명 채팅 시작하기"
          aria-busy={isChatStarting || undefined}
          disabled={isChatCreationInProgress}
          onClick={() => onStartChatConfirm(reply)}
          className="mt-[15px] flex h-[35px] w-full items-center justify-center gap-[9px] rounded-[12px] bg-[#34c759] text-[15px] font-bold leading-none tracking-[-0.01em] text-white transition-colors hover:bg-[#2fbd52] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#34c759] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <MessageSquare className="h-5 w-5 fill-white text-white" aria-hidden="true" />
          <span>익명 채팅 시작하기</span>
        </button>
      )}
    </article>
  );
}

function blockLockedScroll(event: WheelEvent<HTMLElement> | TouchEvent<HTMLElement>) {
  const { preventDefault, stopPropagation } = event;
  preventDefault.call(event);
  stopPropagation.call(event);
}
