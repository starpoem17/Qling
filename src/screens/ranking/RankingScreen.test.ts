import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_PROFILE_COLOR } from '../../lib/profileColor';
import { RankingScreen } from './RankingScreen';
import { profileImageUrlForColor } from '../shared/ui';
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
  assert.match(html, /font-\[&#x27;Qling_Noto_Sans_KR&#x27;\]/);
  assert.match(html, /min-height:calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \* 852 \/ 393\)/);
  assert.match(html, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /transform:scale\(calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)\)/);
  assert.doesNotMatch(html, /transform:scale\(min\(/);
  assert.doesNotMatch(html, /var\(--qling-space-safe-bottom\)\) \/ 772px/);
});

test('app ranking route wrapper preserves full shell height for iPhone clipping behavior', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'App.tsx'), 'utf8');

  assert.match(source, /key="ranking"[\s\S]*className="h-full min-h-0"/);
});

test('ranking segmented control preserves Figma font weights after class merging', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps()));
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'ranking', 'RankingScreen.tsx'), 'utf8');

  assert.match(html, /font-bold[^"]*"[^>]*data-measure="ranking-segmented-monthly"/);
  assert.match(html, /font-medium[^"]*"[^>]*data-measure="ranking-segmented-total"/);
  assert.match(html, /font-family:&quot;Qling Noto Sans KR&quot;/);
  assert.match(source, /mode === 'monthly' \? 'font-bold text-\[#f26c0f\]' : 'font-medium text-white'/);
  assert.match(source, /mode === 'total' \? 'font-bold text-\[#f26c0f\]' : 'font-medium text-white'/);
});

test('top ranking avatars and crowns are present in static markup', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps()));

  assert.match(html, /class="absolute left-0 top-0 z-10 h-\[406px\] w-\[393px\] text-center text-white" data-measure="ranking-top-first"/);
  assert.match(html, /class="absolute left-0 top-0 z-10 h-\[406px\] w-\[393px\] text-center text-white" data-measure="ranking-top-second"/);
  assert.match(html, /class="absolute left-0 top-0 z-10 h-\[406px\] w-\[393px\] text-center text-white" data-measure="ranking-top-third"/);
  assert.match(html, /data-measure="ranking-profile-first"/);
  assert.match(html, /data-measure="ranking-profile-second"/);
  assert.match(html, /data-measure="ranking-profile-third"/);
  assert.match(html, /big_ellipse\.svg/);
  assert.match(html, /small_ellipse\.svg/);
  assert.match(html, /absolute block max-w-none left-\[171px\] top-\[252px\] h-\[23px\] w-\[53px\]/);
  assert.match(html, /absolute block max-w-none left-\[55px\] top-\[269px\] h-\[18px\] w-\[42px\]/);
  assert.match(html, /absolute block max-w-none left-\[294px\] top-\[284px\] h-\[18px\] w-\[42px\]/);
  assert.match(html, /absolute block max-w-none left-\[177px\] top-\[170px\] h-6 w-\[42px\]/);
  assert.match(html, /absolute max-w-none rounded-full left-\[163px\] top-\[200px\] h-\[69px\] w-\[69px\]/);
  assert.match(html, /crown-first\.svg/);
  assert.match(html, /crown-second\.svg/);
  assert.match(html, /crown-third\.svg/);
  assert.doesNotMatch(html, /bg-\[#b35a1c\]\/35/);
});

test('profile image generation recolors only the shared default profile background', () => {
  const decoded = decodeURIComponent(profileImageUrlForColor('#6FA8F0'));

  assert.match(decoded, /fill="#6FA8F0"/);
  assert.doesNotMatch(decoded, /fill="#FF8B3D"/);
  assert.match(decoded, /mask0_346_383/);
  assert.match(decoded, /mask1_346_383/);
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
