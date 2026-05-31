import type { TouchEvent, UIEvent, WheelEvent } from 'react';

const WHEEL_SCROLL_END_DELAY_MS = 120;
const SCROLL_SNAP_THRESHOLD_PX = 42;
const PEEK_PROGRESS_DISTANCE_PX = 84;
const BOTTOM_EDGE_EPSILON_PX = 1;
const SETTLE_TRANSITION = 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)';
const SCROLL_DIRECTION_DOWN = 'down';
const SCROLL_DIRECTION_UP = 'up';

const scrollEndTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
const pendingLayouts = new WeakMap<HTMLElement, PendingPeekHeaderLayout>();
const layoutFrames = new WeakMap<HTMLElement, number>();

export type PeekHeaderScrollState = {
  collapsed: boolean;
  lastScrollTop: number;
  accumulatedDelta: number;
  canReveal: boolean;
  gestureStartCollapsed: boolean | null;
  gestureStartProgress: number | null;
};

export const initialPeekHeaderScrollState: PeekHeaderScrollState = {
  collapsed: false,
  lastScrollTop: 0,
  accumulatedDelta: 0,
  canReveal: false,
  gestureStartCollapsed: null,
  gestureStartProgress: null,
};

export type PeekHeaderLayout = {
  progress: number;
  collapsed: boolean;
  isTrackingGesture: boolean;
};

type PendingPeekHeaderLayout = PeekHeaderLayout & {
  commitState: boolean;
};

type ScrollInputDirection = typeof SCROLL_DIRECTION_DOWN | typeof SCROLL_DIRECTION_UP | null;

type PeekHeaderScrollBounds = {
  maxScrollTop: number;
};

export function nextPeekHeaderScrollState(
  state: PeekHeaderScrollState,
  scrollTop: number,
  inputDirection: ScrollInputDirection = null,
  bounds?: PeekHeaderScrollBounds,
): PeekHeaderScrollState {
  const nextScrollTop = Math.max(0, scrollTop);
  const delta = nextScrollTop - state.lastScrollTop;
  if (delta === 0) {
    return nextScrollTop === 0
      ? { ...state, canReveal: true }
      : state;
  }

  const wasAtBottom = bounds !== undefined
    && state.lastScrollTop >= Math.max(0, bounds.maxScrollTop) - BOTTOM_EDGE_EPSILON_PX;
  if (wasAtBottom && delta < 0 && inputDirection !== SCROLL_DIRECTION_UP) {
    return {
      ...state,
      lastScrollTop: nextScrollTop,
      accumulatedDelta: 0,
      canReveal: nextScrollTop === 0,
      gestureStartCollapsed: null,
      gestureStartProgress: null,
    };
  }

  const sameDirection = Math.sign(delta) === Math.sign(state.accumulatedDelta);
  const accumulatedDelta = sameDirection ? state.accumulatedDelta + delta : delta;
  const gestureStartCollapsed = sameDirection && state.gestureStartCollapsed !== null
    ? state.gestureStartCollapsed
    : state.collapsed;
  const gestureStartProgress = sameDirection && state.gestureStartProgress !== null
    ? state.gestureStartProgress
    : peekHeaderLayoutForState(state).progress;

  return {
    ...state,
    lastScrollTop: nextScrollTop,
    accumulatedDelta,
    canReveal: nextScrollTop === 0,
    gestureStartCollapsed,
    gestureStartProgress,
  };
}

export function peekHeaderLayoutForState(state: PeekHeaderScrollState): PeekHeaderLayout {
  if (state.gestureStartCollapsed === null || state.accumulatedDelta === 0) {
    return layoutForCollapsedState(state.collapsed, false);
  }

  const targetCollapsed = state.accumulatedDelta > 0;
  const progress = smoothstep(Math.min(1, Math.abs(state.accumulatedDelta) / PEEK_PROGRESS_DISTANCE_PX));
  const startProgress = state.gestureStartProgress ?? progressForCollapsedState(state.gestureStartCollapsed);
  const targetProgress = progressForCollapsedState(targetCollapsed);

  return {
    progress: interpolate(startProgress, targetProgress, progress),
    collapsed: state.collapsed,
    isTrackingGesture: targetCollapsed !== state.gestureStartCollapsed,
  };
}

export function settlePeekHeaderScrollState(state: PeekHeaderScrollState): PeekHeaderScrollState {
  if (state.canReveal) {
    return {
      collapsed: false,
      lastScrollTop: state.lastScrollTop,
      accumulatedDelta: 0,
      canReveal: false,
      gestureStartCollapsed: null,
      gestureStartProgress: null,
    };
  }

  if (state.gestureStartCollapsed === null) {
    return {
      ...state,
      accumulatedDelta: 0,
      canReveal: false,
      gestureStartProgress: null,
    };
  }

  const collapsed = Math.abs(state.accumulatedDelta) >= SCROLL_SNAP_THRESHOLD_PX
    ? state.accumulatedDelta > 0
    : state.gestureStartCollapsed;

  return {
    collapsed,
    lastScrollTop: state.lastScrollTop,
    accumulatedDelta: 0,
    canReveal: false,
    gestureStartCollapsed: null,
    gestureStartProgress: null,
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

export function resetPeekHeaderScrollElement(scroller: HTMLElement) {
  clearScrollEnd(scroller);
  pendingLayouts.delete(scroller);
  const frame = layoutFrames.get(scroller);
  if (frame !== undefined) {
    cancelPeekHeaderFrame(frame);
    layoutFrames.delete(scroller);
  }

  scroller.scrollTop = 0;
  writeScrollState(scroller, initialPeekHeaderScrollState);
  clearScrollInputDirection(scroller);

  const header = scroller.previousElementSibling;
  if (header instanceof HTMLElement) {
    header.dataset.headerState = 'expanded';
    header.style.setProperty('--qling-peek-progress', '0');
    const headerContent = header.querySelector<HTMLElement>('[data-qling-peek-header-content]');
    if (headerContent) headerContent.style.transition = 'none';
  }

  scroller.dataset.headerState = 'expanded';
  scroller.style.transition = 'none';
  scroller.style.setProperty('--qling-peek-progress', '0');
}

type PeekHeaderHandlers = ReturnType<typeof useScrollPeekHeader>;

export type PeekHeaderScrollHandlers = Pick<
  PeekHeaderHandlers,
  'onScroll' | 'onTouchStart' | 'onTouchMove' | 'onTouchEnd' | 'onWheel'
>;

function handlePeekHeaderScroll(event: UIEvent<HTMLElement>) {
  const scroller = event.currentTarget;
  const currentState = readScrollState(scroller);
  const nextState = nextPeekHeaderScrollState(
    currentState,
    scroller.scrollTop,
    readScrollInputDirection(scroller),
    { maxScrollTop: Math.max(0, scroller.scrollHeight - scroller.clientHeight) },
  );
  writeScrollState(scroller, nextState);
  schedulePeekHeaderLayout(scroller, peekHeaderLayoutForState(nextState), false);
  if (!isTouchActive(scroller)) scheduleScrollEnd(scroller);
}

function handlePeekHeaderWheel(event: WheelEvent<HTMLElement>) {
  writeScrollInputDirection(event.currentTarget, directionFromDelta(event.deltaY));
}

function handlePeekHeaderTouchStart(event: TouchEvent<HTMLElement>) {
  const touch = event.touches[0];
  if (!touch) return;
  event.currentTarget.dataset.qlingPeekHeaderTouchY = String(touch.clientY);
  event.currentTarget.dataset.qlingPeekHeaderTouchActive = 'true';
  clearScrollEnd(event.currentTarget);
}

function handlePeekHeaderTouchMove(event: TouchEvent<HTMLElement>) {
  const touch = event.touches[0];
  if (!touch) return;

  const scroller = event.currentTarget;
  const previousY = Number(scroller.dataset.qlingPeekHeaderTouchY ?? touch.clientY);
  scroller.dataset.qlingPeekHeaderTouchY = String(touch.clientY);
  writeScrollInputDirection(scroller, directionFromDelta(previousY - touch.clientY));

  if (touch.clientY === previousY) return;
}

function handlePeekHeaderTouchEnd(event: TouchEvent<HTMLElement>) {
  delete event.currentTarget.dataset.qlingPeekHeaderTouchActive;
  delete event.currentTarget.dataset.qlingPeekHeaderTouchY;
  settlePeekHeaderScroll(event.currentTarget);
}

function readScrollState(element: HTMLElement): PeekHeaderScrollState {
  return {
    collapsed: element.dataset.qlingPeekHeaderCollapsed === 'true',
    lastScrollTop: Number(element.dataset.qlingPeekHeaderLastScrollTop ?? '0'),
    accumulatedDelta: Number(element.dataset.qlingPeekHeaderAccumulatedDelta ?? '0'),
    canReveal: element.dataset.qlingPeekHeaderCanReveal === 'true',
    gestureStartCollapsed: readOptionalBoolean(element.dataset.qlingPeekHeaderGestureStartCollapsed),
    gestureStartProgress: readOptionalNumber(element.dataset.qlingPeekHeaderGestureStartProgress),
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
  if (state.gestureStartProgress === null) {
    delete element.dataset.qlingPeekHeaderGestureStartProgress;
  } else {
    element.dataset.qlingPeekHeaderGestureStartProgress = String(state.gestureStartProgress);
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

  const shouldAnimateCommit = layout.commitState && !layout.isTrackingGesture && !prefersReducedMotion();
  const transition = shouldAnimateCommit ? SETTLE_TRANSITION : 'none';
  if (headerContent) headerContent.style.transition = transition;
  scroller.style.transition = transition;
  if (shouldAnimateCommit) forcePeekHeaderTransitionReady(headerContent, scroller);
  header.style.setProperty('--qling-peek-progress', String(layout.progress));
  scroller.style.setProperty('--qling-peek-progress', String(layout.progress));
}

function settlePeekHeaderScroll(scroller: HTMLElement) {
  clearScrollEnd(scroller);
  const settledState = settlePeekHeaderScrollState(readScrollState(scroller));
  writeScrollState(scroller, settledState);
  clearScrollInputDirection(scroller);
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

function smoothstep(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

function requestPeekHeaderFrame(callback: FrameRequestCallback) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
}

function cancelPeekHeaderFrame(frame: number) {
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(frame);
    return;
  }
  clearTimeout(frame);
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function directionFromDelta(delta: number): ScrollInputDirection {
  if (delta > 0) return SCROLL_DIRECTION_DOWN;
  if (delta < 0) return SCROLL_DIRECTION_UP;
  return null;
}

function readScrollInputDirection(element: HTMLElement): ScrollInputDirection {
  if (element.dataset.qlingPeekHeaderInputDirection === SCROLL_DIRECTION_DOWN) return SCROLL_DIRECTION_DOWN;
  if (element.dataset.qlingPeekHeaderInputDirection === SCROLL_DIRECTION_UP) return SCROLL_DIRECTION_UP;
  return null;
}

function writeScrollInputDirection(element: HTMLElement, direction: ScrollInputDirection) {
  if (direction === null) return;
  element.dataset.qlingPeekHeaderInputDirection = direction;
}

function clearScrollInputDirection(element: HTMLElement) {
  delete element.dataset.qlingPeekHeaderInputDirection;
}

function forcePeekHeaderTransitionReady(headerContent: HTMLElement | null, scroller: HTMLElement) {
  headerContent?.getBoundingClientRect();
  scroller.getBoundingClientRect();
}

function isTouchActive(element: HTMLElement) {
  return element.dataset.qlingPeekHeaderTouchActive === 'true';
}

function readOptionalBoolean(value: string | undefined) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function readOptionalNumber(value: string | undefined) {
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
