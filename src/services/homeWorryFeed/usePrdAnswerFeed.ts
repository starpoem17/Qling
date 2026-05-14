import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { fetchPrdAnswerFeedViaApi } from './apiClient';
import {
  adaptPrdAnswerFeedItemToHomeWorryFeedLetter,
} from './prdPolicy';
import type {
  HomeWorryFeedLetter,
  HomeWorryFeedProfile,
} from './types';

export function usePrdAnswerFeed(params: {
  profile: HomeWorryFeedProfile | null;
  user: User | null;
  refreshKey?: number;
}): { prdFeedWorries: HomeWorryFeedLetter[] } {
  const { profile, user, refreshKey } = params;
  const [prdFeedWorries, setPrdFeedWorries] = useState<HomeWorryFeedLetter[]>([]);

  useEffect(() => {
    if (!profile || !user) {
      setPrdFeedWorries([]);
      return;
    }

    let isCurrent = true;
    void fetchPrdAnswerFeedViaApi({ user }).then(result => {
      if (!isCurrent) return;
      if (result.status === 'failed') {
        console.error('Error loading PRD answer feed:', result.reason);
        setPrdFeedWorries([]);
        return;
      }

      setPrdFeedWorries(
        result.items.map(adaptPrdAnswerFeedItemToHomeWorryFeedLetter)
      );
    });

    return () => { isCurrent = false; };
  }, [profile, user, refreshKey]);

  return { prdFeedWorries };
}
