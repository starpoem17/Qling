import type { ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import { ErrorState, FigmaCanvasFrame, profileImageUrlForColor } from '../shared/ui';
import type {
  RankingDisplayEntry,
  RankingDisplayPeriod,
  RankingMode,
  RankingScreenProps,
  ViewerRankingDisplayEntry,
} from './contract';

const rankingTabViewportHeight = 'var(--qling-tab-viewport-height)';
const rankingTopSafeOffset = 'min(var(--qling-space-safe-top), 14px)';
const rankingHeroHeight = `calc(${rankingTopSafeOffset} + 406px)`;
const rankingPodiumTop = `calc(${rankingTopSafeOffset} + 326px)`;
const rankingTitleTop = 'calc(var(--qling-space-safe-top) + 30px)';
const rankingSeasonLabelTop = 'calc(var(--qling-space-safe-top) + 64px)';
const rankingSegmentedControlTop = 'calc(var(--qling-space-safe-top) + 88px)';
const rankingSegmentedControlHeight = 44;
const rankingSegmentToCrownGap = 24;
const rankingFirstCrownTop = `calc(${rankingTopSafeOffset} + 170px)`;
const rankingTopGraphicMinimumOffset = 12;
const rankingTopGraphicOffset = `max(${rankingTopGraphicMinimumOffset}px, calc(${rankingSegmentedControlTop} + ${rankingSegmentedControlHeight}px + ${rankingSegmentToCrownGap}px - ${rankingFirstCrownTop}))`;
const rankingSheetMinimumTop = 430;
const rankingThirdPodiumNumberBottom = 75;
const rankingPodiumToSheetGap = 4;
const rankingSheetTop = `max(${rankingSheetMinimumTop}px, calc(${rankingTopGraphicOffset} + ${rankingPodiumTop} + ${rankingThirdPodiumNumberBottom}px + ${rankingPodiumToSheetGap}px))`;
const viewerRankCardTop = `calc(${rankingTabViewportHeight} - 79px)`;
const rankingSheetReadyHeight = `max(372px, calc(${rankingTabViewportHeight} - ${rankingSheetTop}))`;
const rankingSheetEmptyTopWithViewer = `max(8px, calc((${viewerRankCardTop} - ${rankingSheetTop}) / 2 - 8px))`;
const qlingNotoSansKrStyle = { fontFamily: '"Qling Noto Sans KR"' } as const;

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
  myPageIcon: new URL('../../../assets/reply/my_page_icon.svg', import.meta.url).href,
} as const;

export function RankingScreen(props: RankingScreenProps) {
  const [mode, setMode] = useState<RankingMode>('monthly');

  if (props.state.status === 'loading') {
    return (
      <RankingFrame>
        <RankingHero
          mode={mode}
          onChange={setMode}
          onOpenMyPage={props.onOpenMyPage}
        />
        <LoadingPodium />
        <RankingSheet loading />
      </RankingFrame>
    );
  }

  if (props.state.status === 'error') {
    return (
      <RankingFrame>
        <RankingHero
          mode={mode}
          onChange={setMode}
          onOpenMyPage={props.onOpenMyPage}
        />
        <RankingSheet errorMessage={props.state.message} />
      </RankingFrame>
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
      className="-mx-[var(--qling-space-shell-x)] h-[var(--qling-tab-viewport-height)] overflow-hidden bg-[#ff8b3d] font-['Qling_Noto_Sans_KR']"
    >
      <FigmaCanvasFrame className="max-w-[480px]" data-measure="ranking-responsive-canvas">
        <div
          className="relative h-full min-h-0 w-full max-w-[480px] shrink-0 overflow-hidden bg-[#ff8b3d]"
          data-measure="ranking-screen"
        >
          {children}
        </div>
      </FigmaCanvasFrame>
    </section>
  );
}

function RankingHero({
  mode,
  seasonLabel = null,
  onChange,
  onOpenMyPage,
}: {
  readonly mode: RankingMode;
  readonly seasonLabel?: string | null;
  readonly onChange: (mode: RankingMode) => void;
  readonly onOpenMyPage: () => void;
}) {
  return (
    <div className="absolute left-0 top-0 w-full bg-[#ff8b3d] text-white" style={{ height: rankingHeroHeight }}>
      <h1 className="absolute left-6 text-[24px] font-black leading-[31px] font-['Qling_Noto_Sans_KR_Black']" style={{ top: rankingTitleTop }}>
        랭킹
      </h1>
      {seasonLabel && (
        <p className="absolute left-6 text-[12px] font-medium leading-4 opacity-85 font-['Qling_Noto_Sans_KR']" style={{ top: rankingSeasonLabelTop }}>
          {seasonLabel}
        </p>
      )}
      <button
        type="button"
        aria-label="마이페이지 열기"
        onClick={onOpenMyPage}
        className="absolute right-[17px] top-[calc(var(--qling-space-safe-top)+21px)] h-[49px] w-[49px] rounded-full transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <img
          src={rankingAssetUrlByName.myPageIcon}
          alt=""
          aria-hidden="true"
          className="absolute left-3 top-3 h-[25px] w-[25px]"
          draggable={false}
        />
      </button>
      <SegmentedControl mode={mode} onChange={onChange} />
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
    <div className="absolute left-1/2 h-11 w-[236px] -translate-x-1/2 rounded-full bg-white/20" style={{ top: rankingSegmentedControlTop }} data-measure="ranking-segmented-outer">
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
        style={qlingNotoSansKrStyle}
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
        style={qlingNotoSansKrStyle}
        data-measure="ranking-segmented-total"
      >
        누적 순위
      </button>
    </div>
  );
}

function TopRankings({ period }: { readonly period: RankingDisplayPeriod }) {
  const topEntries = period.entries.slice(0, 3);

  return (
    <div className="absolute left-1/2 w-[393px] -translate-x-1/2" style={{ top: rankingTopGraphicOffset }} data-measure="ranking-top-layer">
      <TopRank entry={topEntries[0] ?? null} place="first" />
      <TopRank entry={topEntries[1] ?? null} place="second" />
      <TopRank entry={topEntries[2] ?? null} place="third" />
      <Podium topOffset={rankingPodiumTop} />
    </div>
  );
}

function TopRank({
  entry,
  place,
}: {
  readonly entry: RankingDisplayEntry | null;
  readonly place: 'first' | 'second' | 'third';
}) {
  const layout = {
    first: {
      avatar: 'left-[163px] top-[calc(min(var(--qling-space-safe-top),14px)+200px)] h-[69px] w-[69px]',
      crown: 'left-[177px] top-[calc(min(var(--qling-space-safe-top),14px)+170px)] h-6 w-[42px]',
      crownUrl: rankingAssetUrlByName.crownFirst,
      name: 'left-[136px] top-[calc(min(var(--qling-space-safe-top),14px)+274px)] w-[120px] text-[15px] leading-5',
      hearts: 'left-[136px] top-[calc(min(var(--qling-space-safe-top),14px)+296px)] w-[120px]',
      ellipse: 'left-[171px] top-[calc(min(var(--qling-space-safe-top),14px)+252px)] h-[23px] w-[53px]',
      ellipseUrl: rankingAssetUrlByName.bigEllipse,
    },
    second: {
      avatar: 'left-[50px] top-[calc(min(var(--qling-space-safe-top),14px)+230px)] h-[52px] w-[52px]',
      crown: 'left-[61px] top-[calc(min(var(--qling-space-safe-top),14px)+209px)] h-[17px] w-[30px]',
      crownUrl: rankingAssetUrlByName.crownSecond,
      name: 'left-[16px] top-[calc(min(var(--qling-space-safe-top),14px)+290px)] w-[120px] text-[13px] leading-[17px]',
      hearts: 'left-[16px] top-[calc(min(var(--qling-space-safe-top),14px)+312px)] w-[120px]',
      ellipse: 'left-[55px] top-[calc(min(var(--qling-space-safe-top),14px)+269px)] h-[18px] w-[42px]',
      ellipseUrl: rankingAssetUrlByName.smallEllipse,
    },
    third: {
      avatar: 'left-[289px] top-[calc(min(var(--qling-space-safe-top),14px)+245px)] h-[52px] w-[52px]',
      crown: 'left-[301px] top-[calc(min(var(--qling-space-safe-top),14px)+223px)] h-[17px] w-[30px]',
      crownUrl: rankingAssetUrlByName.crownThird,
      name: 'left-[255px] top-[calc(min(var(--qling-space-safe-top),14px)+305px)] w-[120px] text-[13px] leading-[17px]',
      hearts: 'left-[255px] top-[calc(min(var(--qling-space-safe-top),14px)+327px)] w-[120px]',
      ellipse: 'left-[294px] top-[calc(min(var(--qling-space-safe-top),14px)+284px)] h-[18px] w-[42px]',
      ellipseUrl: rankingAssetUrlByName.smallEllipse,
    },
  };
  const item = layout[place];

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-10 w-[393px] text-center text-white" style={{ height: rankingHeroHeight }} data-measure={`ranking-top-${place}`}>
      <img src={item.ellipseUrl} alt="" aria-hidden="true" className={cn('absolute block max-w-none', item.ellipse)} />
      <img src={item.crownUrl} alt="" className={cn('absolute block max-w-none', item.crown)} />
      {entry && (
        <img
          src={profileImageUrlForColor(entry.profileColor)}
          alt=""
          className={cn('absolute max-w-none rounded-full', item.avatar)}
          data-measure={`ranking-profile-${place}`}
        />
      )}
      <div className={cn('absolute truncate font-bold', item.name)} style={qlingNotoSansKrStyle}>{entry?.nickname || '-'}</div>
      <HeartCount className={cn('absolute justify-center text-white', item.hearts)} heartCount={entry?.heartCount ?? '-'} size="small" tone="light" />
    </div>
  );
}

function LoadingPodium() {
  return (
    <div className="absolute left-1/2 w-[393px] -translate-x-1/2" style={{ top: rankingTopGraphicOffset }} data-measure="ranking-top-layer">
      <Podium topOffset={rankingPodiumTop} />
    </div>
  );
}

function Podium({ topOffset }: { readonly topOffset: number | string }) {
  return (
    <div className="absolute left-0 h-[100px] w-full" style={{ top: typeof topOffset === 'number' ? `${topOffset}px` : topOffset }} aria-hidden="true">
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
  errorMessage,
}: {
  readonly period?: RankingDisplayPeriod;
  readonly loading?: boolean;
  readonly errorMessage?: string;
}) {
  const rows = period?.entries.slice(3, 10) ?? [];
  const hasViewerCard = Boolean(period?.viewer);
  const sheetStyle = { top: rankingSheetTop, height: rankingSheetReadyHeight };
  return (
    <section
      className={cn(
        'absolute left-0 w-full overflow-hidden rounded-t-[26px] bg-white shadow-[0_-5px_8px_rgb(128_87_33/0.1)]',
      )}
      style={sheetStyle}
    >
      {loading ? (
        <FigmaTabLoading label="순위를 불러오는 중" className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      ) : errorMessage ? (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
          <ErrorState title="순위를 불러오지 못했어요" message={errorMessage} />
        </div>
      ) : (
        <>
          <h2 className="absolute left-5 top-5 text-[14px] font-bold leading-[18px] text-[#191f28] font-['Qling_Noto_Sans_KR']">
            전체 랭킹
          </h2>
          <div className="absolute right-5 top-[22px] w-[120px] text-right text-[12px] font-medium leading-4 text-[#8b95a1] font-['Qling_Noto_Sans_KR']">
            받은 ♥ 기준
          </div>
          {rows.length > 0 ? (
            <ol
              className="absolute bottom-0 left-0 top-12 flex w-full flex-col overflow-y-auto px-5 pb-[94px] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              data-measure="ranking-scroll-list"
            >
              {rows.map(entry => <RankingRow key={entry.uid} entry={entry} />)}
            </ol>
          ) : (
            <div
              className="absolute left-0 w-full text-center text-[14px] font-medium text-[#8b95a1]"
              style={{ top: hasViewerCard ? rankingSheetEmptyTopWithViewer : '156px' }}
            >
              아직 순위가 없어요.
            </div>
          )}
        </>
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
        <span className="block truncate text-[15px] font-medium leading-5 text-[#191f28]" style={qlingNotoSansKrStyle}>{entry.nickname}</span>
        <span className="mt-0.5 block truncate text-[11.5px] font-medium leading-[15px] text-[#8b95a1]" style={qlingNotoSansKrStyle}>
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
  const hasNoHearts = viewer.heartCount === 0;
  const rankLabel = hasNoHearts ? '-' : String(viewer.rank);
  const percentileLabel = hasNoHearts ? '-' : String(viewer.percentile);

  return (
    <div
      className="absolute left-4 right-4 flex h-[70px] items-center gap-[18px] overflow-hidden rounded-[18px] bg-[#ffe3cb] py-[11px] pl-[14px] pr-4 text-left shadow-[0_8px_22px_rgb(128_87_33/0.16)]"
      style={{ top: viewerRankCardTop }}
      aria-label={hasNoHearts ? '내 순위 -' : `내 순위 ${viewer.rank}위`}
    >
      <span className="flex h-[46px] w-[46px] shrink-0 flex-col items-center justify-center rounded-[13px] bg-[#34c759] text-white shadow-[2px_3px_4px_rgb(0_0_0/0.25)]">
        <span className="text-[8.5px] font-medium leading-[11px] font-['Qling_Noto_Sans_KR']">내 순위</span>
        <span className="text-[19px] font-black leading-[25px] font-['Qling_Noto_Sans_KR_Black']">{rankLabel}</span>
      </span>
      <img src={profileImageUrlForColor(viewer.profileColor)} alt="" className="h-[38px] w-[38px] shrink-0 rounded-full" />
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate text-[15px] font-bold leading-5 text-[#191f28] font-['Qling_Noto_Sans_KR']">나</span>
        <span className="mt-0.5 block truncate text-[11.5px] font-normal leading-[15px] text-[#8b95a1] font-['Qling_Noto_Sans_KR']">
          상위 {percentileLabel}% · {mode === 'monthly' ? '이번 달' : '누적'}
        </span>
      </span>
      <HeartCount className="shrink-0 text-[#191f28]" heartCount={viewer.heartCount} />
      <RankDelta value={viewer.rankDelta} compact />
    </div>
  );
}

function HeartCount({
  heartCount,
  className,
  size = 'default',
  tone = 'dark',
}: {
  readonly heartCount: number | string;
  readonly className?: string;
  readonly size?: 'default' | 'small';
  readonly tone?: 'dark' | 'light';
}) {
  return (
    <span className={cn(
      'inline-flex items-center overflow-hidden font-bold',
      size === 'small' ? 'gap-1 text-[13px] leading-[17px]' : 'gap-[5px] text-[15px] leading-5',
      className,
    )} style={qlingNotoSansKrStyle}>
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
    return <span className={cn('shrink-0 text-center text-[13px] font-bold leading-[17px] text-[#c5ccd3]', compact ? 'w-6' : 'w-9')} style={qlingNotoSansKrStyle}>–</span>;
  }

  const isUp = value > 0;
  return (
    <span className={cn(
      'inline-flex h-4 shrink-0 items-center justify-end gap-0.5 overflow-hidden text-right text-[11px] font-bold leading-[14px]',
      compact ? '' : 'w-9',
      isUp ? 'text-[#f2664b]' : 'text-[#3182f6]',
    )} style={qlingNotoSansKrStyle}>
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
