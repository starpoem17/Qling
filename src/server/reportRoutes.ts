import { type Express } from 'express';
import { requireAuth } from './auth';

export function registerReportRoutes(
  app: Express,
  deps: {
    db: FirebaseFirestore.Firestore | null;
  }
) {
  app.post('/api/reports', requireAuth, async (req, res) => {
    if (!deps.db) {
      return res.status(503).json({ error: { message: 'Firestore is not initialized.' } });
    }

    try {
      const reporterUid = req.user!.uid;
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
