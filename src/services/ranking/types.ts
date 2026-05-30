export type RankingEntry = {
  readonly rank: number;
  readonly uid: string;
  readonly nickname: string;
  readonly heartCount: number;
};

export type RankingResponse = {
  readonly monthly: RankingEntry[];
  readonly total: RankingEntry[];
};

export type RankingUserDoc = {
  readonly uid: string;
  readonly nickname?: unknown;
  readonly helpedCount?: unknown;
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
