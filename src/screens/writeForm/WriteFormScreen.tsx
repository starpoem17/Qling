import { ChevronDown, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FigmaCanvasFrame, FigmaTopBar } from '../shared/ui';
import type { WriteFormScreenProps } from './contract';

const pwaTopbarShift = 'var(--qling-pwa-topbar-shift, 0px)';
const sendButtonBaseTop = 'calc((var(--qling-visual-viewport-height) - var(--qling-space-nav-height)) - 88px)';
const sendButtonTop = `calc(${sendButtonBaseTop} + ${pwaTopbarShift})`;
const topBoxTop = `calc(100px + ${pwaTopbarShift})`;
const inputAreaTop = `calc(200px + ${pwaTopbarShift})`;
const inputAreaHeight = `max(240px, calc(${sendButtonTop} - ${inputAreaTop} - 23px))`;

export function WriteFormScreen(props: WriteFormScreenProps) {
  const isDisabled = Boolean(props.draft.submitDisabledReason);
  const validationMessage = props.draft.validation.status === 'invalid' && props.draft.value !== ''
    ? props.draft.validation.message
    : undefined;

  return (
    <section className="h-full min-h-0 overflow-hidden bg-[#fff1d1] text-[#2a2a2a]">
      <FigmaCanvasFrame className="max-w-[480px]">
        <div className="relative h-full min-h-0 w-full max-w-[480px] shrink-0 overflow-hidden bg-[#fff1d1]">
      {FigmaTopBar({ title: '답변 작성', onBack: props.onBack, backLabel: '답변하기로 돌아가기' })}

      <div
        className="absolute inset-x-0 bottom-0 overflow-y-auto overscroll-contain pb-[calc(var(--qling-space-nav-height)+32px)] [-webkit-overflow-scrolling:touch]"
        style={{ top: topBoxTop }}
      >
        <section
          id="write-reply-original-card"
          className={cn(
            'relative mx-4 overflow-hidden rounded-[18px] bg-white shadow-[0_4px_4px_rgb(0_0_0/0.25)]',
            props.isOriginalExpanded ? 'min-h-[159px] pb-[18px]' : 'h-[79px]',
          )}
        >
          <button
            type="button"
            onClick={props.onToggleOriginalExpanded}
            aria-label={props.isOriginalExpanded ? '원문 접기' : '원문 펼치기'}
            aria-expanded={props.isOriginalExpanded}
            aria-controls="write-reply-original-card"
            className="absolute inset-0 z-20 cursor-pointer appearance-none rounded-[18px] border-0 bg-transparent p-0 text-left focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2"
          />
          <div className="absolute left-[18px] top-[11px]">
            <ReplyCategoryChip label={props.originalWorry.category} />
          </div>
          {props.originalWorry.receivedAt && (
            <time
              className="absolute left-[80px] top-[17px] text-xs font-semibold leading-[15px] tracking-[-0.36px] text-[#b8b8b8]"
              dateTime={props.originalWorry.receivedAt.isoValue}
            >
              {props.originalWorry.receivedAt.label}
            </time>
          )}
          <span
            className="pointer-events-none absolute right-[11px] top-[10px] z-10 flex h-10 w-10 items-center justify-center text-[#2a2a2a]"
            aria-hidden="true"
          >
            <ChevronDown className={cn('h-6 w-6', props.isOriginalExpanded && 'rotate-180')} />
          </span>
          <p
            className={cn(
              'break-words text-base font-extrabold leading-6 tracking-[-0.48px] text-[#2a2a2a]',
              props.isOriginalExpanded
                ? 'px-[19px] pt-[44px] pr-12'
                : 'truncate pl-[19px] pr-12 pt-[44px]',
            )}
          >
            {props.originalWorry.summaryText}
          </p>
          {props.isOriginalExpanded && (
            <p className="whitespace-pre-wrap break-words px-[19px] pt-[13px] text-xs font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a]">
              {props.originalWorry.originalBodyText}
            </p>
          )}
        </section>

      <label
        className="relative mx-5 mt-[21px] block overflow-hidden rounded-[18px] border-[1.5px] border-[#ff8b3d] bg-[#fff5eb]"
        style={{ height: inputAreaHeight }}
      >
        <span className="sr-only">답변 작성</span>
        <textarea
          value={props.draft.value}
          maxLength={props.draft.maxLength}
          disabled={props.draft.isProcessing}
          aria-invalid={Boolean(validationMessage) || undefined}
          onChange={event => props.onDraftChange(event.currentTarget.value)}
          className="box-border h-full w-full resize-none bg-transparent px-[22px] pb-10 pt-[22px] text-base font-medium leading-6 tracking-[-0.64px] text-[#2a2a2a] outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
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


      <button
        type="button"
        disabled={isDisabled}
        aria-label="답변 전송"
        aria-busy={props.draft.isProcessing || undefined}
        onClick={() => props.onPublish({
          deliveryId: props.originalWorry.deliveryId,
          worryId: props.originalWorry.worryId,
        })}
        className="mx-auto mt-[23px] flex h-12 w-[267px] items-center justify-center rounded-full bg-[#ff8b3d] px-[22px] text-base font-extrabold leading-5 text-[#fff5eb] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
      >
        답변 전송
      </button>
      </div>
        </div>
      </FigmaCanvasFrame>
    </section>
  );
}

function ReplyCategoryChip({ label }: { readonly label: string }) {
  return (
    <span
      className="pointer-events-none box-border inline-flex h-[23px] items-center justify-center rounded-full bg-[#ffe4cc] px-3 py-0 text-center text-[11px] font-bold leading-[13px] text-[#ff8b3d]"
    >
      {label}
    </span>
  );
}
