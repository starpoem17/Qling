import { Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FigmaTopBar } from '../shared/ui';
import type { WriteWorryScreenProps } from './contract';

const writeWorryCanvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';
const sendButtonTop = `min(684px, calc((100dvh - var(--qling-space-nav-height)) / (${writeWorryCanvasScale}) - 88px))`;
const inputAreaHeight = `min(541px, max(240px, calc(${sendButtonTop} - 143px)))`;

export function WriteWorryScreen(props: WriteWorryScreenProps) {
  const isDisabled = Boolean(props.draft.submitDisabledReason);
  const validationMessage = props.draft.validation.status === 'invalid' && props.draft.value !== ''
    ? props.draft.validation.message
    : undefined;
  const moderationMessage = props.draft.moderation.status === 'rejected'
    ? [props.draft.moderation.reason, props.draft.moderation.helpMessage].filter(Boolean).join('\n\n')
    : props.draft.moderation.status === 'failed'
      ? props.draft.moderation.message
      : undefined;
  const popupMessage = validationMessage ?? moderationMessage;
  const showVisualPlaceholder = props.draft.value.trim().length === 0;

  return (
    <section className="h-full min-h-0 overflow-hidden bg-[#fff1d1] text-[#2a2a2a]">
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
        <div
          className="relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#fff1d1]"
          style={{ transform: `scale(${writeWorryCanvasScale})` }}
        >
      {FigmaTopBar({ title: '질문 작성', onBack: props.onBack, backLabel: '나의 고민으로 돌아가기' })}

      <section
        className="absolute left-5 top-[120px] w-[353px] rounded-[18px] border-[1.5px] border-[#ff8b3d] bg-[#fff5eb]"
        style={{ height: inputAreaHeight }}
      >
        <label className="relative block h-full">
          <span className="sr-only">고민 내용</span>
          <textarea
            value={props.draft.value}
            maxLength={props.draft.maxLength}
            disabled={props.draft.isProcessing}
            aria-invalid={Boolean(validationMessage) || undefined}
            aria-describedby="write-worry-counter"
            onChange={event => props.onDraftChange(event.currentTarget.value)}
            className={cn(
              'box-border h-full w-full resize-none rounded-[18px] border-0 bg-transparent pb-12 pl-[16.5px] pr-[11.5px] pt-[17.5px] text-[12px] font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a] outline-none disabled:cursor-not-allowed disabled:opacity-60',
              validationMessage && 'ring-2 ring-[var(--qling-color-danger)]',
            )}
          />
          {showVisualPlaceholder && (
            <div
              className="pointer-events-none absolute left-[22.5px] top-[20.5px] flex items-center text-[#b8b8b8]"
              data-testid="write-worry-visual-placeholder"
              aria-hidden="true"
            >
              <Pencil className="h-5 w-5" data-testid="write-worry-pencil" aria-hidden="true" />
              <span className="ml-2 text-[16px] font-bold leading-6 tracking-[-0.64px]">당신의 솔직한 이야기를 들려주세요</span>
            </div>
          )}
          <div
            id="write-worry-counter"
            className="absolute bottom-[22px] right-[19px] text-[13px] font-bold leading-4 text-[#b8b8b8]"
            data-testid="write-worry-character-count"
          >
            {props.draft.value.length} / {props.draft.maxLength}
          </div>
        </label>
      </section>

      <button
        type="button"
        aria-label="고민 전송"
        aria-busy={props.draft.isProcessing || undefined}
        disabled={isDisabled || props.draft.isProcessing}
        onClick={props.onPublish}
        className="absolute left-1/2 inline-flex h-12 w-[267px] -translate-x-1/2 items-center justify-center rounded-full bg-[#ff8b3d] px-[22px] text-[16px] font-extrabold leading-normal text-[#fff5eb] transition-colors hover:bg-[var(--qling-color-secondary-orange)] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
        style={{ top: sendButtonTop }}
      >
        고민 전송
      </button>

      {popupMessage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4"
          role="presentation"
          data-testid="write-worry-popup"
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="write-worry-popup-title"
            aria-describedby="write-worry-popup-message"
            className="w-full max-w-[320px] rounded-2xl bg-white px-5 pb-5 pt-6 text-center shadow-2xl"
          >
            <h2 id="write-worry-popup-title" className="text-base font-extrabold text-[#2a2a2a]">
              확인이 필요해요
            </h2>
            <p id="write-worry-popup-message" className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#2a2a2a]">
              {popupMessage}
            </p>
            <button
              type="button"
              aria-label="고민 작성 알림 확인"
              onClick={(event) => {
                event.currentTarget.closest('[data-testid="write-worry-popup"]')?.setAttribute('hidden', '');
              }}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#ff8b3d] text-sm font-extrabold text-[#fff5eb] transition-colors hover:bg-[var(--qling-color-secondary-orange)] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2"
            >
              확인
            </button>
          </section>
        </div>
      )}
        </div>
      </div>
    </section>
  );
}
