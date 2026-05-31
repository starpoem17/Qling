export type RankingEntry = {
  readonly rank: number;
  readonly uid: string;
  readonly nickname: string;
  readonly heartCount: number;
  readonly profileColor: string;
  readonly replyCount: number;
  readonly adoptedCount: number;
  readonly rankDelta: number;
};

export type ViewerRankingEntry = RankingEntry & {
  readonly percentile: number;
};

export type RankingPeriod = {
  readonly entries: RankingEntry[];
  readonly viewer: ViewerRankingEntry | null;
};

export type RankingResponse = {
  readonly monthly: RankingPeriod;
  readonly total: RankingPeriod;
  readonly season: {
    readonly monthLabel: string;
    readonly daysUntilMonthEnd: number;
  };
};

export type RankingUserDoc = {
  readonly uid: string;
  readonly nickname?: unknown;
  readonly helpedCount?: unknown;
  readonly profileColor?: unknown;
  readonly deleted?: unknown;
  readonly status?: unknown;
  readonly inactive?: unknown;
};

export type RankingFeedbackDoc = {
  readonly replierUid?: unknown;
  readonly type?: unknown;
  readonly helpedCountApplied?: unknown;
  readonly createdAt?: unknown;
};

export type RankingReplyDoc = {
  readonly replierUid?: unknown;
  readonly status?: unknown;
  readonly hiddenAt?: unknown;
  readonly isAiGenerated?: unknown;
  readonly createdAt?: unknown;
};
