import type { UIEvent } from 'react';

const DEFAULT_SCROLL_THRESHOLD_PX = 6;

export type PeekHeaderScrollState = {
  collapsed: boolean;
  lastScrollTop: number;
  accumulatedDelta: number;
};

export const initialPeekHeaderScrollState: PeekHeaderScrollState = {
  collapsed: false,
  lastScrollTop: 0,
  accumulatedDelta: 0,
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
  };
}

export function useScrollPeekHeader() {
  return {
    isHeaderCollapsed: false,
    onScroll: handlePeekHeaderScroll,
  };
}

function handlePeekHeaderScroll(event: UIEvent<HTMLElement>) {
  const scroller = event.currentTarget;
  const currentState = readScrollState(scroller);
  const nextState = nextPeekHeaderScrollState(currentState, scroller.scrollTop);
  writeScrollState(scroller, nextState);
  applyPeekHeaderState(scroller, nextState.collapsed);
}

function readScrollState(element: HTMLElement): PeekHeaderScrollState {
  return {
    collapsed: element.dataset.qlingPeekHeaderCollapsed === 'true',
    lastScrollTop: Number(element.dataset.qlingPeekHeaderLastScrollTop ?? '0'),
    accumulatedDelta: Number(element.dataset.qlingPeekHeaderAccumulatedDelta ?? '0'),
  };
}

function writeScrollState(element: HTMLElement, state: PeekHeaderScrollState) {
  element.dataset.qlingPeekHeaderCollapsed = String(state.collapsed);
  element.dataset.qlingPeekHeaderLastScrollTop = String(state.lastScrollTop);
  element.dataset.qlingPeekHeaderAccumulatedDelta = String(state.accumulatedDelta);
}

function applyPeekHeaderState(scroller: HTMLElement, isCollapsed: boolean) {
  const header = scroller.previousElementSibling;
  if (!(header instanceof HTMLElement)) return;

  header.dataset.headerState = isCollapsed ? 'collapsed' : 'expanded';
  header.classList.toggle('h-[32px]', isCollapsed);
  header.classList.toggle('h-[100px]', !isCollapsed);
  scroller.classList.toggle('h-[820px]', isCollapsed);
  scroller.classList.toggle('h-[752px]', !isCollapsed);
}
