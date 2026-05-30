import { useMemo, useState } from 'react';
import defaultProfileUrl from '../../../assets/profile/default_profile.svg';
import { cn } from '../../lib/utils';
import { ErrorState, LoadingState } from '../shared/ui';
import type { RankingDisplayEntry, RankingMode, RankingScreenProps } from './contract';

export function RankingScreen(props: RankingScreenProps) {
  const [mode, setMode] = useState<RankingMode>('monthly');
  const entries = props.state.status === 'ready'
    ? (mode === 'monthly' ? props.state.monthly : props.state.total)
    : [];
  const displayEntries = useMemo(() => entries.length > 0 ? entries : [], [entries]);

  if (props.state.status === 'loading') {
    return (
      <div className="-mx-[var(--qling-space-shell-x)] -mt-6 min-h-[calc(100dvh-var(--qling-space-nav-height))] bg-[#ffd3a8] px-4 pt-[62px]">
        <LoadingState title="순위를 불러오고 있어요" />
      </div>
    );
  }

  if (props.state.status === 'error') {
    return (
      <div className="-mx-[var(--qling-space-shell-x)] -mt-6 min-h-[calc(100dvh-var(--qling-space-nav-height))] bg-[#ffd3a8] px-4 pt-[62px]">
        <ErrorState title="순위를 불러오지 못했어요" message={props.state.message} />
      </div>
    );
  }

  const topEntries = [1, 2, 3].map(rank => displayEntries.find(entry => entry.rank === rank) ?? {
    rank,
    uid: `empty-top-${rank}`,
    nickname: '-',
    heartCount: 0,
  });
  const lowerEntries = displayEntries.filter(entry => entry.rank >= 4).slice(0, 7);

  return (
    <section
      aria-label="순위"
      className="-mx-[var(--qling-space-shell-x)] -mt-6 min-h-[calc(100dvh-var(--qling-space-nav-height))] overflow-hidden bg-[#fff1d1] qling-figma-font"
    >
      <div
        className="relative mx-auto min-h-[772px] w-[393px] bg-[#fff1d1]"
        data-measure="ranking-screen"
      >
        <div className="absolute left-0 top-0 h-[370px] w-full bg-[linear-gradient(180deg,#ff8b3d_0%,#fff1d1_100%)]" />
        <SegmentedControl mode={mode} onChange={setMode} />
        <TopRank entry={topEntries[0]} place="first" />
        <TopRank entry={topEntries[1]} place="second" />
        <TopRank entry={topEntries[2]} place="third" />
        <Podium />
        <div className="absolute left-0 right-0 top-[396px] h-[456px] rounded-t-[45px] bg-[#fff1d1] pb-7 pt-[21px]">
          <RankingRows entries={lowerEntries} />
        </div>
      </div>
    </section>
  );
}

function SegmentedControl({
  mode,
  onChange,
}: {
  readonly mode: RankingMode;
  readonly onChange: (mode: RankingMode) => void;
}) {
  return (
    <div
      className="absolute top-[62px] h-[33px] w-[calc(100%*224/393)] rounded-full bg-[#f58337]"
      style={{ left: 'calc(100% * 85 / 393)' }}
      data-measure="ranking-segmented-outer"
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        aria-pressed={mode === 'monthly'}
        className={cn(
          'absolute left-[10px] top-1 h-[25px] w-[102px] whitespace-nowrap rounded-full text-center text-[10px] font-semibold leading-3 transition-colors focus:outline-none focus:ring-2 focus:ring-white',
          mode === 'monthly' ? 'bg-[#ffa462] text-white' : 'text-white',
        )}
        data-measure="ranking-segmented-monthly"
      >
        이 달의 순위
      </button>
      <button
        type="button"
        onClick={() => onChange('total')}
        aria-pressed={mode === 'total'}
        className={cn(
          'absolute left-[112px] top-1 h-[25px] w-[102px] whitespace-nowrap rounded-full text-center text-[10px] font-semibold leading-3 transition-colors focus:outline-none focus:ring-2 focus:ring-white',
          mode === 'total' ? 'bg-[#ffa462] text-white' : 'text-white',
        )}
        data-measure="ranking-segmented-total"
      >
        누적 순위
      </button>
    </div>
  );
}

function TopRank({
  entry,
  place,
}: {
  readonly entry: RankingDisplayEntry;
  readonly place: 'first' | 'second' | 'third';
}) {
  const classNameByPlace = {
    first: 'top-[141px]',
    second: 'top-[171px]',
    third: 'top-[193px]',
  };
  const leftByPlace = {
    first: 'calc(100% * 157 / 393)',
    second: 'calc(100% * 29 / 393)',
    third: 'calc(100% * 284 / 393)',
  };

  return (
    <div
      className={cn('absolute z-10 h-[135px] w-20 text-center text-[#1a1a1a]', classNameByPlace[place])}
      style={{ left: leftByPlace[place] }}
      data-measure={`ranking-top-${place}`}
    >
      <div className="h-6 text-[20px] font-bold leading-6 qling-figma-font-strong">
        <span className="mr-1 text-[#ea4335]">♥</span>
        {entry.heartCount}
      </div>
      <div className="h-[18px] truncate text-[15px] font-bold leading-[18px] qling-figma-font-strong">{entry.nickname}</div>
      <img
        src={defaultProfileUrl}
        alt=""
        className="absolute left-0 top-[55px] h-20 w-20 rounded-full"
        data-measure={`ranking-profile-${place}`}
      />
    </div>
  );
}

function Podium() {
  return (
    <div className="absolute inset-x-0 top-[281px] h-[168px]" aria-hidden="true">
      <div className="absolute left-0 top-[39px] h-[128.75px] w-[calc(100%*131/393)] bg-[#ff8b3d]" />
      <div className="absolute top-[10px] h-[158.02px] w-[calc(100%*131/393)] bg-[#ff8b3d]" style={{ left: 'calc(100% * 131 / 393)' }} />
      <div className="absolute top-[58.82px] h-[109.18px] w-[calc(100%*131/393)] bg-[#ff8b3d]" style={{ left: 'calc(100% * 262 / 393)' }} />
      <div className="absolute left-0 top-[29.6px] h-[9.66px] w-[calc(100%*131/393)] bg-[#ffd2a5] [clip-path:polygon(0_100%,100%_0,100%_100%,0_100%)]" />
      <div className="absolute top-0 h-[9.98px] w-[calc(100%*131/393)] bg-[#ffd2a5] [clip-path:polygon(0_100%,50%_0,100%_100%,0_100%)]" style={{ left: 'calc(100% * 131 / 393)' }} />
      <div className="absolute top-[48.75px] h-[10.08px] w-[calc(100%*131/393)] bg-[#ffd2a5] [clip-path:polygon(0_0,100%_100%,0_100%)]" style={{ left: 'calc(100% * 262 / 393)' }} />
      <span className="absolute top-[50px] text-[56px] font-extrabold leading-[64px] text-[#f2d7c3] qling-figma-font-strong" style={{ left: 'calc(100% * 49 / 393)' }}>2</span>
      <span className="absolute top-[18px] text-[56px] font-extrabold leading-[64px] text-[#f2d7c3] qling-figma-font-strong" style={{ left: 'calc(100% * 183 / 393)' }}>1</span>
      <span className="absolute top-[80px] text-[56px] font-extrabold leading-[64px] text-[#f2d7c3] qling-figma-font-strong" style={{ left: 'calc(100% * 312 / 393)' }}>3</span>
    </div>
  );
}

function RankingRows({ entries }: { readonly entries: readonly RankingDisplayEntry[] }) {
  const rows = entries.length > 0
    ? entries
    : Array.from({ length: 7 }, (_, index) => ({
      rank: index + 4,
      uid: `empty-${index}`,
      nickname: '',
      heartCount: 0,
    }));

  return (
    <ol className="relative h-[333px]">
      {rows.map((entry, index) => (
        <li
          key={entry.uid}
          className="absolute left-0 h-[33px] w-full text-[#1a1a1a]"
          style={{ top: `${index * 50}px` }}
        >
          <span className="absolute top-0 w-[26px] text-center text-[16px] font-extrabold leading-[30px] qling-figma-font-strong" style={{ left: 'calc(100% * 32 / 393)' }} data-measure={`ranking-row-${entry.rank}-rank`}>
            {entry.rank}
          </span>
          <span className="absolute top-0 w-[204px] truncate text-center text-[16px] font-extrabold leading-7 qling-figma-font-strong" style={{ left: 'calc(100% * 96 / 393)' }} data-measure={`ranking-row-${entry.rank}-nickname`}>
            {entry.nickname || '-'}
          </span>
          <span className="absolute top-[3px] w-20 text-center text-[14px] font-bold leading-[17px] text-[#ea4335] qling-figma-font-strong" style={{ left: 'calc(100% * 305 / 393)' }} data-measure={`ranking-row-${entry.rank}-heart`}>
            <span className="mr-1">♥</span>
            {entry.heartCount}
          </span>
        </li>
      ))}
    </ol>
  );
}
