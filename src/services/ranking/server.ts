import type { Firestore } from 'firebase-admin/firestore';
import { composeRankingResponse } from './policy';
import type { RankingFeedbackDoc, RankingResponse, RankingUserDoc } from './types';

export async function getRankingsOnServer(params: {
  readonly db: Firestore;
  readonly now?: Date;
}): Promise<RankingResponse> {
  const [usersSnapshot, feedbacksSnapshot] = await Promise.all([
    params.db.collection('users').get(),
    params.db.collection('feedbacks').get(),
  ]);

  return composeRankingResponse({
    users: usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as RankingUserDoc)),
    feedbacks: feedbacksSnapshot.docs.map(doc => doc.data() as RankingFeedbackDoc),
    now: params.now ?? new Date(),
  });
}
