import { Heart, MessageSquare } from 'lucide-react';
import type { CSSProperties, ReactNode, TouchEvent, WheelEvent } from 'react';
import { EmptyState, ErrorState, SuccessBadge } from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import { PeekHeaderScrollArea } from '../shared/PeekHeaderScrollArea';
import { useScrollPeekHeader } from '../shared/scrollPeekHeader';
import type { MyAnswersScreenProps } from './contract';

export function MyAnswersScreen(props: MyAnswersScreenProps) {
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';
  const screenClassName = '-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d] qling-figma-font text-[#1a1a1e]';
  const scrollPeekHeader = useScrollPeekHeader();
  const headerStyle = {
    '--qling-peek-progress': scrollPeekHeader.isHeaderCollapsed ? '1' : '0',
  } as CSSProperties;
  const contentStyle = {
    '--qling-peek-progress': scrollPeekHeader.isHeaderCollapsed ? '1' : '0',
    transform: 'translateY(calc(var(--qling-peek-progress, 0) * -88px))',
  } as CSSProperties;

  return (
    <section className={screenClassName}>
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
        <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
          <MyAnswersHeader onBack={props.onBack} style={headerStyle} />

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
            >
              <MyAnswersStateCard>
                <EmptyState title="아직 내가 보낸 위로가 없어요." message={props.state.message} />
              </MyAnswersStateCard>
            </section>
          ) : (
            <PeekHeaderScrollArea
              className="relative h-[836px] px-4 pb-[calc(108px+env(safe-area-inset-bottom,0px))] pt-[27px] transform-gpu"
              style={contentStyle}
              ariaLabel="내가 쓴 답변 목록"
              resetKey="my-answers-ready"
            >
              <div className="grid gap-[19px]">
                {props.items.map(reply => <MyAnswerCard key={reply.replyId} reply={reply} />)}
              </div>
            </PeekHeaderScrollArea>
          )}
        </div>
      </div>
    </section>
  );
}

function MyAnswersHeader({
  onBack,
  style,
}: {
  readonly onBack: () => void;
  readonly style: CSSProperties;
}) {
  return (
    <header
      className="h-[100px] touch-none overscroll-none overflow-hidden bg-[#ff8b3d]"
      style={style}
      onTouchMove={blockLockedScroll}
      onWheel={blockLockedScroll}
    >
      <div
        className="relative mx-auto h-[100px] w-full max-w-[393px] transform-gpu"
        data-qling-peek-header-content="true"
        style={{ transform: 'translateY(calc(var(--qling-peek-progress, 0) * -88px))' }}
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

function MyAnswerCard({ reply }: { readonly reply: MyAnswersScreenProps['items'][number] }) {
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
          onClick={() => undefined}
          className="mt-[15px] flex h-[35px] w-full items-center justify-center gap-[9px] rounded-[12px] bg-[#34c759] text-[15px] font-bold leading-none tracking-[-0.01em] text-white transition-colors hover:bg-[#2fbd52] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#34c759]"
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
