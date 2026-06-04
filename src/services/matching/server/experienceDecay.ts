import {
  FieldValue,
  Timestamp,
  type Firestore,
} from 'firebase-admin/firestore';
import {
  normalizeExperienceProfile,
  type ExperienceProfile,
} from './experienceProfile';
import type { ExperienceSignalWriteModel } from './experienceSignals';
import { enqueueExperienceProfileSummaryJob } from './profileSummaryJobs';
import { resolveProfileSummaryJobReason } from './profileSummaryPolicy';

export interface ExperienceDecayResult {
  uid: string;
  status: 'recalculated' | 'skipped' | 'failed';
  reason?: string;
}

export interface RunExperienceDecayResult {
  status: 'completed';
  checkedCount: number;
  recalculatedCount: number;
  failedCount: number;
  skippedCount: number;
  results: ExperienceDecayResult[];
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export async function runExperienceDecay(params: {
  db: Firestore;
  limit?: number;
  now?: Date;
}): Promise<RunExperienceDecayResult> {
  const now = params.now ?? new Date();
  const limit = Math.max(1, Math.min(params.limit ?? 50, 100));
  const snap = await params.db.collection('users')
    .where('experienceProfileDecayPending', '==', true)
    .limit(limit)
    .get();

  const results: ExperienceDecayResult[] = [];
  for (const doc of snap.docs) {
    results.push(await recalculateExperienceProfileForUser({
      db: params.db,
      uid: doc.id,
      now,
    }));
  }

  return {
    status: 'completed',
    checkedCount: results.length,
    recalculatedCount: results.filter(result => result.status === 'recalculated').length,
    failedCount: results.filter(result => result.status === 'failed').length,
    skippedCount: results.filter(result => result.status === 'skipped').length,
    results,
  };
}

export async function recalculateExperienceProfileForUser(params: {
  db: Firestore;
  uid: string;
  now?: Date;
}): Promise<ExperienceDecayResult> {
  const now = params.now ?? new Date();
  try {
    const signalSnap = await params.db.collection('experienceSignals')
      .where('uid', '==', params.uid)
      .get();
    const cutoff = new Date(now.getTime() - NINETY_DAYS_MS);
    const recentSignals = signalSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as Partial<ExperienceSignalWriteModel>)
      .filter(signal => {
        const signalDate = toDate(signal.signalDate);
        return signalDate !== null && signalDate.getTime() >= cutoff.getTime();
      });

    await params.db.runTransaction(async transaction => {
      const userRef = params.db.collection('users').doc(params.uid);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('user_missing');
      const user = userDoc.data() ?? {};
      const currentProfile = normalizeExperienceProfile(user.experienceProfile);
      const helpedCount = typeof user.helpedCount === 'number' ? user.helpedCount : 0;
      const recalculated = buildProfileFromSignals(currentProfile, recentSignals);
      const summaryReason = resolveProfileSummaryJobReason({
        profile: recalculated,
        helpedCount,
        now,
      });
      const timestamp = FieldValue.serverTimestamp();
      transaction.set(userRef, {
        experienceProfile: summaryReason ? { ...recalculated, profileSummaryPendingReason: summaryReason } : recalculated,
        experienceProfileDecayPending: false,
        experienceProfileRecalculatedAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });
      if (summaryReason) {
        enqueueExperienceProfileSummaryJob({
          db: params.db,
          transaction,
          uid: params.uid,
          reason: summaryReason,
          now: timestamp,
        });
      }
    });

    return { uid: params.uid, status: 'recalculated' };
  } catch (error) {
    return {
      uid: params.uid,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildProfileFromSignals(
  currentProfile: ExperienceProfile,
  signals: Array<Partial<ExperienceSignalWriteModel>>
): ExperienceProfile {
  const topicScores: Record<string, number> = {};
  const situationScores: Record<string, number> = {};
  const answerStyleScores: Record<string, number> = {};
  let safetyPenalty = 0;
  const recentPositiveSignals: string[] = [];

  for (const signal of signals) {
    const weight = typeof signal.weight === 'number' && Number.isFinite(signal.weight) ? signal.weight : 0;
    for (const tag of Array.isArray(signal.topicTags) ? signal.topicTags : []) {
      topicScores[tag] = (topicScores[tag] ?? 0) + weight;
    }
    for (const tag of Array.isArray(signal.situationTags) ? signal.situationTags : []) {
      situationScores[tag] = (situationScores[tag] ?? 0) + weight;
    }
    for (const tag of Array.isArray(signal.answerStyleTags) ? signal.answerStyleTags : []) {
      answerStyleScores[tag] = (answerStyleScores[tag] ?? 0) + weight;
    }
    safetyPenalty += typeof signal.safetyPenaltyDelta === 'number' ? signal.safetyPenaltyDelta : 0;
    if (signal.source === 'reply_created' || signal.source === 'like_received') {
      recentPositiveSignals.unshift(signal.source);
    }
  }

  return normalizeExperienceProfile({
    profileSummary: currentProfile.profileSummary,
    profileSummaryUpdatedAt: currentProfile.profileSummaryUpdatedAt,
    profileSummarySource: currentProfile.profileSummarySource,
    profileSummaryHelpedCountSnapshot: currentProfile.profileSummaryHelpedCountSnapshot,
    profileSummaryTopTopicsSnapshot: currentProfile.profileSummaryTopTopicsSnapshot,
    profileSummaryPendingReason: currentProfile.profileSummaryPendingReason,
    topicScores,
    situationScores,
    answerStyleScores,
    recentPositiveSignals: [...new Set(recentPositiveSignals)].slice(0, 10),
    safetyPenalty,
  });
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}
