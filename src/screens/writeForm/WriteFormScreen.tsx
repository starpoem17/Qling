import { ArrowLeft, ChevronDown, Pencil } from 'lucide-react';
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
  const receivedAtLabel = formatReplyReceivedAt(props.originalWorry.receivedAt?.label);

  return (
    <div className="relative -mx-[var(--qling-space-shell-x)] -mt-6 min-h-[755px] bg-[#fff1d1] px-4 pb-6 pt-6 text-[#2a2a2a]">
      <div className="relative h-[95px]">
        <button
          type="button"
          onClick={props.onBack}
          aria-label="답변하기로 돌아가기"
          className="absolute left-[1px] top-[28px] flex h-11 w-11 items-center justify-center rounded-full text-[#2a2a2a] transition-colors hover:bg-[#fff5eb] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d]"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="absolute left-1/2 top-[39px] -translate-x-1/2 text-[17px] font-extrabold leading-[21px] tracking-[-0.34px] text-[#2a2a2a]">
          답변 작성
        </h1>
      </div>

      <section className="relative h-[103px] w-full overflow-hidden rounded-[18px] bg-white shadow-[0_4px_4px_rgb(0_0_0/0.25)]">
        <div className="absolute left-[18px] top-[11px]">
          <ReplyCategoryChip label={props.originalWorry.category} />
        </div>
        {props.originalWorry.receivedAt && (
          <time
            className="absolute left-[80px] top-[17px] text-xs font-semibold leading-[15px] tracking-[-0.36px] text-[#b8b8b8]"
            dateTime={props.originalWorry.receivedAt.isoValue}
          >
            {receivedAtLabel}
          </time>
        )}
        <button
          type="button"
          onClick={props.onOpenOriginal}
          aria-label="원문 보기"
          className="group absolute inset-0 text-left focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2"
        >
          <span className="absolute left-[19px] top-[44px] w-[325px] whitespace-pre-wrap break-words text-base font-extrabold leading-6 tracking-[-0.48px] text-[#2a2a2a]">
            {props.originalWorry.summaryText}
          </span>
          <ChevronDown className="absolute right-[17px] top-[17px] h-6 w-6 text-[#2a2a2a] transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
        </button>
      </section>

      <label className="relative mt-[17px] block h-[414px] overflow-hidden rounded-[18px] border-[1.5px] border-[#ff8b3d] bg-[#fff5eb]">
        <span className="sr-only">답변 작성</span>
        <textarea
          value={props.draft.value}
          maxLength={props.draft.maxLength}
          disabled={props.draft.isProcessing}
          aria-invalid={Boolean(validationMessage) || undefined}
          onChange={event => props.onDraftChange(event.currentTarget.value)}
          className="box-border h-full w-full resize-none bg-transparent px-[22px] pb-10 pt-[63px] text-sm font-medium leading-6 tracking-[-0.42px] text-[#2a2a2a] outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        />
        {props.draft.value === '' && (
          <span
            className="pointer-events-none absolute left-[22px] top-[22px] flex items-start gap-2 text-base font-medium leading-6 tracking-[-0.64px] text-[#b8b8b8]"
            aria-hidden="true"
            data-testid="write-reply-pencil-placeholder"
          >
            <Pencil className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>고민자에게 따뜻한 말을 전달해주세요!</span>
          </span>
        )}
        {validationMessage && (
          <span className="absolute bottom-[9px] left-[22px] max-w-[220px] truncate text-xs font-bold text-[var(--qling-color-danger)]">
            {validationMessage}
          </span>
        )}
        <span className={props.draft.value.length > props.draft.maxLength ? 'absolute bottom-[9px] right-[18px] text-[13px] font-bold leading-4 text-[var(--qling-color-danger)]' : 'absolute bottom-[9px] right-[18px] text-[13px] font-bold leading-4 text-[#b8b8b8]'}>
          {props.draft.value.length} / {props.draft.maxLength}
        </span>
      </label>

      {moderationMessage && (
        <div className="mt-3 rounded-[12px] border border-red-100 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700 whitespace-pre-wrap">
          {moderationMessage}
        </div>
      )}

      <button
        type="button"
        disabled={isDisabled}
        aria-label="답변 전송"
        aria-busy={props.draft.isProcessing || undefined}
        onClick={() => props.onPublish({
          deliveryId: props.originalWorry.deliveryId,
          worryId: props.originalWorry.worryId,
        })}
        className="mx-auto mt-6 flex h-12 w-[267px] items-center justify-center rounded-full bg-[#ff8b3d] px-[22px] text-base font-extrabold leading-5 text-[#fff5eb] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
      >
        답변 전송
      </button>

      {props.isOriginalOverlayOpen && (
        <div className="fixed inset-0 z-[80] flex justify-center bg-black/30" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="write-reply-original-title"
            className="absolute top-[201px] h-[504px] w-[377px] max-w-[calc(100vw-14px)] overflow-hidden rounded-[18px] bg-white shadow-[0_12px_40px_rgb(0_0_0/0.18)]"
          >
            <h2 id="write-reply-original-title" className="absolute left-1/2 top-3 -translate-x-1/2 text-[17px] font-extrabold leading-[21px] tracking-[-0.34px] text-[#2a2a2a]">
              고민 보기
            </h2>
            <div className="absolute left-0 top-11 h-px w-full bg-[#c2c4c8]" />
            <div className="absolute left-[9px] top-[55px]">
              <ReplyCategoryChip label={props.originalWorry.category} />
            </div>
            <p className="absolute left-[9px] top-[87px] w-[360px] max-w-[calc(100%-18px)] break-words text-base font-extrabold leading-6 tracking-[-0.48px] text-[#2a2a2a]">
              {props.originalWorry.summaryText}
            </p>
            <p className="absolute left-[9px] top-[155px] h-[238px] w-[360px] max-w-[calc(100%-18px)] overflow-y-auto whitespace-pre-wrap break-words text-xs font-medium leading-6 tracking-[-0.36px] text-[#2a2a2a]">
              {props.originalWorry.originalBodyText}
            </p>
            <button
              type="button"
              onClick={props.onCloseOriginal}
              aria-label="원문 닫기"
              className="absolute bottom-9 left-1/2 flex h-[52px] w-[262px] -translate-x-1/2 items-center justify-center rounded-[12px] bg-[#ff8b3d] text-[15px] font-bold leading-[19px] tracking-[-0.15px] text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2"
            >
              닫기
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

function ReplyCategoryChip({ label }: { readonly label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-pressed="true"
      className="pointer-events-none inline-flex min-h-[23px] items-center justify-center rounded-full bg-[#ffe4cc] px-3 py-[5px] text-center text-[11px] font-bold leading-[13px] text-[#ff8b3d] disabled:opacity-100"
    >
      {label}
    </button>
  );
}

function formatReplyReceivedAt(label: string | undefined): string | undefined {
  if (!label) return label;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  if (!match) return label;
  return `${match[1]}.${match[2]}.${match[3]}`;
}
