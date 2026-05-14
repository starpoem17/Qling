import type express from 'express';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { createRequireActiveFirebaseAuth, type ActiveAuthenticatedRequest } from './auth';
import { getPrdAnswerFeed } from '../services/homeWorryFeed/serverAnswerFeed';
import type { PrdAnswerFeedItem } from '../services/homeWorryFeed/types';

type AnswerFeedService = {
  getAnswerFeed(params: { uid: string }): Promise<PrdAnswerFeedItem[]>;
};

export function registerAnswerFeedRoutes(app: express.Express, deps: {
  db: Firestore | null;
  auth: Auth;
  service?: AnswerFeedService;
}): void {
  if (!deps.db) {
    app.get('/api/me/answer-feed', (_req, res) => {
      res.status(500).json({
        error: {
          code: 'firebase_unavailable',
          message: 'Firebase Admin is not initialized.',
        },
      });
    });
    return;
  }

  const service = deps.service ?? {
    getAnswerFeed: ({ uid }) => getPrdAnswerFeed({
      db: deps.db as Firestore,
      uid,
    }),
  };

  app.get(
    '/api/me/answer-feed',
    createRequireActiveFirebaseAuth({ auth: deps.auth, db: deps.db }),
    async (req, res) => {
      try {
        const authReq = req as ActiveAuthenticatedRequest;
        const items = await service.getAnswerFeed({ uid: authReq.auth.uid });
        res.status(200).json({ items });
      } catch (error) {
        console.error('Server answer feed failed:', error);
        res.status(500).json({
          error: {
            code: 'answer_feed_failed',
            message: '답변 피드를 불러오지 못했습니다.',
          },
        });
      }
    }
  );
}
