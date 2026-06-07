import type { Firestore } from 'firebase-admin/firestore';
import { composeMaterializedRankingSnapshot, composeRankingResponse } from './policy';
import { readCurrentRankingSnapshot } from './snapshotRepository';
import type { MaterializedRankingSnapshot, RankingFeedbackDoc, RankingReplyDoc, RankingResponse, RankingUserDoc } from './types';

async function loadRankingSourceDocs(params: { readonly db: Firestore }) {
  const [usersSnapshot, feedbacksSnapshot, repliesSnapshot] = await Promise.all([
    params.db.collection('users').get(),
    params.db.collection('feedbacks').get(),
    params.db.collection('replies').get(),
  ]);

  return {
    users: usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as RankingUserDoc)),
    feedbacks: feedbacksSnapshot.docs.map(doc => doc.data() as RankingFeedbackDoc),
    replies: repliesSnapshot.docs.map(doc => doc.data() as RankingReplyDoc),
  };
}

export async function getMaterializedRankingsByFullScan(params: {
  readonly db: Firestore;
  readonly now?: Date;
}): Promise<MaterializedRankingSnapshot> {
  const source = await loadRankingSourceDocs(params);

  return composeMaterializedRankingSnapshot({
    ...source,
    now: params.now ?? new Date(),
  });
}

export async function getRankingsByFullScan(params: {
  readonly db: Firestore;
  readonly viewerUid?: string;
  readonly now?: Date;
}): Promise<RankingResponse> {
  const source = await loadRankingSourceDocs(params);

  return composeRankingResponse({
    ...source,
    viewerUid: params.viewerUid,
    now: params.now ?? new Date(),
  });
}

export async function getRankingsOnServer(params: {
  readonly db: Firestore;
  readonly viewerUid?: string;
  readonly now?: Date;
}): Promise<RankingResponse> {
  const snapshot = await readCurrentRankingSnapshot({ db: params.db, viewerUid: params.viewerUid });
  if (snapshot) return snapshot;

  console.warn('Ranking snapshot missing; falling back to full collection scan.');
  return getRankingsByFullScan(params);
}
