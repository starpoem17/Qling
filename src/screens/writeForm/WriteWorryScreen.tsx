import { ArrowLeft, Pencil, Send } from 'lucide-react';
import { ContentSheet, PrimaryCTA } from '../shared/ui';
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
  const showVisualPlaceholder = props.draft.value.trim().length === 0;

  return (
    <div className="space-y-5 pb-4">
      <header className="relative flex min-h-16 items-center justify-center">
        <button
          type="button"
          onClick={props.onBack}
          className="absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--qling-color-text)] transition-colors hover:bg-[var(--qling-color-cream-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--qling-color-primary-orange)]"
          aria-label="나의 고민으로 돌아가기"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="text-base font-extrabold text-[var(--qling-color-text)]">고민 작성</h1>
      </header>

      <ContentSheet className="border border-[#ff8b3d] bg-[#fff5eb] p-0 shadow-none">
        <label className="relative block">
          <span className="sr-only">고민 내용</span>
          <textarea
            value={props.draft.value}
            maxLength={props.draft.maxLength}
            disabled={props.draft.isProcessing}
            aria-invalid={Boolean(validationMessage) || undefined}
            aria-describedby="write-worry-counter"
            onChange={event => props.onDraftChange(event.currentTarget.value)}
            className={cn(
              'box-border h-[33.75rem] w-full resize-none rounded-[1.625rem] border-0 bg-transparent px-6 pb-12 pt-6 text-base leading-7 text-[var(--qling-color-text)] outline-none disabled:cursor-not-allowed disabled:opacity-60',
              validationMessage && 'ring-2 ring-[var(--qling-color-danger)]',
            )}
          />
          {showVisualPlaceholder && (
            <div
              className="pointer-events-none absolute left-6 top-6 flex items-center gap-2 text-[#b8b8b8]"
              data-testid="write-worry-visual-placeholder"
              aria-hidden="true"
            >
              <Pencil className="h-5 w-5" data-testid="write-worry-pencil" aria-hidden="true" />
              <span className="text-sm font-semibold">당신의 솔직한 이야기를 들려주세요</span>
            </div>
          )}
          <div
            id="write-worry-counter"
            className="absolute bottom-5 right-5 text-sm font-semibold text-[#b8b8b8]"
            data-testid="write-worry-character-count"
          >
            {props.draft.value.length} / {props.draft.maxLength}
          </div>
        </label>
      </ContentSheet>

      {validationMessage && (
        <p className="text-sm font-bold text-[var(--qling-color-danger)]">{validationMessage}</p>
      )}

      {moderationMessage && (
        <div className="whitespace-pre-wrap rounded-[var(--qling-radius-card)] border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
          {moderationMessage}
        </div>
      )}

      {props.draft.moderation.status === 'checking' && (
        <p className="text-sm font-bold text-[var(--qling-color-muted)]">AI 안심 필터가 내용을 확인하고 있습니다.</p>
      )}

      <PrimaryCTA
        disabled={isDisabled}
        processing={props.draft.isProcessing}
        accessibilityLabel="고민 전송"
        onClick={props.onPublish}
      >
        <Send className="h-5 w-5" aria-hidden="true" />
        고민 전송
      </PrimaryCTA>
    </div>
  );
}
