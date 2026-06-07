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

test('ranking screen uses the widened unscaled tab canvas like the other list screens', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps()));

  assert.match(html, /data-measure="ranking-responsive-canvas"/);
  assert.match(html, /data-measure="ranking-screen"/);
  assert.match(html, /font-\[&#x27;Qling_Noto_Sans_KR&#x27;\]/);
  assert.match(html, /-mx-\[var\(--qling-space-shell-x\)\] h-\[var\(--qling-tab-viewport-height\)\] overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /mx-auto flex h-full w-full justify-center overflow-hidden max-w-\[480px\]/);
  assert.match(html, /relative h-full min-h-0 w-full max-w-\[480px\] shrink-0 overflow-hidden bg-\[#ff8b3d\]/);
  assert.doesNotMatch(html, /transform:scale/);
  assert.doesNotMatch(html, /h-\[852px\] w-\[393px\]/);
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

test('ranking text preserves Figma font weights after class merging', () => {
  const rankings = period();
  const entries = rankings.entries.map(item => item.rank === 4 ? { ...item, rankDelta: 2 } : item);
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps({
    state: {
      status: 'ready',
      monthly: { ...rankings, entries },
      total: { ...rankings, entries },
      season: {
        monthLabel: '5월 시즌',
        daysUntilMonthEnd: 1,
      },
    },
  })));

  assert.match(html, /class="absolute truncate font-bold left-\[136px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+274px\)\] w-\[120px\] text-\[15px\] leading-5" style="font-family:&quot;Qling Noto Sans KR&quot;">User 1/);
  assert.match(html, /class="inline-flex items-center overflow-hidden font-bold gap-1 text-\[13px\] leading-\[17px\] absolute justify-center text-white left-\[136px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+296px\)\] w-\[120px\]" style="font-family:&quot;Qling Noto Sans KR&quot;/);
  assert.match(html, /class="block truncate text-\[15px\] font-medium leading-5 text-\[#191f28\]" style="font-family:&quot;Qling Noto Sans KR&quot;">User 4/);
  assert.match(html, /class="mt-0\.5 block truncate text-\[11\.5px\] font-medium leading-\[15px\] text-\[#8b95a1\]" style="font-family:&quot;Qling Noto Sans KR&quot;">답변 4 · 채택 0/);
  assert.match(html, /class="inline-flex items-center overflow-hidden font-bold gap-\[5px\] text-\[15px\] leading-5 shrink-0 text-\[#191f28\]" style="font-family:&quot;Qling Noto Sans KR&quot;/);
  assert.match(html, /class="inline-flex h-4 shrink-0 items-center justify-end gap-0\.5 overflow-hidden text-right text-\[11px\] font-bold leading-\[14px\] w-9 text-\[#f2664b\]" style="font-family:&quot;Qling Noto Sans KR&quot;/);
});

test('top ranking avatars and crowns are present in static markup', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps()));
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'ranking', 'RankingScreen.tsx'), 'utf8');

  assert.match(html, /class="absolute left-1\/2 w-\[393px\] -translate-x-1\/2" style="top:max\(12px, calc\(calc\(var\(--qling-space-safe-top\) \+ 88px\) \+ 44px \+ 24px - calc\(min\(var\(--qling-space-safe-top\), 14px\) \+ 170px\)\)\)" data-measure="ranking-top-layer"/);
  assert.match(html, /class="pointer-events-none absolute left-0 top-0 z-10 w-\[393px\] text-center text-white" style="height:calc\(min\(var\(--qling-space-safe-top\), 14px\) \+ 406px\)" data-measure="ranking-top-first"/);
  assert.match(html, /class="pointer-events-none absolute left-0 top-0 z-10 w-\[393px\] text-center text-white" style="height:calc\(min\(var\(--qling-space-safe-top\), 14px\) \+ 406px\)" data-measure="ranking-top-second"/);
  assert.match(html, /class="pointer-events-none absolute left-0 top-0 z-10 w-\[393px\] text-center text-white" style="height:calc\(min\(var\(--qling-space-safe-top\), 14px\) \+ 406px\)" data-measure="ranking-top-third"/);
  assert.match(html, /data-measure="ranking-profile-first"/);
  assert.match(html, /data-measure="ranking-profile-second"/);
  assert.match(html, /data-measure="ranking-profile-third"/);
  assert.match(html, /big_ellipse\.svg/);
  assert.match(html, /small_ellipse\.svg/);
  assert.match(html, /absolute block max-w-none left-\[171px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+252px\)\] h-\[23px\] w-\[53px\]/);
  assert.match(html, /absolute block max-w-none left-\[55px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+269px\)\] h-\[18px\] w-\[42px\]/);
  assert.match(html, /absolute block max-w-none left-\[294px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+284px\)\] h-\[18px\] w-\[42px\]/);
  assert.match(html, /absolute block max-w-none left-\[177px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+170px\)\] h-6 w-\[42px\]/);
  assert.match(html, /absolute max-w-none rounded-full left-\[163px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+200px\)\] h-\[69px\] w-\[69px\]/);
  assert.match(html, /crown-first\.svg/);
  assert.match(html, /crown-second\.svg/);
  assert.match(html, /crown-third\.svg/);
  assert.doesNotMatch(html, /bg-\[#b35a1c\]\/35/);
  assert.match(source, /left-6 top-\[13px\] h-\[67px\] w-\[108px\] rounded-t-\[16px\] bg-white\/20/);
  assert.match(source, /left-\[261px\] top-7 h-\[52px\] w-\[108px\] rounded-t-\[16px\] bg-white\/20/);
});

test('ranking my page button uses the shared Figma asset icon', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps()));
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'ranking', 'RankingScreen.tsx'), 'utf8');

  assert.match(html, /aria-label="마이페이지 열기"/);
  assert.match(html, /my_page_icon\.svg/);
  assert.match(html, /right-\[17px\] top-\[calc\(var\(--qling-space-safe-top\)\+21px\)\] h-\[49px\] w-\[49px\]/);
  assert.match(html, /class="absolute left-3 top-3 h-\[25px\] w-\[25px\]"/);
  assert.doesNotMatch(html, /lucide-circle-user-round/);
  assert.doesNotMatch(source, /CircleUserRound/);
});

test('podium fills top three entry slots even when shared ranks skip a rank number', () => {
  const rankings = period();
  const entries: RankingDisplayEntry[] = [
    { ...entry(1), uid: 'co-first-a', nickname: 'Co First A', heartCount: 2 },
    { ...entry(1), uid: 'co-first-b', nickname: 'Co First B', heartCount: 2 },
    { ...entry(3), uid: 'shared-third', nickname: 'Shared Third', heartCount: 1 },
  ];
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps({
    state: {
      status: 'ready',
      monthly: { ...rankings, entries },
      total: { ...rankings, entries },
      season: {
        monthLabel: '5월 시즌',
        daysUntilMonthEnd: 1,
      },
    },
  })));

  assert.match(html, /data-measure="ranking-profile-first"/);
  assert.match(html, /data-measure="ranking-profile-second"/);
  assert.match(html, /data-measure="ranking-profile-third"/);
  assert.match(html, /absolute block max-w-none left-\[55px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+269px\)\] h-\[18px\] w-\[42px\]/);
  assert.match(html, /absolute block max-w-none left-\[294px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+284px\)\] h-\[18px\] w-\[42px\]/);
  assert.match(html, /crown-second\.svg/);
  assert.match(html, /crown-third\.svg/);
  assert.match(html, /left-\[16px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+290px\)\] w-\[120px\] text-\[13px\] leading-\[17px\]" style="font-family:&quot;Qling Noto Sans KR&quot;">Co First B/);
  assert.match(html, /left-\[255px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+305px\)\] w-\[120px\] text-\[13px\] leading-\[17px\]" style="font-family:&quot;Qling Noto Sans KR&quot;">Shared Third/);
  assert.match(html, /left-\[16px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+312px\)\] w-\[120px\]" style="font-family:&quot;Qling Noto Sans KR&quot;[\s\S]*<span>2/);
  assert.match(html, /left-\[255px\] top-\[calc\(min\(var\(--qling-space-safe-top\),14px\)\+327px\)\] w-\[120px\]" style="font-family:&quot;Qling Noto Sans KR&quot;[\s\S]*<span>1/);
});

test('ranking top cluster offsets below the segmented control while the ranking sheet reveals the podium', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps()));
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'ranking', 'RankingScreen.tsx'), 'utf8');

  assert.match(source, /const rankingTopSafeOffset = 'min\(var\(--qling-space-safe-top\), 14px\)'/);
  assert.match(source, /const rankingPodiumTop = `calc\(\$\{rankingTopSafeOffset\} \+ 326px\)`/);
  assert.match(source, /const rankingSegmentedControlHeight = 44/);
  assert.match(source, /const rankingSegmentToCrownGap = 24/);
  assert.match(source, /const rankingFirstCrownTop = `calc\(\$\{rankingTopSafeOffset\} \+ 170px\)`/);
  assert.match(source, /const rankingTopGraphicMinimumOffset = 12/);
  assert.match(source, /const rankingTopGraphicOffset = `max\(\$\{rankingTopGraphicMinimumOffset\}px, calc\(\$\{rankingSegmentedControlTop\} \+ \$\{rankingSegmentedControlHeight\}px \+ \$\{rankingSegmentToCrownGap\}px - \$\{rankingFirstCrownTop\}\)\)`/);
  assert.match(source, /const rankingSheetMinimumTop = 430/);
  assert.match(source, /const rankingThirdPodiumNumberBottom = 75/);
  assert.match(source, /const rankingPodiumToSheetGap = 4/);
  assert.match(source, /const rankingSheetTop = `max\(\$\{rankingSheetMinimumTop\}px, calc\(\$\{rankingTopGraphicOffset\} \+ \$\{rankingPodiumTop\} \+ \$\{rankingThirdPodiumNumberBottom\}px \+ \$\{rankingPodiumToSheetGap\}px\)\)`/);
  assert.match(html, /class="absolute left-1\/2 w-\[393px\] -translate-x-1\/2" style="top:max\(12px, calc\(calc\(var\(--qling-space-safe-top\) \+ 88px\) \+ 44px \+ 24px - calc\(min\(var\(--qling-space-safe-top\), 14px\) \+ 170px\)\)\)" data-measure="ranking-top-layer"/);
  assert.match(html, /style="top:calc\(min\(var\(--qling-space-safe-top\), 14px\) \+ 326px\)"/);
  assert.match(html, /style="top:max\(430px, calc\(max\(12px, calc\(calc\(var\(--qling-space-safe-top\) \+ 88px\) \+ 44px \+ 24px - calc\(min\(var\(--qling-space-safe-top\), 14px\) \+ 170px\)\)\) \+ calc\(min\(var\(--qling-space-safe-top\), 14px\) \+ 326px\) \+ 75px \+ 4px\)\)/);
  assert.doesNotMatch(html, /top-\[430px\]/);
  assert.doesNotMatch(html, /top-\[400px\]/);
  assert.doesNotMatch(source, /Podium topOffset="calc\(var\(--qling-space-safe-top\) \+ 326px\)"/);
});

test('ranking sheet renders entries by slot after the podium even when rank numbers are shared', () => {
  const rankings = period();
  const entries: RankingDisplayEntry[] = [
    { ...entry(1), uid: 'co-first-a', nickname: 'Co First A', heartCount: 9 },
    { ...entry(1), uid: 'co-first-b', nickname: 'Co First B', heartCount: 9 },
    { ...entry(1), uid: 'co-first-c', nickname: 'Co First C', heartCount: 9 },
    { ...entry(1), uid: 'co-first-d', nickname: 'Co First D', heartCount: 9 },
    { ...entry(5), uid: 'fifth-slot', nickname: 'Fifth Slot', heartCount: 7 },
  ];
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps({
    state: {
      status: 'ready',
      monthly: { ...rankings, entries },
      total: { ...rankings, entries },
      season: {
        monthLabel: '5월 시즌',
        daysUntilMonthEnd: 1,
      },
    },
  })));

  assert.match(html, />Co First D</);
  assert.match(html, />Fifth Slot</);
  assert.match(html, /absolute bottom-0 left-0 top-12 flex w-full flex-col overflow-y-auto px-5/);
  assert.doesNotMatch(html, /아직 순위가 없어요/);
});

test('ranking sheet renders partial rows and keeps viewer card when the viewer is in the list', () => {
  const rankings = period();
  const entries: RankingDisplayEntry[] = [
    entry(1),
    entry(2),
    entry(3),
    { ...entry(4), uid: 'viewer', nickname: 'Viewer Nickname' },
    entry(5),
  ];
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps({
    state: {
      status: 'ready',
      monthly: {
        entries,
        viewer: {
          ...entries[3],
          percentile: 80,
        },
      },
      total: rankings,
      season: {
        monthLabel: '5월 시즌',
        daysUntilMonthEnd: 1,
      },
    },
  })));

  assert.match(html, />Viewer Nickname</);
  assert.match(html, />User 5</);
  assert.match(html, /aria-label="내 순위 4위"/);
  assert.match(html, />나</);
  assert.doesNotMatch(html, /아직 순위가 없어요/);
});

test('viewer rank card displays dash rank and percentile when viewer has no hearts', () => {
  const rankings = period();
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps({
    state: {
      status: 'ready',
      monthly: {
        ...rankings,
        viewer: {
          ...entry(24),
          uid: 'viewer',
          nickname: '나',
          heartCount: 0,
          percentile: 100,
        },
      },
      total: rankings,
      season: {
        monthLabel: '5월 시즌',
        daysUntilMonthEnd: 1,
      },
    },
  })));

  assert.match(html, /aria-label="내 순위 -"/);
  assert.match(html, />내 순위</);
  assert.match(html, />-</);
  assert.match(html, />상위 -% · 이번 달</);
  assert.doesNotMatch(html, /상위 100% · 이번 달/);
  assert.match(html, /<span>0<\/span>/);
});

test('ranking sheet is empty when there are fewer than four ranked entries', () => {
  const rankings = period();
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps({
    state: {
      status: 'ready',
      monthly: { ...rankings, entries: [entry(1), entry(2), entry(3)] },
      total: rankings,
      season: {
        monthLabel: '5월 시즌',
        daysUntilMonthEnd: 1,
      },
    },
  })));

  assert.match(html, /아직 순위가 없어요/);
  assert.match(html, /style="top:min\(156px, max\(8px, calc\(max\(72px/);
  assert.match(html, /max\(8px, calc\(calc\(var\(--qling-tab-viewport-height\) - 79px\) - max\(430px, calc\(max\(12px,/);
  assert.doesNotMatch(html, />User 4</);
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
  assert.doesNotMatch(html, /chevron-right\.svg/);
  assert.doesNotMatch(html, /top-\[693px\]/);
  assert.match(html, /class="absolute left-4 right-4 flex h-\[70px\]/);
  assert.match(html, /top:calc\(var\(--qling-tab-viewport-height\) - 79px\)/);
  assert.doesNotMatch(html, /min\(773px/);
});

test('ready ranking sheet stops above the viewer card when my rank is visible', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps()));

  assert.match(html, /전체 랭킹/);
  assert.doesNotMatch(html, /top-\[400px\] h-\[372px\]/);
  assert.match(html, /style="top:max\(430px, calc\(max\(12px,/);
  assert.match(html, /overflow-hidden rounded-t-\[26px\]/);
  assert.match(html, /height:max\(72px, calc\(calc\(var\(--qling-tab-viewport-height\) - 79px\) - max\(430px, calc\(max\(12px,/);
  assert.doesNotMatch(html, /min\(452px/);
  assert.doesNotMatch(html, /min\(773px/);
});

test('ready ranking sheet can still stretch when no viewer card is visible', () => {
  const rankings = period();
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps({
    state: {
      status: 'ready',
      monthly: { ...rankings, viewer: null },
      total: { ...rankings, viewer: null },
      season: {
        monthLabel: '5월 시즌',
        daysUntilMonthEnd: 1,
      },
    },
  })));

  assert.match(html, /전체 랭킹/);
  assert.match(html, /height:max\(372px, calc\(var\(--qling-tab-viewport-height\) - max\(430px, calc\(max\(12px,/);
  assert.doesNotMatch(html, /min\(452px/);
});

test('ranking loading state uses the widened unscaled canvas', () => {
  const html = renderToStaticMarkup(createElement(RankingScreen, baseProps({
    state: { status: 'loading' },
  })));
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'ranking', 'RankingScreen.tsx'), 'utf8');

  assert.match(html, /data-measure="ranking-screen"/);
  assert.doesNotMatch(html, /transform:scale/);
  assert.match(html, /style="top:max\(430px, calc\(max\(12px,/);
  assert.match(html, /height:max\(372px, calc\(var\(--qling-tab-viewport-height\) - max\(430px, calc\(max\(12px,/);
  assert.doesNotMatch(html, /h-\[452px\]/);
  assert.match(html, /class="absolute left-1\/2 w-\[393px\] -translate-x-1\/2" style="top:max\(12px, calc\(calc\(var\(--qling-space-safe-top\) \+ 88px\) \+ 44px \+ 24px - calc\(min\(var\(--qling-space-safe-top\), 14px\) \+ 170px\)\)\)" data-measure="ranking-top-layer"/);
  assert.match(html, /style="top:calc\(min\(var\(--qling-space-safe-top\), 14px\) \+ 326px\)"/);
  assert.match(html, /data-testid="figma-tab-loading-indicator"/);
  assert.match(html, /left-1\/2 h-10 w-10 -translate-x-1\/2 top-\[73px\]/);
  assert.doesNotMatch(html, /랭킹을 불러오는 중/);
  assert.doesNotMatch(html, /5월 시즌|마감|누적 시즌/);
  assert.doesNotMatch(html, /전체 랭킹|받은 ♥ 기준/);
  assert.doesNotMatch(html, /disabled=""/);
  assert.doesNotMatch(source, /function LoadingSpinner/);
  assert.doesNotMatch(source, /border-t-\[#ff8b3d\]|border-r-\[#ff8b3d\]/);
  assert.doesNotMatch(html, /100dvh - var\(--qling-space-nav-height\)/);
});
