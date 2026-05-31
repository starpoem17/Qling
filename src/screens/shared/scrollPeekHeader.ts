import type { TouchEvent, UIEvent, WheelEvent } from 'react';

const SCROLL_SNAP_THRESHOLD_PX = 64;
const WHEEL_SCROLL_END_DELAY_MS = 120;
const EXPANDED_HEADER_HEIGHT_PX = 100;
const COLLAPSED_HEADER_HEIGHT_PX = 16;
const EXPANDED_CONTENT_HEIGHT_PX = 752;
const COLLAPSED_CONTENT_HEIGHT_PX = 836;

const scrollEndTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

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
  headerHeight: number;
  contentHeight: number;
  isTrackingGesture: boolean;
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
  const startHeaderHeight = heightForHeaderState(state.gestureStartCollapsed);
  const targetHeaderHeight = heightForHeaderState(targetCollapsed);
  const startContentHeight = heightForContentState(state.gestureStartCollapsed);
  const targetContentHeight = heightForContentState(targetCollapsed);

  return {
    headerHeight: interpolate(startHeaderHeight, targetHeaderHeight, progress),
    contentHeight: interpolate(startContentHeight, targetContentHeight, progress),
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
  applyPeekHeaderLayout(scroller, peekHeaderLayoutForState(nextState));
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

function applyPeekHeaderLayout(scroller: HTMLElement, layout: PeekHeaderLayout) {
  const header = scroller.previousElementSibling;
  if (!(header instanceof HTMLElement)) return;

  const isCollapsed = layout.headerHeight === COLLAPSED_HEADER_HEIGHT_PX;
  header.dataset.headerState = isCollapsed ? 'collapsed' : 'expanded';
  header.classList.toggle('h-[16px]', isCollapsed);
  header.classList.toggle('h-[100px]', !isCollapsed);
  scroller.classList.toggle('h-[836px]', isCollapsed);
  scroller.classList.toggle('h-[752px]', !isCollapsed);
  header.style.transition = layout.isTrackingGesture ? 'none' : '';
  scroller.style.transition = layout.isTrackingGesture ? 'none' : '';
  header.style.height = `${layout.headerHeight}px`;
  scroller.style.height = `${layout.contentHeight}px`;
}

function settlePeekHeaderScroll(scroller: HTMLElement) {
  clearScrollEnd(scroller);
  const settledState = settlePeekHeaderScrollState(readScrollState(scroller));
  writeScrollState(scroller, settledState);
  applyPeekHeaderLayout(scroller, peekHeaderLayoutForState(settledState));
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
    headerHeight: heightForHeaderState(collapsed),
    contentHeight: heightForContentState(collapsed),
    isTrackingGesture,
  };
}

function heightForHeaderState(collapsed: boolean) {
  return collapsed ? COLLAPSED_HEADER_HEIGHT_PX : EXPANDED_HEADER_HEIGHT_PX;
}

function heightForContentState(collapsed: boolean) {
  return collapsed ? COLLAPSED_CONTENT_HEIGHT_PX : EXPANDED_CONTENT_HEIGHT_PX;
}

function interpolate(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function readOptionalBoolean(value: string | undefined) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}
