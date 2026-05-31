import type { TouchEvent, UIEvent, WheelEvent } from 'react';

const WHEEL_SCROLL_END_DELAY_MS = 120;
const SCROLL_SNAP_THRESHOLD_PX = 42;
const SETTLE_TRANSITION = 'transform 160ms ease-out';

const scrollEndTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
const pendingLayouts = new WeakMap<HTMLElement, PendingPeekHeaderLayout>();
const layoutFrames = new WeakMap<HTMLElement, number>();

export type PeekHeaderScrollState = {
  collapsed: boolean;
  lastScrollTop: number;
  accumulatedDelta: number;
  canReveal: boolean;
  gestureStartCollapsed: boolean | null;
};

export const initialPeekHeaderScrollState: PeekHeaderScrollState = {
  collapsed: false,
  lastScrollTop: 0,
  accumulatedDelta: 0,
  canReveal: false,
  gestureStartCollapsed: null,
};

export type PeekHeaderLayout = {
  progress: number;
  collapsed: boolean;
  isTrackingGesture: boolean;
};

type PendingPeekHeaderLayout = PeekHeaderLayout & {
  commitState: boolean;
};

export function nextPeekHeaderScrollState(
  state: PeekHeaderScrollState,
  scrollTop: number,
): PeekHeaderScrollState {
  const nextScrollTop = Math.max(0, scrollTop);
  if (nextScrollTop === 0) return initialPeekHeaderScrollState;

  const delta = nextScrollTop - state.lastScrollTop;
  if (delta === 0) return state;

  const sameDirection = Math.sign(delta) === Math.sign(state.accumulatedDelta);
  const accumulatedDelta = sameDirection ? state.accumulatedDelta + delta : delta;
  const gestureStartCollapsed = sameDirection && state.gestureStartCollapsed !== null
    ? state.gestureStartCollapsed
    : state.collapsed;

  if (Math.abs(accumulatedDelta) < SCROLL_SNAP_THRESHOLD_PX) {
    return {
      ...state,
      lastScrollTop: nextScrollTop,
      accumulatedDelta,
      gestureStartCollapsed,
    };
  }

  return {
    collapsed: delta > 0,
    lastScrollTop: nextScrollTop,
    accumulatedDelta: 0,
    canReveal: false,
    gestureStartCollapsed: null,
  };
}

export function peekHeaderLayoutForState(state: PeekHeaderScrollState): PeekHeaderLayout {
  if (state.gestureStartCollapsed === null || state.accumulatedDelta === 0) {
    return layoutForCollapsedState(state.collapsed, false);
  }

  const targetCollapsed = state.accumulatedDelta > 0;
  const progress = Math.min(1, Math.abs(state.accumulatedDelta) / SCROLL_SNAP_THRESHOLD_PX);
  const startProgress = progressForCollapsedState(state.gestureStartCollapsed);
  const targetProgress = progressForCollapsedState(targetCollapsed);

  return {
    progress: interpolate(startProgress, targetProgress, progress),
    collapsed: state.collapsed,
    isTrackingGesture: targetCollapsed !== state.gestureStartCollapsed,
  };
}

export function settlePeekHeaderScrollState(state: PeekHeaderScrollState): PeekHeaderScrollState {
  if (state.gestureStartCollapsed === null) {
    return {
      ...state,
      accumulatedDelta: 0,
    };
  }

  return {
    collapsed: state.gestureStartCollapsed,
    lastScrollTop: state.lastScrollTop,
    accumulatedDelta: 0,
    canReveal: false,
    gestureStartCollapsed: null,
  };
}

export function useScrollPeekHeader() {
  return {
    isHeaderCollapsed: false,
    onScroll: handlePeekHeaderScroll,
    onTouchStart: handlePeekHeaderTouchStart,
    onTouchMove: handlePeekHeaderTouchMove,
    onTouchEnd: handlePeekHeaderTouchEnd,
    onWheel: handlePeekHeaderWheel,
  };
}

type PeekHeaderHandlers = ReturnType<typeof useScrollPeekHeader>;

export type PeekHeaderScrollHandlers = Pick<
  PeekHeaderHandlers,
  'onScroll' | 'onTouchStart' | 'onTouchMove' | 'onTouchEnd' | 'onWheel'
>;

function handlePeekHeaderScroll(event: UIEvent<HTMLElement>) {
  const scroller = event.currentTarget;
  const currentState = readScrollState(scroller);
  const nextState = nextPeekHeaderScrollState(currentState, scroller.scrollTop);
  writeScrollState(scroller, nextState);
  schedulePeekHeaderLayout(scroller, peekHeaderLayoutForState(nextState), false);
  scheduleScrollEnd(scroller);
}

function handlePeekHeaderWheel(event: WheelEvent<HTMLElement>) {
  void event;
}

function handlePeekHeaderTouchStart(event: TouchEvent<HTMLElement>) {
  const touch = event.touches[0];
  if (!touch) return;
  event.currentTarget.dataset.qlingPeekHeaderTouchY = String(touch.clientY);
}

function handlePeekHeaderTouchMove(event: TouchEvent<HTMLElement>) {
  const touch = event.touches[0];
  if (!touch) return;

  const scroller = event.currentTarget;
  const previousY = Number(scroller.dataset.qlingPeekHeaderTouchY ?? touch.clientY);
  scroller.dataset.qlingPeekHeaderTouchY = String(touch.clientY);

  if (touch.clientY === previousY) return;
}

function handlePeekHeaderTouchEnd(event: TouchEvent<HTMLElement>) {
  settlePeekHeaderScroll(event.currentTarget);
}

function readScrollState(element: HTMLElement): PeekHeaderScrollState {
  return {
    collapsed: element.dataset.qlingPeekHeaderCollapsed === 'true',
    lastScrollTop: Number(element.dataset.qlingPeekHeaderLastScrollTop ?? '0'),
    accumulatedDelta: Number(element.dataset.qlingPeekHeaderAccumulatedDelta ?? '0'),
    canReveal: element.dataset.qlingPeekHeaderCanReveal === 'true',
    gestureStartCollapsed: readOptionalBoolean(element.dataset.qlingPeekHeaderGestureStartCollapsed),
  };
}

function writeScrollState(element: HTMLElement, state: PeekHeaderScrollState) {
  element.dataset.qlingPeekHeaderCollapsed = String(state.collapsed);
  element.dataset.qlingPeekHeaderLastScrollTop = String(state.lastScrollTop);
  element.dataset.qlingPeekHeaderAccumulatedDelta = String(state.accumulatedDelta);
  element.dataset.qlingPeekHeaderCanReveal = String(state.canReveal);
  if (state.gestureStartCollapsed === null) {
    delete element.dataset.qlingPeekHeaderGestureStartCollapsed;
  } else {
    element.dataset.qlingPeekHeaderGestureStartCollapsed = String(state.gestureStartCollapsed);
  }
}

function schedulePeekHeaderLayout(scroller: HTMLElement, layout: PeekHeaderLayout, commitState: boolean) {
  pendingLayouts.set(scroller, { ...layout, commitState });
  if (layoutFrames.has(scroller)) return;

  const frame = requestPeekHeaderFrame(() => {
    layoutFrames.delete(scroller);
    const pendingLayout = pendingLayouts.get(scroller);
    if (!pendingLayout) return;
    pendingLayouts.delete(scroller);
    applyPeekHeaderLayout(scroller, pendingLayout);
  });
  layoutFrames.set(scroller, frame);
}

function applyPeekHeaderLayout(scroller: HTMLElement, layout: PendingPeekHeaderLayout) {
  const header = scroller.previousElementSibling;
  if (!(header instanceof HTMLElement)) return;
  const headerContent = header.querySelector<HTMLElement>('[data-qling-peek-header-content]');

  if (layout.commitState) {
    const state = layout.collapsed ? 'collapsed' : 'expanded';
    header.dataset.headerState = state;
    scroller.dataset.headerState = state;
  }

  const transition = !layout.commitState || layout.isTrackingGesture || prefersReducedMotion() ? 'none' : SETTLE_TRANSITION;
  if (headerContent) headerContent.style.transition = transition;
  scroller.style.transition = transition;
  header.style.setProperty('--qling-peek-progress', String(layout.progress));
  scroller.style.setProperty('--qling-peek-progress', String(layout.progress));
}

function settlePeekHeaderScroll(scroller: HTMLElement) {
  clearScrollEnd(scroller);
  const settledState = settlePeekHeaderScrollState(readScrollState(scroller));
  writeScrollState(scroller, settledState);
  schedulePeekHeaderLayout(scroller, peekHeaderLayoutForState(settledState), true);
}

function scheduleScrollEnd(scroller: HTMLElement) {
  clearScrollEnd(scroller);
  scrollEndTimers.set(scroller, setTimeout(() => settlePeekHeaderScroll(scroller), WHEEL_SCROLL_END_DELAY_MS));
}

function clearScrollEnd(scroller: HTMLElement) {
  const timer = scrollEndTimers.get(scroller);
  if (timer === undefined) return;
  clearTimeout(timer);
  scrollEndTimers.delete(scroller);
}

function layoutForCollapsedState(collapsed: boolean, isTrackingGesture: boolean): PeekHeaderLayout {
  return {
    progress: progressForCollapsedState(collapsed),
    collapsed,
    isTrackingGesture,
  };
}

function progressForCollapsedState(collapsed: boolean) {
  return collapsed ? 1 : 0;
}

function interpolate(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function requestPeekHeaderFrame(callback: FrameRequestCallback) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readOptionalBoolean(value: string | undefined) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}
