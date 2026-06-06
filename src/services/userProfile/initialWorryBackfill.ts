import type { WorryCategory } from '@midnight-radio/domain';

export const INITIAL_WORRY_BACKFILL_TARGET_COUNT = 5;
export const WORRY_INBOX_REFILL_TARGET_ACTIVE_COUNT = 5;

export interface InitialWorryBackfillCandidate {
  readonly id: string;
  readonly authorUid: string;
  readonly matchingCategories: readonly WorryCategory[];
  readonly createdAt?: unknown;
}

export interface InitialWorryBackfillRepository {
  readonly fetchCandidateWorries: (params: {
    readonly uid: string;
    readonly interests: readonly WorryCategory[];
    readonly limit: number;
  }) => Promise<InitialWorryBackfillCandidate[]>;
  readonly commitInitialDeliveriesForNewUser: (params: {
    readonly uid: string;
    readonly gender: string;
    readonly interests: readonly WorryCategory[];
    readonly candidates: readonly InitialWorryBackfillCandidate[];
    readonly targetCount: number;
    readonly targetActiveDeliveryCount?: number;
    readonly reason: 'new_user_onboarding' | 'inbox_refill';
  }) => Promise<InitialWorryBackfillResult>;
}

export interface InitialWorryBackfillResult {
  readonly status: 'completed';
  readonly createdCount: number;
  readonly deliveryIds: readonly string[];
  readonly worryIds: readonly string[];
}

function timestampMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value && typeof (value as { seconds?: unknown }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000;
  }
  if (value && typeof (value as { _seconds?: unknown })._seconds === 'number') {
    return (value as { _seconds: number })._seconds * 1000;
  }
  return 0;
}

function overlapCount(left: readonly string[], right: readonly string[]): number {
  const rightSet = new Set(right);
  return left.filter(item => rightSet.has(item)).length;
}

export async function backfillInitialWorriesForNewUser(params: {
  readonly uid: string;
  readonly gender: string;
  readonly interests: readonly WorryCategory[];
  readonly repository: InitialWorryBackfillRepository;
  readonly targetCount?: number;
}): Promise<InitialWorryBackfillResult> {
  const targetCount = params.targetCount ?? INITIAL_WORRY_BACKFILL_TARGET_COUNT;
  const candidates = await params.repository.fetchCandidateWorries({
    uid: params.uid,
    interests: params.interests,
    limit: 100,
  });

  const ranked = [...candidates]
    .map(candidate => ({
      candidate,
      overlap: overlapCount(params.interests, candidate.matchingCategories),
      createdAtMillis: timestampMillis(candidate.createdAt),
    }))
    .filter(item => item.candidate.authorUid !== params.uid)
    .filter(item => item.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.createdAtMillis - a.createdAtMillis)
    .map(item => item.candidate);

  if (ranked.length === 0) {
    return {
      status: 'completed',
      createdCount: 0,
      deliveryIds: [],
      worryIds: [],
    };
  }

  return params.repository.commitInitialDeliveriesForNewUser({
    uid: params.uid,
    gender: params.gender,
    interests: params.interests,
    candidates: ranked.slice(0, targetCount * 4),
    targetCount,
    reason: 'new_user_onboarding',
  });
}

export async function refillWorryInboxForUser(params: {
  readonly uid: string;
  readonly gender: string;
  readonly interests: readonly WorryCategory[];
  readonly repository: InitialWorryBackfillRepository;
  readonly targetActiveDeliveryCount?: number;
}): Promise<InitialWorryBackfillResult> {
  const targetActiveDeliveryCount = params.targetActiveDeliveryCount ?? WORRY_INBOX_REFILL_TARGET_ACTIVE_COUNT;
  const candidates = await params.repository.fetchCandidateWorries({
    uid: params.uid,
    interests: params.interests,
    limit: 100,
  });

  const ranked = [...candidates]
    .map(candidate => ({
      candidate,
      overlap: overlapCount(params.interests, candidate.matchingCategories),
      createdAtMillis: timestampMillis(candidate.createdAt),
    }))
    .filter(item => item.candidate.authorUid !== params.uid)
    .filter(item => item.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.createdAtMillis - a.createdAtMillis)
    .map(item => item.candidate);

  if (ranked.length === 0) {
    return {
      status: 'completed',
      createdCount: 0,
      deliveryIds: [],
      worryIds: [],
    };
  }

  return params.repository.commitInitialDeliveriesForNewUser({
    uid: params.uid,
    gender: params.gender,
    interests: params.interests,
    candidates: ranked.slice(0, targetActiveDeliveryCount * 4),
    targetCount: targetActiveDeliveryCount,
    targetActiveDeliveryCount,
    reason: 'inbox_refill',
  });
}
