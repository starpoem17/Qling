import type { TouchEvent, UIEvent, WheelEvent } from 'react';

const DEFAULT_SCROLL_THRESHOLD_PX = 6;

export type PeekHeaderScrollState = {
  collapsed: boolean;
  lastScrollTop: number;
  accumulatedDelta: number;
  canReveal: boolean;
};

export const initialPeekHeaderScrollState: PeekHeaderScrollState = {
  collapsed: false,
  lastScrollTop: 0,
  accumulatedDelta: 0,
  canReveal: false,
};

export function nextPeekHeaderScrollState(
  state: PeekHeaderScrollState,
  scrollTop: number,
  threshold = DEFAULT_SCROLL_THRESHOLD_PX,
): PeekHeaderScrollState {
  const nextScrollTop = Math.max(0, scrollTop);
  if (nextScrollTop === 0) return initialPeekHeaderScrollState;

  const delta = nextScrollTop - state.lastScrollTop;
  if (delta === 0) return state;

  if (delta < 0 && !state.canReveal) {
    return {
      ...state,
      lastScrollTop: nextScrollTop,
      accumulatedDelta: 0,
    };
  }

  const sameDirection = Math.sign(delta) === Math.sign(state.accumulatedDelta);
  const accumulatedDelta = sameDirection ? state.accumulatedDelta + delta : delta;
  if (Math.abs(accumulatedDelta) < threshold) {
    return {
      ...state,
      lastScrollTop: nextScrollTop,
      accumulatedDelta,
    };
  }

  return {
    collapsed: delta > 0,
    lastScrollTop: nextScrollTop,
    accumulatedDelta: 0,
    canReveal: false,
  };
}

export function useScrollPeekHeader() {
  return {
    isHeaderCollapsed: false,
    onScroll: handlePeekHeaderScroll,
    onTouchStart: handlePeekHeaderTouchStart,
    onTouchMove: handlePeekHeaderTouchMove,
    onWheel: handlePeekHeaderWheel,
  };
}

type PeekHeaderHandlers = ReturnType<typeof useScrollPeekHeader>;

export type PeekHeaderScrollHandlers = Pick<
  PeekHeaderHandlers,
  'onScroll' | 'onTouchStart' | 'onTouchMove' | 'onWheel'
>;

function handlePeekHeaderScroll(event: UIEvent<HTMLElement>) {
  const scroller = event.currentTarget;
  const currentState = readScrollState(scroller);
  const nextState = nextPeekHeaderScrollState(currentState, scroller.scrollTop);
  writeScrollState(scroller, nextState);
  applyPeekHeaderState(scroller, nextState.collapsed);
}

function handlePeekHeaderWheel(event: WheelEvent<HTMLElement>) {
  const scroller = event.currentTarget;
  if (event.deltaY < 0) {
    allowReveal(scroller);
    revealAtScrollTop(scroller);
    return;
  }

  if (event.deltaY > 0) preventReveal(scroller);
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

  if (touch.clientY > previousY) {
    allowReveal(scroller);
    revealAtScrollTop(scroller);
    return;
  }

  if (touch.clientY < previousY) preventReveal(scroller);
}

function readScrollState(element: HTMLElement): PeekHeaderScrollState {
  return {
    collapsed: element.dataset.qlingPeekHeaderCollapsed === 'true',
    lastScrollTop: Number(element.dataset.qlingPeekHeaderLastScrollTop ?? '0'),
    accumulatedDelta: Number(element.dataset.qlingPeekHeaderAccumulatedDelta ?? '0'),
    canReveal: element.dataset.qlingPeekHeaderCanReveal === 'true',
  };
}

function writeScrollState(element: HTMLElement, state: PeekHeaderScrollState) {
  element.dataset.qlingPeekHeaderCollapsed = String(state.collapsed);
  element.dataset.qlingPeekHeaderLastScrollTop = String(state.lastScrollTop);
  element.dataset.qlingPeekHeaderAccumulatedDelta = String(state.accumulatedDelta);
  element.dataset.qlingPeekHeaderCanReveal = String(state.canReveal);
}

function applyPeekHeaderState(scroller: HTMLElement, isCollapsed: boolean) {
  const header = scroller.previousElementSibling;
  if (!(header instanceof HTMLElement)) return;

  header.dataset.headerState = isCollapsed ? 'collapsed' : 'expanded';
  header.classList.toggle('h-[16px]', isCollapsed);
  header.classList.toggle('h-[100px]', !isCollapsed);
  scroller.classList.toggle('h-[836px]', isCollapsed);
  scroller.classList.toggle('h-[752px]', !isCollapsed);
}

function allowReveal(element: HTMLElement) {
  element.dataset.qlingPeekHeaderCanReveal = 'true';
}

function preventReveal(element: HTMLElement) {
  element.dataset.qlingPeekHeaderCanReveal = 'false';
}

function revealAtScrollTop(scroller: HTMLElement) {
  if (scroller.scrollTop !== 0) return;
  if (scroller.dataset.qlingPeekHeaderCollapsed !== 'true') return;

  writeScrollState(scroller, initialPeekHeaderScrollState);
  applyPeekHeaderState(scroller, false);
}
