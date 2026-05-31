import type express from 'express';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { createRequireActiveFirebaseAuth, type ActiveAuthenticatedRequest } from './auth';
import { getRankingsOnServer } from '../services/ranking/server';

export function registerRankingRoutes(app: express.Express, deps: {
  readonly db: Firestore | null;
  readonly auth: Auth;
  readonly getRankings?: typeof getRankingsOnServer;
}): void {
  if (!deps.db) {
    app.get('/api/rankings', (_req, res) => {
      res.status(500).json({
        error: {
          code: 'firebase_unavailable',
          message: 'Firebase Admin is not initialized.',
        },
      });
    });
    return;
  }

  const getRankings = deps.getRankings ?? getRankingsOnServer;
  app.get(
    '/api/rankings',
    createRequireActiveFirebaseAuth({ auth: deps.auth, db: deps.db }),
    async (req, res) => {
      try {
        const authReq = req as ActiveAuthenticatedRequest;
        res.status(200).json(await getRankings({
          db: deps.db as Firestore,
          viewerUid: authReq.auth.uid,
        }));
      } catch (error) {
        console.error('Server rankings failed:', error);
        res.status(500).json({
          error: {
            code: 'rankings_failed',
            message: '순위를 불러오는 중 문제가 발생했습니다.',
          },
        });
      }
    }
  );
}
