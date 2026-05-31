import { CircleUserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { DEFAULT_PROFILE_COLOR } from '../../lib/profileColor';
import { ErrorState, profileImageUrlForColor } from '../shared/ui';
import type {
  RankingDisplayEntry,
  RankingDisplayPeriod,
  RankingMode,
  RankingScreenProps,
  ViewerRankingDisplayEntry,
} from './contract';

const rankingCanvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';
const rankingCanvasMinHeight = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) * 852 / 393)';
const viewerRankCardTop = `min(693px, calc((100dvh - var(--qling-space-nav-height) - 79px) / (${rankingCanvasScale})))`;

const rankingAssetUrlByName = {
  crownFirst: new URL('../../../assets/ranking/crown-first.svg', import.meta.url).href,
  crownSecond: new URL('../../../assets/ranking/crown-second.svg', import.meta.url).href,
  crownThird: new URL('../../../assets/ranking/crown-third.svg', import.meta.url).href,
  bigEllipse: new URL('../../../assets/ranking/big_ellipse.svg', import.meta.url).href,
  smallEllipse: new URL('../../../assets/ranking/small_ellipse.svg', import.meta.url).href,
  heart: new URL('../../../assets/ranking/heart.svg', import.meta.url).href,
  heartLight: new URL('../../../assets/ranking/heart-white.svg', import.meta.url).href,
  rankUp: new URL('../../../assets/ranking/rank-up.svg', import.meta.url).href,
  rankDown: new URL('../../../assets/ranking/rank-down.svg', import.meta.url).href,
  chevronRight: new URL('../../../assets/ranking/chevron-right.svg', import.meta.url).href,
} as const;

export function RankingScreen(props: RankingScreenProps) {
  const [mode, setMode] = useState<RankingMode>('monthly');
  const season = props.state.status === 'ready'
    ? props.state.season
    : { monthLabel: '', daysUntilMonthEnd: 0 };

  if (props.state.status === 'loading') {
    return (
      <RankingFrame>
        <RankingHero
          mode={mode}
          seasonLabel={season.monthLabel || '랭킹을 불러오는 중'}
          onChange={setMode}
          onOpenMyPage={props.onOpenMyPage}
          loading
        />
        <LoadingPodium />
        <RankingSheet loading />
      </RankingFrame>
    );
  }

  if (props.state.status === 'error') {
    return (
      <div className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ffd3a8] px-4 pt-[calc(62px+env(safe-area-inset-top,0px))]">
        <ErrorState title="순위를 불러오지 못했어요" message={props.state.message} />
      </div>
    );
  }

  const period = mode === 'monthly' ? props.state.monthly : props.state.total;
  const seasonLabel = mode === 'monthly'
    ? `${props.state.season.monthLabel} · 마감 ${props.state.season.daysUntilMonthEnd}일 전`
    : '누적 시즌';

  return (
    <RankingFrame>
      <RankingHero
        mode={mode}
        seasonLabel={seasonLabel}
        onChange={setMode}
        onOpenMyPage={props.onOpenMyPage}
      />
      <TopRankings period={period} />
      <RankingSheet period={period} />
      {period.viewer && <ViewerRankCard viewer={period.viewer} mode={mode} />}
    </RankingFrame>
  );
}

function RankingFrame({ children }: { readonly children: ReactNode }) {
  return (
    <section
      aria-label="순위"
      className="-mx-[var(--qling-space-shell-x)] -mt-6 h-full min-h-0 overflow-hidden bg-[#ff8b3d] font-['Qling_Noto_Sans_KR']"
      style={{ minHeight: rankingCanvasMinHeight }}
    >
      <div
        className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden"
        data-measure="ranking-responsive-canvas"
        style={{ minHeight: rankingCanvasMinHeight }}
      >
        <div
          className="relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d]"
          data-measure="ranking-screen"
          style={{ transform: `scale(${rankingCanvasScale})` }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

function RankingHero({
  mode,
  seasonLabel,
  loading = false,
  onChange,
  onOpenMyPage,
}: {
  readonly mode: RankingMode;
  readonly seasonLabel: string;
  readonly loading?: boolean;
  readonly onChange: (mode: RankingMode) => void;
  readonly onOpenMyPage: () => void;
}) {
  return (
    <div className="absolute left-0 top-0 h-[406px] w-full bg-[#ff8b3d] text-white">
      <h1 className="absolute left-6 top-[56px] text-[24px] font-black leading-[31px] font-['Qling_Noto_Sans_KR_Black']">
        랭킹
      </h1>
      <p className="absolute left-6 top-[90px] text-[12px] font-medium leading-4 opacity-85 font-['Qling_Noto_Sans_KR']">
        {seasonLabel}
      </p>
      <button
        type="button"
        aria-label="마이페이지"
        onClick={onOpenMyPage}
        className="absolute left-[333.5px] top-[53.5px] flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <CircleUserRound className="h-[25px] w-[25px]" aria-hidden="true" />
      </button>
      <SegmentedControl mode={mode} onChange={onChange} disabled={loading} />
    </div>
  );
}

function SegmentedControl({
  mode,
  onChange,
  disabled = false,
}: {
  readonly mode: RankingMode;
  readonly onChange: (mode: RankingMode) => void;
  readonly disabled?: boolean;
}) {
  return (
    <div className="absolute left-[79px] top-[114px] h-11 w-[236px] rounded-full bg-white/20" data-measure="ranking-segmented-outer">
      <span
        className={cn(
          'absolute top-1 h-9 w-[114px] rounded-full bg-white shadow-[0_2px_7px_rgb(128_87_33/0.2)] transition-transform',
          mode === 'monthly' ? 'translate-x-1' : 'translate-x-[118px]',
        )}
        aria-hidden="true"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('monthly')}
        aria-pressed={mode === 'monthly'}
        className={cn(
          'absolute left-1 top-1 h-9 w-[114px] rounded-full text-center text-[13px] leading-[17px] transition-colors focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-default',
          mode === 'monthly' ? 'font-bold text-[#f26c0f]' : 'font-medium text-white',
        )}
        style={{ fontFamily: '"Qling Noto Sans KR"' }}
        data-measure="ranking-segmented-monthly"
      >
        이 달의 순위
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('total')}
        aria-pressed={mode === 'total'}
        className={cn(
          'absolute left-[118px] top-1 h-9 w-[114px] rounded-full text-center text-[13px] leading-[17px] transition-colors focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-default',
          mode === 'total' ? 'font-bold text-[#f26c0f]' : 'font-medium text-white',
        )}
        style={{ fontFamily: '"Qling Noto Sans KR"' }}
        data-measure="ranking-segmented-total"
      >
        누적 순위
      </button>
    </div>
  );
}

function TopRankings({ period }: { readonly period: RankingDisplayPeriod }) {
  const topEntries = [1, 2, 3].map(rank => period.entries.find(entry => entry.rank === rank) ?? emptyEntry(rank));

  return (
    <>
      <TopRank entry={topEntries[0]} place="first" />
      <TopRank entry={topEntries[1]} place="second" />
      <TopRank entry={topEntries[2]} place="third" />
      <Podium topOffset={326} />
    </>
  );
}

function TopRank({
  entry,
  place,
}: {
  readonly entry: RankingDisplayEntry;
  readonly place: 'first' | 'second' | 'third';
}) {
  const layout = {
    first: {
      avatar: 'left-[163px] top-[200px] h-[69px] w-[69px]',
      crown: 'left-[177px] top-[170px] h-6 w-[42px]',
      crownUrl: rankingAssetUrlByName.crownFirst,
      name: 'left-[136px] top-[274px] w-[120px] text-[15px] leading-5',
      hearts: 'left-[172px] top-[296px]',
      ellipse: 'left-[171px] top-[252px] h-[23px] w-[53px]',
      ellipseUrl: rankingAssetUrlByName.bigEllipse,
    },
    second: {
      avatar: 'left-[50px] top-[230px] h-[52px] w-[52px]',
      crown: 'left-[61px] top-[209px] h-[17px] w-[30px]',
      crownUrl: rankingAssetUrlByName.crownSecond,
      name: 'left-[16px] top-[290px] w-[120px] text-[13px] leading-[17px]',
      hearts: 'left-[56px] top-[312px]',
      ellipse: 'left-[55px] top-[269px] h-[18px] w-[42px]',
      ellipseUrl: rankingAssetUrlByName.smallEllipse,
    },
    third: {
      avatar: 'left-[289px] top-[245px] h-[52px] w-[52px]',
      crown: 'left-[301px] top-[223px] h-[17px] w-[30px]',
      crownUrl: rankingAssetUrlByName.crownThird,
      name: 'left-[255px] top-[305px] w-[120px] text-[13px] leading-[17px]',
      hearts: 'left-[298px] top-[327px]',
      ellipse: 'left-[294px] top-[284px] h-[18px] w-[42px]',
      ellipseUrl: rankingAssetUrlByName.smallEllipse,
    },
  };
  const item = layout[place];

  return (
    <div className="absolute left-0 top-0 z-10 h-[406px] w-[393px] text-center text-white" data-measure={`ranking-top-${place}`}>
      <img src={item.ellipseUrl} alt="" aria-hidden="true" className={cn('absolute block max-w-none', item.ellipse)} />
      <img src={item.crownUrl} alt="" className={cn('absolute block max-w-none', item.crown)} />
      <img
        src={profileImageUrlForColor(entry.profileColor)}
        alt=""
        className={cn('absolute max-w-none rounded-full', item.avatar)}
        data-measure={`ranking-profile-${place}`}
      />
      <div className={cn('absolute truncate font-bold font-["Qling_Noto_Sans_KR"]', item.name)}>{entry.nickname || '-'}</div>
      <HeartCount className={cn('absolute text-white', item.hearts)} heartCount={entry.heartCount} size="small" tone="light" />
    </div>
  );
}

function LoadingPodium() {
  return (
    <>
      <Podium topOffset={306} />
      <LoadingSpinner />
    </>
  );
}

function Podium({ topOffset }: { readonly topOffset: number }) {
  return (
    <div className="absolute left-0 h-[100px] w-full" style={{ top: `${topOffset}px` }} aria-hidden="true">
      <div className="absolute left-[141px] top-0 h-20 w-[111px] rounded-t-[16px] bg-white/95 shadow-[8px_-6px_0_rgb(66_48_48/0.1)]" />
      <div className="absolute left-6 top-[13px] h-[67px] w-[108px] rounded-t-[16px] bg-white/20 shadow-[8px_-6px_0_rgb(0_0_0/0.1)]" />
      <div className="absolute left-[261px] top-7 h-[52px] w-[108px] rounded-t-[16px] bg-white/20 shadow-[8px_-6px_0_rgb(0_0_0/0.1)]" />
      <span className="absolute left-[141px] top-[13px] h-[34px] w-[111px] text-center text-[27px] font-black leading-[35px] text-[#f26c0f] font-['Qling_Noto_Sans_KR_Black']">1</span>
      <span className="absolute left-6 top-6 h-[34px] w-[108px] text-center text-[27px] font-black leading-[35px] text-white font-['Qling_Noto_Sans_KR_Black']">2</span>
      <span className="absolute left-[261px] top-[41px] h-[34px] w-[108px] text-center text-[27px] font-black leading-[35px] text-white font-['Qling_Noto_Sans_KR_Black']">3</span>
    </div>
  );
}

function RankingSheet({
  period,
  loading = false,
}: {
  readonly period?: RankingDisplayPeriod;
  readonly loading?: boolean;
}) {
  const rows = period?.entries.filter(entry => entry.rank >= 4).slice(0, 7) ?? [];
  return (
    <section className={cn(
      'absolute left-0 w-full rounded-t-[26px] bg-white shadow-[0_-5px_8px_rgb(128_87_33/0.1)]',
      loading ? 'top-[380px] h-[392px]' : 'top-[400px] h-[372px]',
    )}>
      <h2 className="absolute left-5 top-5 text-[14px] font-bold leading-[18px] text-[#191f28] font-['Qling_Noto_Sans_KR']">
        전체 랭킹
      </h2>
      <div className="absolute left-[373px] top-[22px] w-[120px] -translate-x-full text-right text-[12px] font-medium leading-4 text-[#8b95a1] font-['Qling_Noto_Sans_KR']">
        받은 ♥ 기준
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : rows.length > 0 ? (
        <ol className="absolute left-0 top-12 flex w-full flex-col overflow-hidden px-5">
          {rows.map(entry => <RankingRow key={entry.uid} entry={entry} />)}
        </ol>
      ) : (
        <div className="absolute left-0 top-[156px] w-full text-center text-[14px] font-medium text-[#8b95a1]">
          아직 순위가 없어요.
        </div>
      )}
    </section>
  );
}

function RankingRow({ entry }: { readonly entry: RankingDisplayEntry }) {
  return (
    <li className="flex h-[57px] items-center gap-3 border-b border-[#f1f3f5] py-3 last:border-b-0">
      <span className="flex h-5 w-5 shrink-0 items-start justify-center text-[16px] font-medium leading-[21px] text-[#8b95a1] font-['Qling_Noto_Sans_KR']">
        {entry.rank}
      </span>
      <img src={profileImageUrlForColor(entry.profileColor)} alt="" className="h-[38px] w-[38px] shrink-0 rounded-full" />
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate text-[15px] font-medium leading-5 text-[#191f28] font-['Qling_Noto_Sans_KR']">{entry.nickname}</span>
        <span className="mt-0.5 block truncate text-[11.5px] font-normal leading-[15px] text-[#8b95a1] font-['Qling_Noto_Sans_KR']">
          답변 {entry.replyCount} · 채택 {entry.adoptedCount}
        </span>
      </span>
      <HeartCount className="shrink-0 text-[#191f28]" heartCount={entry.heartCount} />
      <RankDelta value={entry.rankDelta} />
    </li>
  );
}

function ViewerRankCard({
  viewer,
  mode,
}: {
  readonly viewer: ViewerRankingDisplayEntry;
  readonly mode: RankingMode;
}) {
  return (
    <div
      className="absolute left-4 flex h-[70px] w-[361px] items-center gap-[18px] overflow-hidden rounded-[18px] bg-[#ffe3cb] py-[11px] pl-[14px] pr-4 text-left shadow-[0_8px_22px_rgb(128_87_33/0.16)]"
      style={{ top: viewerRankCardTop }}
      aria-label={`내 순위 ${viewer.rank}위`}
    >
      <span className="flex h-[46px] w-[46px] shrink-0 flex-col items-center justify-center rounded-[13px] bg-[#34c759] text-white shadow-[2px_3px_4px_rgb(0_0_0/0.25)]">
        <span className="text-[8.5px] font-medium leading-[11px] font-['Qling_Noto_Sans_KR']">내 순위</span>
        <span className="text-[19px] font-black leading-[25px] font-['Qling_Noto_Sans_KR_Black']">{viewer.rank}</span>
      </span>
      <img src={profileImageUrlForColor(viewer.profileColor)} alt="" className="h-[38px] w-[38px] shrink-0 rounded-full" />
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate text-[15px] font-bold leading-5 text-[#191f28] font-['Qling_Noto_Sans_KR']">나</span>
        <span className="mt-0.5 block truncate text-[11.5px] font-normal leading-[15px] text-[#8b95a1] font-['Qling_Noto_Sans_KR']">
          상위 {viewer.percentile}% · {mode === 'monthly' ? '이번 달' : '누적'}
        </span>
      </span>
      <HeartCount className="shrink-0 text-[#191f28]" heartCount={viewer.heartCount} />
      <RankDelta value={viewer.rankDelta} compact />
      <img src={rankingAssetUrlByName.chevronRight} alt="" className="h-[10px] w-[5px] shrink-0" aria-hidden="true" />
    </div>
  );
}

function HeartCount({
  heartCount,
  className,
  size = 'default',
  tone = 'dark',
}: {
  readonly heartCount: number;
  readonly className?: string;
  readonly size?: 'default' | 'small';
  readonly tone?: 'dark' | 'light';
}) {
  return (
    <span className={cn(
      'inline-flex items-center overflow-hidden font-bold font-["Qling_Noto_Sans_KR"]',
      size === 'small' ? 'gap-1 text-[13px] leading-[17px]' : 'gap-[5px] text-[15px] leading-5',
      className,
    )}>
      <img
        src={tone === 'light' ? rankingAssetUrlByName.heartLight : rankingAssetUrlByName.heart}
        alt=""
        className={cn('shrink-0', size === 'small' ? 'h-3 w-[13px]' : 'h-[13.3px] w-[14px]')}
        aria-hidden="true"
      />
      <span>{heartCount}</span>
    </span>
  );
}

function RankDelta({
  value,
  compact = false,
}: {
  readonly value: number;
  readonly compact?: boolean;
}) {
  if (value === 0) {
    return <span className={cn('shrink-0 text-center text-[13px] font-bold leading-[17px] text-[#c5ccd3]', compact ? 'w-6' : 'w-9')}>–</span>;
  }

  const isUp = value > 0;
  return (
    <span className={cn(
      'inline-flex h-4 shrink-0 items-center justify-end gap-0.5 overflow-hidden text-right text-[11px] font-bold leading-[14px] font-["Qling_Noto_Sans_KR"]',
      compact ? '' : 'w-9',
      isUp ? 'text-[#f2664b]' : 'text-[#3182f6]',
    )}>
      <img
        src={isUp ? rankingAssetUrlByName.rankUp : rankingAssetUrlByName.rankDown}
        alt=""
        className="h-[7px] w-[10px] shrink-0"
        aria-hidden="true"
      />
      <span>{Math.abs(value)}</span>
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="absolute left-[177px] top-[453px] h-10 w-10" role="status" aria-label="순위를 불러오는 중">
      <span className="absolute inset-0 rounded-full border-[3px] border-[#d9d5ca]" />
      <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#ff8b3d] border-r-[#ff8b3d]" />
    </div>
  );
}

function emptyEntry(rank: number): RankingDisplayEntry {
  return {
    rank,
    uid: `empty-${rank}`,
    nickname: '-',
    heartCount: 0,
    profileColor: DEFAULT_PROFILE_COLOR,
    replyCount: 0,
    adoptedCount: 0,
    rankDelta: 0,
  };
}
