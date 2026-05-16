import type { User } from 'firebase/auth';
import { usePrdAnswerFeed } from './usePrdAnswerFeed';
import type {
  HomeWorryFeedLetter,
  HomeWorryFeedProfile,
} from './types';

export function useHomeWorryFeed(params: {
  profile: HomeWorryFeedProfile | null;
  user: User | null;
  refreshKey?: number;
}): {
  feedWorries: HomeWorryFeedLetter[];
  feedStatus: 'idle' | 'loading' | 'ready' | 'error';
  feedError: string | null;
} {
  const { prdFeedWorries, prdFeedStatus, prdFeedError } = usePrdAnswerFeed(params);
  return {
    feedWorries: prdFeedWorries,
    feedStatus: prdFeedStatus,
    feedError: prdFeedError,
  };
}
