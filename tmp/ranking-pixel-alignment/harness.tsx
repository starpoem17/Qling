import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { RankingScreen } from '../../src/screens/ranking/RankingScreen';
import { BottomNavigation } from '../../src/screens/shared/ui';
import type { RankingScreenState } from '../../src/screens/ranking/contract';

const rankingState: RankingScreenState = {
  status: 'ready',
  monthly: [
    { rank: 1, uid: '1', nickname: 'Starpoem', heartCount: 9999 },
    { rank: 2, uid: '2', nickname: 'Might_Guy', heartCount: 888 },
    { rank: 3, uid: '3', nickname: 'Hangyeol', heartCount: 77 },
    { rank: 4, uid: '4', nickname: '최대닉네임길이몇으로할까요4', heartCount: 51 },
    { rank: 5, uid: '5', nickname: '최대닉네임길이몇으로할까5', heartCount: 40 },
    { rank: 6, uid: '6', nickname: '최대닉네임길이몇으로할6', heartCount: 30 },
    { rank: 7, uid: '7', nickname: '최대닉네임길이몇으로7', heartCount: 20 },
    { rank: 8, uid: '8', nickname: '최대닉네임길이몇으8', heartCount: 10 },
    { rank: 9, uid: '9', nickname: '최대닉네임길이몇9', heartCount: 2 },
    { rank: 10, uid: '10', nickname: '최대닉네임길이10', heartCount: 1 },
  ],
  total: [],
};

function App() {
  return (
    <div className="qling-production-root text-[var(--qling-color-text)] font-sans">
      <div className="qling-production-frame">
        <main className="mx-auto w-full px-[var(--qling-space-shell-x)] pb-[var(--qling-space-scroll-bottom)] pt-6">
          <RankingScreen state={rankingState} />
        </main>
        <BottomNavigation
          tabs={[
            { tab: '답변하기', label: '답변하기' },
            { tab: '나의 고민', label: '나의 고민' },
            { tab: '채팅', label: '채팅' },
            { tab: '순위', label: '순위' },
          ]}
          activeTab="순위"
          onSelectTab={() => undefined}
        />
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing root');
createRoot(root).render(<App />);

const targets: Record<string, { x: number; y: number; w: number; h: number }> = {
  'bottom-nav-답변하기-icon': { x: 45, y: 797.217, w: 39.144, h: 34.255 },
  'bottom-nav-나의 고민-icon': { x: 139.824, y: 786.302, w: 27.153, h: 28.284 },
  'bottom-nav-채팅-icon': { x: 228, y: 787, w: 30, h: 30 },
  'bottom-nav-순위-icon': { x: 315.789, y: 786.302, w: 26.019, h: 28.284 },
  'ranking-segmented-outer': { x: 85, y: 62, w: 224, h: 33 },
  'ranking-segmented-monthly': { x: 95, y: 66, w: 102, h: 25 },
  'ranking-top-first': { x: 157, y: 141, w: 80, h: 135 },
  'ranking-top-second': { x: 29, y: 171, w: 80, h: 135 },
  'ranking-top-third': { x: 284, y: 193, w: 80, h: 135 },
  'ranking-profile-first': { x: 157, y: 196, w: 80, h: 80 },
  'ranking-profile-second': { x: 29, y: 226, w: 80, h: 80 },
  'ranking-profile-third': { x: 284, y: 248, w: 80, h: 80 },
  'ranking-row-4-rank': { x: 32, y: 417, w: 26, h: 30 },
  'ranking-row-4-nickname': { x: 96, y: 417, w: 204, h: 28 },
  'ranking-row-4-heart': { x: 305, y: 420, w: 80, h: 17 },
  'ranking-row-10-rank': { x: 32, y: 717, w: 26, h: 30 },
  'ranking-row-10-nickname': { x: 96, y: 717, w: 204, h: 28 },
  'ranking-row-10-heart': { x: 305, y: 720, w: 80, h: 17 },
};

function measure() {
  const rows = Object.entries(targets).map(([id, target]) => {
    const node = document.querySelector(`[data-measure="${id}"]`);
    const rect = node?.getBoundingClientRect();
    const actual = rect
      ? { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
      : { x: Number.NaN, y: Number.NaN, w: Number.NaN, h: Number.NaN };
    return {
      id,
      target,
      actual,
      delta: {
        x: actual.x - target.x,
        y: actual.y - target.y,
        w: actual.w - target.w,
        h: actual.h - target.h,
      },
    };
  });
  document.body.dataset.measurements = JSON.stringify(rows);
}

requestAnimationFrame(() => requestAnimationFrame(measure));
