import type { User } from 'firebase/auth';
import { useRankings } from '../../services/ranking/useRankings';
import { RankingScreen } from './RankingScreen';

export function RankingContainer({
  user,
  onOpenMyPage,
}: {
  readonly user: User | null;
  readonly onOpenMyPage: () => void;
}) {
  const { rankings, isLoadingRankings, rankingError } = useRankings({ user });

  return (
    <RankingScreen
      state={
        isLoadingRankings
          ? { status: 'loading' }
          : rankingError
            ? { status: 'error', message: rankingError }
            : {
                status: 'ready',
                monthly: rankings.monthly,
                total: rankings.total,
                season: rankings.season,
              }
      }
      onOpenMyPage={onOpenMyPage}
    />
  );
}
