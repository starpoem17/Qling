import type express from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { requireInternalJobSecret } from './internalAuth';
import { rebuildCurrentRankingSnapshot } from '../services/ranking/snapshotJob';

export function registerRankingSnapshotRoutes(app: express.Express, deps: {
  readonly db: Firestore | null;
  readonly rebuildSnapshot?: typeof rebuildCurrentRankingSnapshot;
}): void {
  if (!deps.db) {
    app.post('/api/internal/ranking-snapshots/rebuild', requireInternalJobSecret, (_req, res) => {
      res.status(500).json({
        error: {
          code: 'firebase_unavailable',
          message: 'Firebase Admin is not initialized.',
        },
      });
    });
    return;
  }

  const rebuildSnapshot = deps.rebuildSnapshot ?? rebuildCurrentRankingSnapshot;
  app.post('/api/internal/ranking-snapshots/rebuild', requireInternalJobSecret, async (_req, res) => {
    try {
      res.status(200).json(await rebuildSnapshot({
        db: deps.db as Firestore,
        source: 'manual_rebuild',
      }));
    } catch (error) {
      console.error('Ranking snapshot rebuild failed:', error);
      res.status(500).json({
        error: {
          code: 'ranking_snapshot_rebuild_failed',
          message: '랭킹 스냅샷을 갱신하는 중 문제가 발생했습니다.',
        },
      });
    }
  });
}
