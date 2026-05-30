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
      className="-mx-[var(--qling-space-shell-x)] -mt-6 min-h-[calc(100dvh-var(--qling-space-nav-height))] overflow-hidden bg-[#fff1d1]"
    >
      <div className="relative mx-auto min-h-[772px] w-full max-w-[393px] bg-[#fff1d1]">
        <div className="absolute left-0 top-0 h-[370px] w-full bg-[linear-gradient(180deg,#ff8b3d_0%,#fff1d1_100%)]" />
        <SegmentedControl mode={mode} onChange={setMode} />
        <TopRank entry={topEntries[0]} place="first" />
        <TopRank entry={topEntries[1]} place="second" />
        <TopRank entry={topEntries[2]} place="third" />
        <Podium />
        <div className="absolute left-0 right-0 top-[396px] h-[456px] rounded-t-[45px] bg-[#fff1d1] px-8 pb-7 pt-[21px]">
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
    <div className="absolute left-[85px] top-[62px] flex h-[33px] w-[224px] items-center rounded-full bg-[#f58337] p-1">
      {([
        ['monthly', '이 달의 순위'],
        ['total', '누적 순위'],
      ] as const).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={mode === value}
          className={cn(
            'h-[25px] flex-1 rounded-full text-[10px] font-semibold leading-3 transition-colors focus:outline-none focus:ring-2 focus:ring-white',
            mode === value ? 'bg-[#ffa462] text-white' : 'text-white',
          )}
        >
          {label}
        </button>
      ))}
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
    first: 'left-[157px] top-[141px]',
    second: 'left-[29px] top-[183px]',
    third: 'left-[284px] top-[205px]',
  };
  const profileTopByPlace = {
    first: 'top-[55px]',
    second: 'top-[43px]',
    third: 'top-[43px]',
  };

  return (
    <div className={cn('absolute z-10 w-20 text-center text-[#1a1a1a]', classNameByPlace[place])}>
      <div className="h-6 text-[20px] font-bold leading-6">
        <span className="mr-1 text-[#ea4335]">♥</span>
        {entry.heartCount}
      </div>
      <div className="h-[18px] truncate text-[15px] font-bold leading-[18px]">{entry.nickname}</div>
      <img
        src={defaultProfileUrl}
        alt=""
        className={cn('absolute left-0 h-20 w-20 rounded-full', profileTopByPlace[place])}
      />
    </div>
  );
}

function Podium() {
  return (
    <div className="absolute inset-x-0 top-[281px] h-[168px]" aria-hidden="true">
      <div className="absolute left-0 top-[39px] h-[128.75px] w-[131px] bg-[#ff8b3d]" />
      <div className="absolute left-[131px] top-[10px] h-[158.02px] w-[131px] bg-[#ff8b3d]" />
      <div className="absolute left-[262px] top-[58.82px] h-[109.18px] w-[131px] bg-[#ff8b3d]" />
      <div className="absolute left-0 top-[29.6px] h-[9.66px] w-[131px] bg-[#ffd2a5] [clip-path:polygon(0_100%,100%_0,100%_100%,0_100%)]" />
      <div className="absolute left-[131px] top-0 h-[9.98px] w-[131px] bg-[#ffd2a5] [clip-path:polygon(0_100%,50%_0,100%_100%,0_100%)]" />
      <div className="absolute left-[262px] top-[48.75px] h-[10.08px] w-[131px] bg-[#ffd2a5] [clip-path:polygon(0_0,100%_100%,0_100%)]" />
      <span className="absolute left-[49px] top-[50px] text-[56px] font-extrabold leading-[64px] text-[#f2d7c3]">2</span>
      <span className="absolute left-[183px] top-[18px] text-[56px] font-extrabold leading-[64px] text-[#f2d7c3]">1</span>
      <span className="absolute left-[312px] top-[80px] text-[56px] font-extrabold leading-[64px] text-[#f2d7c3]">3</span>
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
    <ol className="grid gap-[17px]">
      {rows.map(entry => (
        <li key={entry.uid} className="grid h-[33px] grid-cols-[42px_1fr_72px] items-center text-[#1a1a1a]">
          <span className="text-center text-[16px] font-extrabold leading-[30px]">{entry.rank}</span>
          <span className="truncate text-center text-[16px] font-extrabold leading-7">
            {entry.nickname || '-'}
          </span>
          <span className="justify-self-end text-[14px] font-bold leading-[17px] text-[#ea4335]">
            <span className="mr-1">♥</span>
            {entry.heartCount}
          </span>
        </li>
      ))}
    </ol>
  );
}
