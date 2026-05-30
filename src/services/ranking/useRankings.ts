import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { fetchRankings } from './apiClient';
import type { RankingResponse } from './types';

export function useRankings(params: {
  readonly user: User | null;
}) {
  const { user } = params;
  const [rankings, setRankings] = useState<RankingResponse>({ monthly: [], total: [] });
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [rankingError, setRankingError] = useState<string | undefined>();

  useEffect(() => {
    if (!user) {
      setRankings({ monthly: [], total: [] });
      setIsLoadingRankings(false);
      setRankingError(undefined);
      return;
    }

    let cancelled = false;
    setIsLoadingRankings(true);
    setRankingError(undefined);

    fetchRankings({ getIdToken: () => user.getIdToken() })
      .then(result => {
        if (cancelled) return;
        setRankings(result);
      })
      .catch(error => {
        if (cancelled) return;
        setRankings({ monthly: [], total: [] });
        setRankingError(error instanceof Error ? error.message : '순위를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRankings(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { rankings, isLoadingRankings, rankingError };
}
