import type { Firestore } from 'firebase-admin/firestore';
import { getMaterializedRankingsByFullScan } from './server';
import { writeCurrentRankingSnapshot } from './snapshotRepository';
import type { MaterializedRankingSnapshot } from './types';

export type RankingSnapshotRebuildResult = {
  readonly status: 'completed';
  readonly generatedAt: string;
  readonly monthlyEntryCount: number;
  readonly totalEntryCount: number;
};

export async function rebuildCurrentRankingSnapshot(params: {
  readonly db: Firestore;
  readonly now?: Date;
  readonly source?: 'scheduled_rebuild' | 'manual_rebuild';
  readonly getRankings?: (params: { readonly db: Firestore; readonly now?: Date }) => Promise<MaterializedRankingSnapshot>;
}): Promise<RankingSnapshotRebuildResult> {
  const generatedAt = params.now ?? new Date();
  const getRankings = params.getRankings ?? getMaterializedRankingsByFullScan;
  const snapshot = await getRankings({
    db: params.db,
    now: generatedAt,
  });

  await writeCurrentRankingSnapshot({
    db: params.db,
    snapshot,
    generatedAt,
    source: params.source ?? 'manual_rebuild',
  });

  return {
    status: 'completed',
    generatedAt: generatedAt.toISOString(),
    monthlyEntryCount: snapshot.monthly.allEntries.filter(entry => entry.heartCount > 0).slice(0, 10).length,
    totalEntryCount: snapshot.total.allEntries.filter(entry => entry.heartCount > 0).slice(0, 10).length,
  };
}
