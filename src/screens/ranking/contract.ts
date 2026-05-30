export type RankingMode = 'monthly' | 'total';

export type RankingDisplayEntry = {
  readonly rank: number;
  readonly uid: string;
  readonly nickname: string;
  readonly heartCount: number;
};

export type RankingScreenState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly monthly: readonly RankingDisplayEntry[]; readonly total: readonly RankingDisplayEntry[] };

export type RankingScreenProps = {
  readonly state: RankingScreenState;
};
