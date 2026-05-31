import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_PROFILE_COLOR } from '../../lib/profileColor';
import { RankingScreen } from './RankingScreen';
import type { RankingDisplayEntry, RankingDisplayPeriod, RankingScreenProps } from './contract';

function entry(rank: number): RankingDisplayEntry {
  return {
    rank,
    uid: `user-${rank}`,
    nickname: `User ${rank}`,
    heartCount: 10 - rank,
    profileColor: DEFAULT_PROFILE_COLOR,
    replyCount: rank,
    adoptedCount: 0,
    rankDelta: 0,
  };
}

function period(): RankingDisplayPeriod {
  return {
    entries: Array.from({ length: 8 }, (_, index) => entry(index + 1)),
    viewer: {
      ...entry(24),
      uid: 'viewer',
      nickname: '나',
      percentile: 18,
    },
  };
}

function baseProps(overrides: Partial<RankingScreenProps> = {}): RankingScreenProps {
  const rankings = period();
  return {
    state: {
      status: 'ready',
      monthly: rankings,
      total: rankings,
      season: {
        monthLabel: '5월 시즌',
        daysUntilMonthEnd: 1,
      },
    },
    onOpenMyPage: () => undefined,
    ...overrides,
  };
}

test('ranking screen scales the Figma canvas by width only like the other tab screens', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps()));

  assert.match(html, /data-measure="ranking-responsive-canvas"/);
  assert.match(html, /data-measure="ranking-screen"/);
  assert.match(html, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /transform:scale\(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)\)/);
  assert.doesNotMatch(html, /transform:scale\(min\(/);
  assert.doesNotMatch(html, /var\(--qling-space-safe-bottom\)\) \/ 772px/);
});

test('viewer rank card stays above the shell bottom navigation on shorter iPhone viewports', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps()));

  assert.match(html, /aria-label="내 순위 24위"/);
  assert.doesNotMatch(html, /top-\[693px\]/);
  assert.match(html, /top:min\(693px, calc\(\(100dvh - var\(--qling-space-nav-height\) - 79px\) \/ \(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)\)\)\)/);
});

test('ranking loading state uses the same width-only canvas scale', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps({
    state: { status: 'loading' },
  })));

  assert.match(html, /data-measure="ranking-screen"/);
  assert.match(html, /transform:scale\(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)\)/);
  assert.doesNotMatch(html, /100dvh - var\(--qling-space-nav-height\)/);
});
