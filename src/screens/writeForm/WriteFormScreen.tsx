import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FigmaCanvasFrame, FigmaTopBar } from '../shared/ui';
import type { WriteFormScreenProps } from './contract';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const pwaTopbarShift = 'var(--qling-pwa-topbar-shift, 0px)';
const sendButtonBaseTop = 'calc((var(--qling-stable-viewport-height) - var(--qling-space-nav-height)) - var(--qling-write-form-send-bottom-offset))';
const sendButtonTop = `calc(${sendButtonBaseTop} + ${pwaTopbarShift})`;
const originalCardTop = `calc(100px + ${pwaTopbarShift})`;
const originalCardCollapsedHeight = '79px';
const originalCardCollapsedHeightPx = 79;
const originalCardExpandedMaxHeight = `min(30%, calc(${sendButtonTop} - ${originalCardTop} - 21px - 240px - 23px))`;
const inputAreaGapPx = 21;
const inputAreaBottomGapPx = 23;

export function WriteFormScreen(props: WriteFormScreenProps) {
  const originalCardRef = useRef<HTMLElement | null>(null);
  const originalBodyPointerStartRef = useRef<{ readonly x: number; readonly y: number; readonly scrollTop: number } | null>(null);
  const [measuredOriginalCardHeight, setMeasuredOriginalCardHeight] = useState(originalCardCollapsedHeightPx);
  const isDisabled = Boolean(props.draft.submitDisabledReason);
  const validationMessage = props.draft.validation.status === 'invalid' && props.draft.value !== ''
    ? props.draft.validation.message
    : undefined;
  const originalCardStyle: CSSProperties = props.isOriginalExpanded
    ? { maxHeight: originalCardExpandedMaxHeight }
    : { height: originalCardCollapsedHeight };
  const effectiveOriginalCardHeight = props.isOriginalExpanded ? measuredOriginalCardHeight : originalCardCollapsedHeightPx;
  const inputAreaTop = `calc(${originalCardTop} + ${effectiveOriginalCardHeight}px + ${inputAreaGapPx}px)`;
  const inputAreaHeight = `max(240px, calc(${sendButtonTop} - ${inputAreaTop} - ${inputAreaBottomGapPx}px))`;

  useIsomorphicLayoutEffect(() => {
    const originalCard = originalCardRef.current;
    if (!originalCard) return;

    const measureOriginalCard = () => {
      const nextHeight = Math.ceil(originalCard.getBoundingClientRect().height);
      if (nextHeight > 0) setMeasuredOriginalCardHeight(nextHeight);
    };

    measureOriginalCard();
    if (typeof ResizeObserver !== 'function') return;

    const resizeObserver = new ResizeObserver(measureOriginalCard);
    resizeObserver.observe(originalCard);
    return () => resizeObserver.disconnect();
  }, [props.isOriginalExpanded, props.originalWorry.summaryText, props.originalWorry.originalBodyText]);

  return (
    <section className="h-full min-h-0 overflow-hidden bg-[#fff1d1] text-[#2a2a2a]">
      <FigmaCanvasFrame className="max-w-[480px]">
        <div className="relative h-full min-h-0 w-full max-w-[480px] shrink-0 overflow-hidden bg-[#fff1d1]">
      {FigmaTopBar({ title: '답변 작성', onBack: props.onBack, backLabel: '답변하기로 돌아가기' })}

        <section
          ref={originalCardRef}
          id="write-reply-original-card"
          className={cn(
            'absolute left-4 right-4 overflow-hidden rounded-[18px] bg-white shadow-[0_4px_4px_rgb(0_0_0/0.25)]',
            props.isOriginalExpanded && 'flex min-h-[79px] flex-col',
          )}
          style={{ top: originalCardTop, ...originalCardStyle }}
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
              'shrink-0 break-words text-base font-extrabold leading-6 tracking-[-0.48px] text-[#2a2a2a]',
              props.isOriginalExpanded
                ? 'px-[19px] pt-[44px] pr-12'
                : 'truncate pl-[19px] pr-12 pt-[44px]',
            )}
          >
            {props.originalWorry.summaryText}
          </p>
          {props.isOriginalExpanded && (
            <p
              onPointerDown={event => {
                originalBodyPointerStartRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  scrollTop: event.currentTarget.scrollTop,
                };
              }}
              onPointerUp={event => {
                const start = originalBodyPointerStartRef.current;
                originalBodyPointerStartRef.current = null;
                if (!start) return;
                const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
                const scrolled = Math.abs(event.currentTarget.scrollTop - start.scrollTop);
                if (moved <= 8 && scrolled <= 2) props.onToggleOriginalExpanded();
              }}
              className="relative z-30 mt-[13px] min-h-0 flex-1 cursor-pointer overflow-y-auto overscroll-contain whitespace-pre-wrap break-words px-[19px] pb-[18px] text-xs font-bold leading-6 tracking-[-0.36px] text-[#2a2a2a] [-webkit-overflow-scrolling:touch]"
            >
              {props.originalWorry.originalBodyText}
            </p>
          )}
        </section>

      <label
        className="absolute left-5 right-5 block overflow-hidden rounded-[18px] border-[1.5px] border-[#ff8b3d] bg-[#fff5eb]"
        style={{ top: inputAreaTop, height: inputAreaHeight }}
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
        className="absolute left-1/2 flex h-12 w-[267px] -translate-x-1/2 items-center justify-center rounded-full bg-[#ff8b3d] px-[22px] text-base font-extrabold leading-5 text-[#fff5eb] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
        style={{ top: sendButtonTop }}
      >
        답변 전송
      </button>
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
