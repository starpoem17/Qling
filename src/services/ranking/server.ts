import type { Firestore } from 'firebase-admin/firestore';
import { composeRankingResponse } from './policy';
import type { RankingFeedbackDoc, RankingReplyDoc, RankingResponse, RankingUserDoc } from './types';

export async function getRankingsOnServer(params: {
  readonly db: Firestore;
  readonly viewerUid?: string;
  readonly now?: Date;
}): Promise<RankingResponse> {
  const [usersSnapshot, feedbacksSnapshot, repliesSnapshot] = await Promise.all([
    params.db.collection('users').get(),
    params.db.collection('feedbacks').get(),
    params.db.collection('replies').get(),
  ]);

  return composeRankingResponse({
    users: usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as RankingUserDoc)),
    feedbacks: feedbacksSnapshot.docs.map(doc => doc.data() as RankingFeedbackDoc),
    replies: repliesSnapshot.docs.map(doc => doc.data() as RankingReplyDoc),
    viewerUid: params.viewerUid,
    now: params.now ?? new Date(),
  });
}
