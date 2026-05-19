import { ArrowLeft, Pencil, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { WriteWorryScreenProps } from './contract';

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
  const checkingMessage = props.draft.moderation.status === 'checking'
    ? 'AI 안심 필터가 내용을 확인하고 있습니다.'
    : undefined;
  const popupMessage = validationMessage ?? moderationMessage ?? checkingMessage;
  const showVisualPlaceholder = props.draft.value.trim().length === 0;

  return (
    <div className="relative -mx-[var(--qling-space-shell-x)] -mt-6 h-[755px] bg-[#fff1d1]">
      <header>
        <button
          type="button"
          onClick={props.onBack}
          className="absolute left-[5px] top-[50px] inline-flex h-12 w-12 items-center justify-center rounded-full text-[#2a2a2a] transition-colors hover:bg-[#fff5eb]/60 focus:outline-none focus:ring-2 focus:ring-[#ff8b3d]"
          aria-label="나의 고민으로 돌아가기"
        >
          <ArrowLeft className="h-7 w-7" aria-hidden="true" />
        </button>
        <h1 className="absolute left-1/2 top-[69px] -translate-x-1/2 text-[17px] font-extrabold leading-[21px] tracking-[-0.02em] text-[#2a2a2a]">
          고민 작성
        </h1>
      </header>

      <section className="absolute left-5 top-[120px] h-[541px] w-[353px] rounded-[18px] border-[1.5px] border-[#ff8b3d] bg-[#fff5eb]">
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
              'box-border h-full w-full resize-none rounded-[18px] border-0 bg-transparent px-6 pb-12 pt-[22px] text-base font-medium leading-6 tracking-[-0.04em] text-[#2a2a2a] outline-none disabled:cursor-not-allowed disabled:opacity-60',
              validationMessage && 'ring-2 ring-[var(--qling-color-danger)]',
            )}
          />
          {showVisualPlaceholder && (
            <div
              className="pointer-events-none absolute left-6 top-[22px] flex items-center gap-2 text-[#b8b8b8]"
              data-testid="write-worry-visual-placeholder"
              aria-hidden="true"
            >
              <Pencil className="h-5 w-5" data-testid="write-worry-pencil" aria-hidden="true" />
              <span className="text-base font-medium leading-6 tracking-[-0.04em]">당신의 솔직한 이야기를 들려주세요</span>
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
        className="absolute left-[63px] top-[684px] inline-flex h-12 w-[267px] items-center justify-center gap-2 rounded-full bg-[#ff8b3d] px-[22px] text-base font-extrabold text-[#fff5eb] transition-colors hover:bg-[var(--qling-color-secondary-orange)] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <Send className="h-5 w-5" aria-hidden="true" />
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
  );
}
