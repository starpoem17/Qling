import {
  FieldValue,
  type Firestore,
} from 'firebase-admin/firestore';
import {
  normalizeExperienceProfile,
  normalizeExperienceProfileStatus,
} from './experienceProfile';
import {
  type ExperienceProfileSummaryProvider,
  normalizeProfileSummaryProviderOutput,
} from './profileSummary';
import type { ProfileSummaryJobReason } from './profileSummaryPolicy';

export interface ExperienceProfileSummaryJobWriteModel {
  id: string;
  uid: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  reason: ProfileSummaryJobReason;
  attempts: number;
  createdAt: unknown;
  updatedAt: unknown;
  lastError: string | null;
  completedAt?: unknown;
}

export interface ExperienceProfileSummaryJobResult {
  jobId: string;
  uid: string;
  status: 'completed' | 'failed' | 'skipped';
  reason?: string;
}

export interface RunExperienceProfileSummaryJobsResult {
  status: 'completed';
  checkedCount: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  results: ExperienceProfileSummaryJobResult[];
}

export function buildExperienceProfileSummaryJob(params: {
  id: string;
  uid: string;
  reason: ProfileSummaryJobReason;
  now: unknown;
}): ExperienceProfileSummaryJobWriteModel {
  return {
    id: params.id,
    uid: params.uid,
    status: 'queued',
    reason: params.reason,
    attempts: 0,
    createdAt: params.now,
    updatedAt: params.now,
    lastError: null,
  };
}

export function enqueueExperienceProfileSummaryJob(params: {
  db: Firestore;
  transaction: FirebaseFirestore.Transaction;
  uid: string;
  reason: ProfileSummaryJobReason;
  now: unknown;
}): string {
  const jobRef = params.db.collection('experienceProfileSummaryJobs').doc();
  params.transaction.set(jobRef, withoutId(buildExperienceProfileSummaryJob({
    id: jobRef.id,
    uid: params.uid,
    reason: params.reason,
    now: params.now,
  })));
  return jobRef.id;
}

export async function runExperienceProfileSummaryJobs(params: {
  db: Firestore;
  provider: ExperienceProfileSummaryProvider;
  limit?: number;
  now?: Date;
}): Promise<RunExperienceProfileSummaryJobsResult> {
  const limit = Math.max(1, Math.min(params.limit ?? 20, 50));
  const snap = await params.db.collection('experienceProfileSummaryJobs')
    .where('status', '==', 'queued')
    .limit(limit)
    .get();

  const results: ExperienceProfileSummaryJobResult[] = [];
  for (const doc of snap.docs) {
    results.push(await processExperienceProfileSummaryJob({
      db: params.db,
      provider: params.provider,
      jobId: doc.id,
      now: params.now ?? new Date(),
    }));
  }

  return {
    status: 'completed',
    checkedCount: results.length,
    completedCount: results.filter(result => result.status === 'completed').length,
    failedCount: results.filter(result => result.status === 'failed').length,
    skippedCount: results.filter(result => result.status === 'skipped').length,
    results,
  };
}

async function processExperienceProfileSummaryJob(params: {
  db: Firestore;
  provider: ExperienceProfileSummaryProvider;
  jobId: string;
  now: Date;
}): Promise<ExperienceProfileSummaryJobResult> {
  const claimed = await claimJob(params);
  if (claimed.status !== 'claimed') return claimed.result;

  try {
    const normalized = normalizeProfileSummaryProviderOutput(await params.provider({
      uid: claimed.uid,
      profile: claimed.profile,
      helpedCount: claimed.helpedCount,
      profileStatus: claimed.profileStatus,
    }));
    if (normalized.status !== 'valid') {
      throw new Error('invalid_profile_summary');
    }

    await params.db.runTransaction(async transaction => {
      const timestamp = FieldValue.serverTimestamp();
      const userRef = params.db.collection('users').doc(claimed.uid);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('user_missing');
      const user = userDoc.data() ?? {};
      const profile = normalizeExperienceProfile(user.experienceProfile);
      const helpedCount = typeof user.helpedCount === 'number' ? user.helpedCount : 0;
      const nextProfile = normalizeExperienceProfile({
        ...profile,
        profileSummary: normalized.summary,
        profileSummaryUpdatedAt: timestamp,
        profileSummarySource: 'llm',
        profileSummaryHelpedCountSnapshot: helpedCount,
        profileSummaryTopTopicsSnapshot: profile.topTopics,
        profileSummaryPendingReason: undefined,
      });

      transaction.set(userRef, {
        experienceProfile: nextProfile,
        updatedAt: timestamp,
      }, { merge: true });
      transaction.set(params.db.collection('experienceProfileSummaryJobs').doc(params.jobId), {
        status: 'completed',
        completedAt: timestamp,
        updatedAt: timestamp,
        lastError: null,
      }, { merge: true });
    });

    return { jobId: params.jobId, uid: claimed.uid, status: 'completed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await params.db.collection('experienceProfileSummaryJobs').doc(params.jobId).set({
      status: 'failed',
      updatedAt: FieldValue.serverTimestamp(),
      lastError: message,
    }, { merge: true });
    return { jobId: params.jobId, uid: claimed.uid, status: 'failed', reason: message };
  }
}

async function claimJob(params: {
  db: Firestore;
  jobId: string;
}): Promise<
  | {
      status: 'claimed';
      uid: string;
      profile: ReturnType<typeof normalizeExperienceProfile>;
      profileStatus: ReturnType<typeof normalizeExperienceProfileStatus>;
      helpedCount: number;
    }
  | { status: 'not_claimed'; result: ExperienceProfileSummaryJobResult }
> {
  return params.db.runTransaction(async transaction => {
    const jobRef = params.db.collection('experienceProfileSummaryJobs').doc(params.jobId);
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      return { status: 'not_claimed' as const, result: { jobId: params.jobId, uid: '', status: 'skipped' as const, reason: 'job_missing' } };
    }
    const job = jobDoc.data() ?? {};
    const uid = typeof job.uid === 'string' ? job.uid : '';
    if (job.status !== 'queued' || !uid) {
      return { status: 'not_claimed' as const, result: { jobId: params.jobId, uid, status: 'skipped' as const, reason: 'job_not_queued' } };
    }

    const userRef = params.db.collection('users').doc(uid);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      transaction.set(jobRef, {
        status: 'failed',
        attempts: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
        lastError: 'user_missing',
      }, { merge: true });
      return { status: 'not_claimed' as const, result: { jobId: params.jobId, uid, status: 'failed' as const, reason: 'user_missing' } };
    }

    const user = userDoc.data() ?? {};
    transaction.set(jobRef, {
      status: 'processing',
      attempts: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
      lastError: null,
    }, { merge: true });

    return {
      status: 'claimed' as const,
      uid,
      profile: normalizeExperienceProfile(user.experienceProfile),
      profileStatus: normalizeExperienceProfileStatus(user.profileStatus),
      helpedCount: typeof user.helpedCount === 'number' ? user.helpedCount : 0,
    };
  });
}

function withoutId<T extends { id: string }>(value: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = value;
  return rest;
}
