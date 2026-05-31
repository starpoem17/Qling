import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, TouchEvent, WheelEvent } from 'react';
import { cn } from '../../lib/utils';
import {
  resetPeekHeaderScrollElement,
  useScrollPeekHeader,
} from './scrollPeekHeader';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function PeekHeaderScrollArea({
  children,
  className,
  contentClassName,
  style,
  ariaLabel,
  resetKey,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly style?: CSSProperties;
  readonly ariaLabel?: string;
  readonly resetKey?: string;
}) {
  const scrollerRef = useRef<HTMLElement | null>(null);
  const [isScrollReady, setIsScrollReady] = useState(false);
  const scrollPeekHeader = useScrollPeekHeader();

  useIsomorphicLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    setIsScrollReady(false);
    resetPeekHeaderScrollElement(scroller);

    const frame = requestPeekHeaderReadyFrame(() => setIsScrollReady(true));
    return () => cancelPeekHeaderReadyFrame(frame);
  }, [resetKey]);

  return (
    <section
      ref={scrollerRef}
      className={cn(
        className,
        isScrollReady
          ? 'overflow-y-auto [-webkit-overflow-scrolling:touch]'
          : 'touch-none overscroll-none overflow-hidden',
        contentClassName,
      )}
      data-header-state="expanded"
      style={style}
      aria-label={ariaLabel}
      onScroll={event => {
        if (!isScrollReady) return;
        scrollPeekHeader.onScroll(event);
      }}
      onTouchStart={event => {
        if (!isScrollReady) return;
        scrollPeekHeader.onTouchStart(event);
      }}
      onTouchMove={event => {
        if (!isScrollReady) {
          blockScroll(event);
          return;
        }
        scrollPeekHeader.onTouchMove(event);
      }}
      onTouchEnd={event => {
        if (!isScrollReady) return;
        scrollPeekHeader.onTouchEnd(event);
      }}
      onWheel={event => {
        if (!isScrollReady) {
          blockScroll(event);
          return;
        }
        scrollPeekHeader.onWheel(event);
      }}
    >
      {children}
    </section>
  );
}

function blockScroll(event: TouchEvent<HTMLElement> | WheelEvent<HTMLElement>) {
  const { preventDefault, stopPropagation } = event;
  preventDefault.call(event);
  stopPropagation.call(event);
}

function requestPeekHeaderReadyFrame(callback: FrameRequestCallback) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
}

function cancelPeekHeaderReadyFrame(frame: number) {
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(frame);
    return;
  }
  clearTimeout(frame);
}
