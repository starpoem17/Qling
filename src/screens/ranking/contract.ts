export type RankingMode = 'monthly' | 'total';

export type RankingDisplayEntry = {
  readonly rank: number;
  readonly uid: string;
  readonly nickname: string;
  readonly heartCount: number;
  readonly profileColor: string;
  readonly replyCount: number;
  readonly adoptedCount: number;
  readonly rankDelta: number;
};

export type ViewerRankingDisplayEntry = RankingDisplayEntry & {
  readonly percentile: number;
};

export type RankingDisplayPeriod = {
  readonly entries: readonly RankingDisplayEntry[];
  readonly viewer: ViewerRankingDisplayEntry | null;
};

export type RankingScreenState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | {
      readonly status: 'ready';
      readonly monthly: RankingDisplayPeriod;
      readonly total: RankingDisplayPeriod;
      readonly season: {
        readonly monthLabel: string;
        readonly daysUntilMonthEnd: number;
      };
    };

export type RankingScreenProps = {
  readonly state: RankingScreenState;
  readonly onOpenMyPage: () => void;
};
