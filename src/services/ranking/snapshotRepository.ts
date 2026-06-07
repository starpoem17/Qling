import type { Firestore } from 'firebase-admin/firestore';
import { rankingResponseFromMaterializedSnapshot } from './policy';
import type { MaterializedRankingSnapshot, RankingEntry, RankingResponse } from './types';

export const RANKING_SNAPSHOT_COLLECTION = 'rankingSnapshots';
export const RANKING_SNAPSHOT_CURRENT_ID = 'current';

export type RankingSnapshotDoc = {
  readonly snapshot: MaterializedRankingSnapshot;
  readonly generatedAt: unknown;
  readonly source: 'scheduled_rebuild' | 'manual_rebuild';
  readonly schemaVersion: 1;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRankingEntry(value: unknown): value is RankingEntry {
  return isObject(value)
    && typeof value.rank === 'number'
    && typeof value.uid === 'string'
    && typeof value.nickname === 'string'
    && typeof value.heartCount === 'number'
    && typeof value.profileColor === 'string'
    && typeof value.replyCount === 'number'
    && typeof value.adoptedCount === 'number'
    && typeof value.rankDelta === 'number';
}

function isMaterializedRankingSnapshot(value: unknown): value is MaterializedRankingSnapshot {
  if (!isObject(value)) return false;
  const monthly = value.monthly;
  const total = value.total;
  const season = value.season;
  return isObject(monthly)
    && Array.isArray(monthly.allEntries)
    && monthly.allEntries.every(isRankingEntry)
    && isObject(total)
    && Array.isArray(total.allEntries)
    && total.allEntries.every(isRankingEntry)
    && isObject(season)
    && typeof season.monthLabel === 'string'
    && typeof season.daysUntilMonthEnd === 'number'
    && typeof value.activeUserCount === 'number';
}

export async function readCurrentRankingSnapshot(params: {
  readonly db: Firestore;
  readonly viewerUid?: string;
}): Promise<RankingResponse | null> {
  const snap = await params.db
    .collection(RANKING_SNAPSHOT_COLLECTION)
    .doc(RANKING_SNAPSHOT_CURRENT_ID)
    .get();
  const data = snap.data();
  if (!snap.exists || !isMaterializedRankingSnapshot(data?.snapshot)) return null;
  return rankingResponseFromMaterializedSnapshot(data.snapshot, params.viewerUid);
}

export async function writeCurrentRankingSnapshot(params: {
  readonly db: Firestore;
  readonly snapshot: MaterializedRankingSnapshot;
  readonly generatedAt: Date;
  readonly source?: RankingSnapshotDoc['source'];
}): Promise<void> {
  await params.db
    .collection(RANKING_SNAPSHOT_COLLECTION)
    .doc(RANKING_SNAPSHOT_CURRENT_ID)
    .set({
      snapshot: params.snapshot,
      generatedAt: params.generatedAt,
      source: params.source ?? 'manual_rebuild',
      schemaVersion: 1,
    } satisfies RankingSnapshotDoc);
}
