import { type Express } from 'express';
import { createRequireActiveFirebaseAuth, type ActiveAuthenticatedRequest } from './auth';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

export function registerReportRoutes(
  app: Express,
  deps: {
    db: Firestore | null;
    auth: Auth;
  }
) {
  app.post(
    '/api/reports',
    createRequireActiveFirebaseAuth({ auth: deps.auth, db: deps.db as Firestore }),
    async (req, res) => {
      const authReq = req as ActiveAuthenticatedRequest;
      if (!deps.db) {
        return res.status(503).json({ error: { message: 'Firestore is not initialized.' } });
      }

      try {
        const reporterUid = authReq.auth.uid;
      const { reportedUid, chatId, reason, description } = req.body;

      if (!reportedUid || !reason) {
        return res.status(400).json({ error: { message: 'Missing required fields' } });
      }

      const reportRef = deps.db.collection('reports').doc();
      await reportRef.set({
        reporterUid,
        reportedUid,
        chatId: chatId || null,
        reason,
        description: description || '',
        createdAt: new Date(),
      });

      res.json({ success: true, reportId: reportRef.id });
    } catch (error) {
      console.error('Failed to submit report:', error);
      res.status(500).json({ error: { message: 'Internal server error' } });
    }
  });
}
