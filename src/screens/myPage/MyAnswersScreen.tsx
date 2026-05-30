import { Heart } from 'lucide-react';
import { EmptyState, ErrorState, FigmaTopBar, LoadingState, SuccessBadge } from '../shared/ui';
import type { MyAnswersScreenProps } from './contract';

export function MyAnswersScreen(props: MyAnswersScreenProps) {
  return (
    <div className="relative -mx-[var(--qling-space-shell-x)] -mt-6 min-h-full bg-[#ff8b3d] px-4 pb-8 pt-[127px] text-[#1a1a1a]">
      <FigmaTopBar title="내가 쓴 답변" onBack={props.onBack} backLabel="마이페이지로 돌아가기" tone="light" />

      <div className="space-y-[19px]">
        {props.state.status === 'loading' && <LoadingState title={props.state.label} />}
        {props.state.status === 'error' && <ErrorState title="내가 쓴 답변을 불러오지 못했어요." message={props.state.message} />}
        {props.state.status === 'empty' && (
          <EmptyState title="아직 내가 보낸 위로가 없어요." message={props.state.message} />
        )}
        {props.state.status === 'ready' && props.items.map(reply => (
          <article
            key={reply.replyId}
            aria-label={reply.accessibilityLabel}
            className="block w-full rounded-2xl bg-white px-[18px] pb-[19px] pt-[11px] text-left shadow-[0_4px_4px_rgb(0_0_0/0.25)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-[9px]">
                {reply.categoryLabel && (
                  <span className="rounded-full bg-[#ffe4cc] px-3 py-[5px] text-[11px] font-bold leading-[13px] text-[#ff8b3d]">
                    {reply.categoryLabel}
                  </span>
                )}
                {reply.dateLabel && <span className="text-xs font-semibold leading-[15px] text-[#b8b8b8]">{reply.dateLabel}</span>}
                {reply.isUnread && <SuccessBadge label="새 반응" />}
              </div>
              {reply.hasReceivedHeart && <Heart className="mt-0.5 h-5 w-5 shrink-0 fill-[#e94335] text-[#e94335]" aria-hidden="true" />}
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-[15px] font-extrabold leading-6 text-[#2a2a2a]">
              {reply.originalWorryPreview}
            </p>
            <p className="mt-[14px] whitespace-pre-wrap break-words border-t border-[#d9d9d9] pt-[13px] text-xs font-semibold leading-[19px] text-[#2a2a2a]">
              {reply.previewText}
            </p>
            {reply.feedbackComment && (
              <p className="mt-3 whitespace-pre-wrap break-words border-t border-[#eeeeee] pt-2 text-xs font-semibold leading-5 text-[#77716b]">
                {reply.feedbackComment}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
