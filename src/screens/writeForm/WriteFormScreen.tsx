import { ArrowLeft, ChevronDown, Pencil, Send, Sparkles, X } from 'lucide-react';
import {
  CategoryChip,
  ContentSheet,
  PrimaryCTA,
} from '../shared/ui';
import type { WriteFormScreenProps } from './contract';

export function WriteFormScreen(props: WriteFormScreenProps) {
  const isDisabled = Boolean(props.draft.submitDisabledReason);
  const validationMessage = props.draft.validation.status === 'invalid' && props.draft.value !== ''
    ? props.draft.validation.message
    : undefined;
  const moderationMessage = props.draft.moderation.status === 'rejected'
    ? [props.draft.moderation.reason, props.draft.moderation.helpMessage].filter(Boolean).join('\n\n')
    : props.draft.moderation.status === 'failed'
      ? props.draft.moderation.message
      : undefined;

  return (
    <div className="relative space-y-5 pb-4">
      <div className="relative mb-7 flex min-h-12 items-center justify-center">
        <button
          type="button"
          onClick={props.onBack}
          aria-label="답변하기로 돌아가기"
          className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[var(--qling-color-text)] transition-colors hover:bg-[var(--qling-color-cream-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--qling-color-primary-orange)]"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="text-[17px] font-extrabold text-[var(--qling-color-text)]">답변 작성</h1>
      </div>

      <ContentSheet className="space-y-4 bg-[var(--qling-color-surface)]">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip
            label={props.originalWorry.category}
            selected
            disabled
            className="pointer-events-none px-3 py-1 text-[11px] disabled:opacity-100"
          />
          {props.originalWorry.receivedAt && (
            <time
              className="text-xs font-bold text-[var(--qling-color-muted)]"
              dateTime={props.originalWorry.receivedAt.isoValue}
            >
              {props.originalWorry.receivedAt.label}
            </time>
          )}
        </div>
        <button
          type="button"
          onClick={props.onOpenOriginal}
          aria-label="원문 보기"
          className="group flex w-full items-start justify-between gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[var(--qling-color-primary-orange)] focus:ring-offset-2"
        >
          <span className="whitespace-pre-wrap break-words text-base font-extrabold leading-7 text-[var(--qling-color-text)]">
            {props.originalWorry.summaryText}
          </span>
          <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-[var(--qling-color-text)] transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
        </button>
      </ContentSheet>

      <label className="block space-y-2">
        <span className="sr-only">답변 작성</span>
        <span className="relative block">
          <textarea
            value={props.draft.value}
            maxLength={props.draft.maxLength}
            disabled={props.draft.isProcessing}
            aria-invalid={Boolean(validationMessage) || undefined}
            onChange={event => props.onDraftChange(event.currentTarget.value)}
            className="box-border min-h-[27.125rem] w-full resize-none rounded-[18px] border-[1.5px] border-[var(--qling-color-primary-orange)] bg-[var(--qling-ref-splash-cream)] px-4 py-5 text-sm font-bold leading-6 text-[var(--qling-color-text)] outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          />
          {props.draft.value === '' && (
            <span
              className="pointer-events-none absolute left-[22px] top-[22px] flex items-start gap-2 text-base font-bold leading-6 text-[#b8b8b8]"
              aria-hidden="true"
              data-testid="write-reply-pencil-placeholder"
            >
              <Pencil className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>고민자에게 따뜻한 말을 전달해주세요!</span>
            </span>
          )}
        </span>
        <div className="flex items-start justify-between gap-3 text-xs">
          <span className={validationMessage ? 'text-[var(--qling-color-danger)]' : 'text-[var(--qling-color-muted)]'}>{validationMessage}</span>
          <span className={props.draft.value.length > props.draft.maxLength ? 'text-[var(--qling-color-danger)]' : 'text-[#b8b8b8]'}>
            {props.draft.value.length} / {props.draft.maxLength}
          </span>
        </div>
      </label>

      {moderationMessage && (
        <div className="rounded-[var(--qling-radius-card)] border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700 whitespace-pre-wrap">
          {moderationMessage}
        </div>
      )}

      {props.draft.moderation.status === 'checking' && (
        <p className="text-sm font-bold text-[var(--qling-color-muted)]">AI 안심 필터가 내용을 확인하고 있습니다.</p>
      )}

      <div className="rounded-[var(--qling-radius-card)] border border-[var(--qling-color-border)] bg-[var(--qling-color-cream-soft)]/70 p-4">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--qling-color-success)]" aria-hidden="true" />
          <p className="text-xs leading-6 text-[var(--qling-color-muted)]">
            <strong className="text-[var(--qling-color-text)]">AI 안심 필터 적용 안내</strong><br />
            전송 시 부적절한 언어가 감지되는지 확인하고, 문제가 없다면 원문 그대로 전달됩니다.
          </p>
        </div>
      </div>

      <PrimaryCTA
        disabled={isDisabled}
        processing={props.draft.isProcessing}
        accessibilityLabel="답변 전송"
        onClick={() => props.onPublish({
          deliveryId: props.originalWorry.deliveryId,
          worryId: props.originalWorry.worryId,
        })}
      >
        <Send className="h-5 w-5" aria-hidden="true" />
        답변 전송
      </PrimaryCTA>

      {props.isOriginalOverlayOpen && (
        <div className="fixed inset-0 z-[80] flex justify-center bg-black/30" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="write-reply-original-title"
            className="absolute top-[201px] h-[504px] w-full max-w-[var(--qling-mobile-canvas-width)] overflow-hidden rounded-[18px] bg-white px-4 pb-8 pt-4 shadow-[0_12px_40px_rgb(0_0_0/0.18)]"
          >
            <h2 id="write-reply-original-title" className="text-center text-[17px] font-extrabold text-[var(--qling-color-text)]">고민 보기</h2>
            <button
              type="button"
              onClick={props.onCloseOriginal}
              aria-label="원문 닫기"
              className="absolute right-4 top-2 flex h-10 w-10 items-center justify-center rounded-full text-[var(--qling-color-text)] transition-colors hover:bg-[var(--qling-color-cream-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--qling-color-primary-orange)]"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="my-4 h-px bg-[#c2c4c8]" />
            <CategoryChip
              label={props.originalWorry.category}
              selected
              disabled
              className="pointer-events-none px-3 py-1 text-[11px] disabled:opacity-100"
            />
            <p className="mt-4 break-words text-base font-extrabold leading-6 text-[var(--qling-color-text)]">
              {props.originalWorry.summaryText}
            </p>
            <p className="mt-5 max-h-[18.5rem] overflow-y-auto whitespace-pre-wrap break-words text-xs font-bold leading-6 text-[var(--qling-color-text)]">
              {props.originalWorry.originalBodyText}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
