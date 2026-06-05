import { Heart, MessageSquare } from 'lucide-react';
import { useState, type ReactNode, type TouchEvent, type WheelEvent } from 'react';
import { ErrorState, SuccessBadge } from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import type { MyAnswersScreenProps } from './contract';

const chatStartDotUrl = new URL('../../../assets/chat/chat_start_dot.svg', import.meta.url).href;

export function MyAnswersScreen(props: MyAnswersScreenProps) {
  const [chatStartTarget, setChatStartTarget] = useState<MyAnswersScreenProps['items'][number] | null>(null);

  return (
    <MyAnswersScreenView
      {...props}
      chatStartTarget={chatStartTarget}
      onOpenChatStartConfirmation={setChatStartTarget}
      onCancelChatStartConfirmation={() => setChatStartTarget(null)}
      onConfirmChatStartConfirmation={() => {
        if (!chatStartTarget) return;
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
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';
  const screenClassName = '-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d] qling-figma-font text-[#1a1a1e]';

  return (
    <section className={screenClassName}>
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
        <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
          <MyAnswersHeader onBack={props.onBack} />

          {props.state.status === 'loading' ? (
            <section
              className="relative h-[752px] touch-none overscroll-none overflow-hidden px-4 pt-[27px]"
              onWheel={blockLockedScroll}
              onTouchMove={blockLockedScroll}
            >
              <FigmaTabLoading label={props.state.label} />
            </section>
          ) : props.state.status === 'error' ? (
            <section
              className="relative h-[752px] touch-none overscroll-none overflow-hidden px-4 pt-[27px]"
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
              onWheel={blockLockedScroll}
              onTouchMove={blockLockedScroll}
            />
          ) : (
            <section
              className="relative h-[752px] overflow-y-auto overscroll-contain px-4 pb-[calc(108px+env(safe-area-inset-bottom,0px))] pt-[27px] [-webkit-overflow-scrolling:touch]"
              aria-label="내가 쓴 답변 목록"
            >
              <div className="grid gap-[19px]">
                {props.items.map(reply => (
                  <MyAnswerCard
                    key={reply.replyId}
                    reply={reply}
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
            />
          )}
        </div>
      </div>
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
      className="h-[100px] touch-none overscroll-none overflow-hidden bg-[#ff8b3d]"
      onTouchMove={blockLockedScroll}
      onWheel={blockLockedScroll}
    >
      <div
        className="relative mx-auto h-[100px] w-full max-w-[393px]"
      >
        <button
          type="button"
          aria-label="마이페이지로 돌아가기"
          onClick={onBack}
          className="absolute left-[16px] top-[45px] flex h-[45px] w-[24px] items-center justify-center text-[32px] font-semibold leading-none text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <h1 className="absolute left-0 top-[60px] w-full text-center text-[17px] font-extrabold leading-none tracking-[-0.02em] text-white">
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
  onStartChatConfirm,
}: {
  readonly reply: MyAnswersScreenProps['items'][number];
  readonly onStartChatConfirm: (item: MyAnswersScreenProps['items'][number]) => void;
}) {
  const hasComment = Boolean(reply.feedbackComment);

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
          onClick={() => onStartChatConfirm(reply)}
          className="mt-[15px] flex h-[35px] w-full items-center justify-center gap-[9px] rounded-[12px] bg-[#34c759] text-[15px] font-bold leading-none tracking-[-0.01em] text-white transition-colors hover:bg-[#2fbd52] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#34c759]"
        >
          <MessageSquare className="h-5 w-5 fill-white text-white" aria-hidden="true" />
          <span>익명 채팅 시작하기</span>
        </button>
      )}
    </article>
  );
}

function ChatStartConfirmationPopup({
  onCancel,
  onConfirm,
}: {
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  const titleId = 'my-answers-chat-start-confirmation-title';
  const descriptionId = 'my-answers-chat-start-confirmation-description';

  return (
    <>
      <div className="absolute left-[-1px] top-0 z-40 h-[852px] w-[394px] bg-[rgba(40,30,20,0.42)]" aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="absolute left-[42px] top-[251px] z-50 h-[288px] w-[310px] rounded-[24px] bg-white shadow-[0_12px_20px_rgba(0,0,0,0.18)]"
      >
        <img
          src={chatStartDotUrl}
          alt=""
          className="absolute left-[125px] top-[26px] h-[60px] w-[60px]"
          aria-hidden="true"
        />
        <h2
          id={titleId}
          className="absolute left-1/2 top-[119.5px] flex -translate-x-1/2 -translate-y-1/2 flex-col justify-center whitespace-nowrap text-center font-['Qling_Noto_Sans_KR_Black'] text-[19px] font-black leading-normal tracking-[-0.38px] text-[#1a1a1e]"
        >
          채팅을 시작할까요?
        </h2>
        <p
          id={descriptionId}
          className="absolute left-1/2 top-[141px] w-[262px] -translate-x-1/2 text-center font-['Qling_Noto_Sans_KR'] text-[13px] font-normal leading-[19px] text-[#6e6a63]"
        >
          <span className="block">채팅을 시작하면 서로의 닉네임을 볼 수 있고</span>
          <span className="block">상대방에게 채팅 시작 알림이 전송됩니다.</span>
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="absolute left-[30px] top-[201px] h-[52px] w-[120px] rounded-[12px] border border-[#b8b8b8] bg-white text-[15px] font-bold leading-normal tracking-[-0.15px] text-[#b8b8b8] focus:outline-none focus:ring-2 focus:ring-[#b8b8b8] focus:ring-offset-2"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="absolute left-[160px] top-[201px] h-[52px] w-[120px] rounded-[12px] bg-[#ff8b3d] text-[15px] font-bold leading-normal tracking-[-0.15px] text-white focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2"
        >
          확인
        </button>
      </section>
    </>
  );
}

function blockLockedScroll(event: WheelEvent<HTMLElement> | TouchEvent<HTMLElement>) {
  const { preventDefault, stopPropagation } = event;
  preventDefault.call(event);
  stopPropagation.call(event);
}
