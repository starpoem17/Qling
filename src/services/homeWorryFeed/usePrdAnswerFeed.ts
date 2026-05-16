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
}): {
  prdFeedWorries: HomeWorryFeedLetter[];
  prdFeedStatus: 'idle' | 'loading' | 'ready' | 'error';
  prdFeedError: string | null;
} {
  const { profile, user, refreshKey } = params;
  const [prdFeedWorries, setPrdFeedWorries] = useState<HomeWorryFeedLetter[]>([]);
  const [prdFeedStatus, setPrdFeedStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [prdFeedError, setPrdFeedError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !user) {
      setPrdFeedWorries([]);
      setPrdFeedStatus('idle');
      setPrdFeedError(null);
      return;
    }

    let isCurrent = true;
    setPrdFeedStatus('loading');
    setPrdFeedError(null);
    void fetchPrdAnswerFeedViaApi({ user }).then(result => {
      if (!isCurrent) return;
      if (result.status === 'failed') {
        console.error('Error loading PRD answer feed:', result.reason);
        setPrdFeedWorries([]);
        setPrdFeedStatus('error');
        setPrdFeedError(result.reason);
        return;
      }

      setPrdFeedWorries(
        result.items.map(adaptPrdAnswerFeedItemToHomeWorryFeedLetter)
      );
      setPrdFeedStatus('ready');
      setPrdFeedError(null);
    }).catch(error => {
      if (!isCurrent) return;
      console.error('Error loading PRD answer feed:', error);
      setPrdFeedWorries([]);
      setPrdFeedStatus('error');
      setPrdFeedError('답변 피드를 불러오지 못했습니다.');
    });

    return () => { isCurrent = false; };
  }, [profile, user, refreshKey]);

  return { prdFeedWorries, prdFeedStatus, prdFeedError };
}
