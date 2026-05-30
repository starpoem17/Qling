import { useMemo, useState } from 'react';
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
      className="-mx-[var(--qling-space-shell-x)] -mt-6 min-h-[calc(100dvh-var(--qling-space-nav-height))] overflow-hidden bg-[#fff5eb]"
    >
      <div className="relative mx-auto min-h-[772px] w-full max-w-[var(--qling-mobile-canvas-max-width)] bg-[#fff5eb]">
        <div className="absolute inset-x-0 top-0 h-[370px] bg-[linear-gradient(180deg,#ff8b3d_0%,#ffd2a5_100%)]" />
        <SegmentedControl mode={mode} onChange={setMode} />
        <TopRank entry={topEntries[0]} place="first" />
        <TopRank entry={topEntries[1]} place="second" />
        <TopRank entry={topEntries[2]} place="third" />
        <Podium />
        <div className="absolute left-0 right-0 top-[396px] min-h-[376px] rounded-t-[40px] bg-[#fff1d1] px-8 pb-7 pt-[21px]">
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
    <div className="absolute left-1/2 top-[62px] flex h-[33px] w-[224px] -translate-x-1/2 items-center rounded-full bg-[#ff8b3d] p-1">
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
            'h-[25px] flex-1 rounded-full text-[10px] font-bold leading-3 transition-colors focus:outline-none focus:ring-2 focus:ring-white',
            mode === value ? 'bg-[#ffb374] text-white' : 'text-white',
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
    first: 'left-1/2 top-[141px] -translate-x-1/2',
    second: 'left-[17.6%] top-[171px] -translate-x-1/2',
    third: 'left-[82.4%] top-[193px] -translate-x-1/2',
  };
  const faceClassNameByPlace = {
    first: 'top-[55px]',
    second: 'top-[55px]',
    third: 'top-[55px]',
  };

  return (
    <div className={cn('absolute z-10 w-20 text-center text-[#1a1a1a]', classNameByPlace[place])}>
      <div className="text-[22px] font-extrabold leading-6">
        <span className="mr-1 text-[#f04438]">♥</span>
        {entry.heartCount}
      </div>
      <div className="mt-0 truncate text-[15px] font-extrabold leading-[18px]">{entry.nickname}</div>
      <ProfileFace className={faceClassNameByPlace[place]} />
    </div>
  );
}

function ProfileFace({ className }: { readonly className?: string }) {
  return (
    <div className={cn('absolute left-0 flex h-20 w-20 items-center justify-center rounded-full bg-[#ff8b3d]', className)}>
      <span className="relative block h-[31px] w-[43px]" aria-hidden="true">
        <span className="absolute left-0 top-0 h-[31px] w-[18px] rounded-full bg-white" />
        <span className="absolute right-0 top-0 h-[31px] w-[18px] rounded-full bg-white" />
        <span className="absolute left-[11px] top-[3px] h-[26px] w-[10px] rounded-full bg-[#1a1a1a]" />
        <span className="absolute right-[-3px] top-[3px] h-[26px] w-[10px] rounded-full bg-[#1a1a1a]" />
      </span>
    </div>
  );
}

function Podium() {
  return (
    <div className="absolute inset-x-0 top-[281px] h-[168px]" aria-hidden="true">
      <div className="absolute left-0 top-[30px] h-[138px] w-1/3 bg-[#ff8b3d]" />
      <div className="absolute left-1/3 top-0 h-[168px] w-1/3 bg-[#ff8b3d]" />
      <div className="absolute right-0 top-[49px] h-[119px] w-1/3 bg-[#ff8b3d]" />
      <div className="absolute left-0 top-[30px] h-[10px] w-1/3 bg-[#ffb370] [clip-path:polygon(0_100%,100%_0,100%_100%,0_100%)]" />
      <div className="absolute left-1/3 top-0 h-[10px] w-1/3 bg-[#ffb370] [clip-path:polygon(0_100%,50%_0,100%_100%,0_100%)]" />
      <div className="absolute right-0 top-[49px] h-[10px] w-1/3 bg-[#ffb370] [clip-path:polygon(0_0,100%_100%,0_100%)]" />
      <span className="absolute left-[49px] top-[50px] text-[54px] font-extrabold leading-[62px] text-[#fff1d1]">2</span>
      <span className="absolute left-[182px] top-[18px] text-[74px] font-extrabold leading-[86px] text-[#fff1d1]">1</span>
      <span className="absolute right-[48px] top-[58px] text-[54px] font-extrabold leading-[62px] text-[#fff1d1]">3</span>
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
        <li key={entry.uid} className="grid h-[33px] grid-cols-[42px_1fr_68px] items-center text-[#1a1a1a]">
          <span className="text-[18px] font-extrabold leading-[30px]">{entry.rank}</span>
          <span className="truncate text-[18px] font-extrabold leading-7">
            {entry.nickname || '-'}
          </span>
          <span className="justify-self-end text-[14px] font-extrabold leading-[17px] text-[#f04438]">
            <span className="mr-1">♥</span>
            {entry.heartCount}
          </span>
        </li>
      ))}
    </ol>
  );
}
