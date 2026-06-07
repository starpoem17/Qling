import type { Firestore } from 'firebase-admin/firestore';
import type { Messaging } from 'firebase-admin/messaging';
import type { ConcernAnalysis } from '../matching/server/concernAnalysis';
import type { MatchingTier } from '../matching/server/candidateRetrieval';
import type { RankedHumanCandidate, HumanCandidate, AuthorProfile } from '../matching/server/recipientPolicy';
import type { WorryFeedSnapshot } from '../homeWorryFeed/worrySnapshot';

export type RematchRound = 1 | 2;
export type SourceBatchRound = 0 | 1;
export type DeliverySelectionType = 'matched' | 'random';
export type RematchSkipReason =
  | 'not_due'
  | 'no_source_batch'
  | 'round_complete'
  | 'no_capacity'
  | 'no_unanswered_slots'
  | 'no_eligible_recipients'
  | 'example_worry'
  | 'lock_busy'
  | 'dry_run';

export interface RematchSourceBatch {
  id: string;
  worryId: string;
  batchRound: 0 | 1 | 2;
  createdAt: Date;
  reason?: unknown;
}

export interface RematchSourceDelivery {
  id: string;
  worryId: string;
  batchId: string;
  recipientUid: string;
  selectionType: DeliverySelectionType;
  answeredAt: unknown | null;
  isAiRecipient?: boolean;
}

export interface RematchScan {
  worryId: string;
  author: AuthorProfile;
  matchingCategories: string[];
  llmAnalysis?: ConcernAnalysis;
  humanDeliveryCount: number;
  humanDeliveryLimit: number;
  initialDeliveryBatchId?: unknown;
  batches: RematchSourceBatch[];
  sourceDeliveries: RematchSourceDelivery[];
  allDeliveries: Array<{
    id: string;
    worryId: string;
    recipientUid?: string;
    passerUid?: string;
    isAiRecipient?: boolean;
  }>;
  answeredUids: Set<string>;
  candidates: HumanCandidate[];
}

export interface SelectedRematchRecipient extends RankedHumanCandidate {
  selectionType: DeliverySelectionType;
  slotIndex: number;
  llmMatch?: RematchDeliveryLlmMatchWriteModel;
}

export interface RematchDeliveryLlmMatchWriteModel {
  tier: MatchingTier;
  rank: number;
  reason: string;
  retrievalScore: number;
  topicOverlap: number;
  situationOverlap: number;
  answerStyleOverlap: number;
}

export interface RematchBatchWriteModel {
  id: string;
  worryId: string;
  batchRound: RematchRound;
  sourceBatchId: string;
  sourceBatchRound: SourceBatchRound;
  createdByRunId: string;
  createdAt: unknown;
  targetCount: number;
  createdCount: number;
  matchedCount: number;
  randomCount: number;
  reason: 'rematch_timeout';
}

export interface RematchDeliveryWriteModel {
  id: string;
  worryId: string;
  recipientUid: string;
  authorUid: string;
  status: 'active';
  answeredAt: null;
  passedAt: null;
  worrySnapshot?: WorryFeedSnapshot;
  answerableUntil: null;
  batchId: string;
  batchRound: RematchRound;
  slotIndex: number;
  selectionType: DeliverySelectionType;
  matchOverlapCount: number;
  matchCategoriesSnapshot: string[];
  recipientInterestsSnapshot: string[];
  recipientGenderSnapshot: string;
  recipientHelpedCountSnapshot: number;
  authorGenderSnapshot: string;
  llmMatch?: RematchDeliveryLlmMatchWriteModel;
  isAiRecipient: false;
  createdByRematchRunId: string;
  rematchEligibleAfter: unknown | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CommittedRematchBatch {
  status: 'created' | 'candidate_unavailable' | 'idempotent' | 'skipped';
  worryId: string;
  batchId?: string;
  deliveryIds: string[];
  recipientUids: string[];
  createdCount: number;
  reason?: RematchSkipReason;
}

export interface RematchRepository {
  createRunId(): string;
  fetchScans(params: { now: Date; limit: number }): Promise<RematchScan[]>;
  acquireRunLock(params: { runId: string; now: Date; lockUntil: Date }): Promise<boolean>;
  completeRun(params: {
    runId: string;
    now: Date;
    status: 'completed' | 'failed';
    dueCount: number;
    processedCount: number;
    createdDeliveryCount: number;
    error: string | null;
  }): Promise<void>;
  commitRematchBatch(params: {
    runId: string;
    now: Date;
    scan: RematchScan;
    sourceBatch: RematchSourceBatch;
    targetCount: number;
    recipients: SelectedRematchRecipient[];
    nextRound: RematchRound;
    rematchEligibleAfter: Date | null;
  }): Promise<CommittedRematchBatch>;
}

export type RematchDueDeliveriesResult =
  | {
      status: 'completed';
      runId: string;
      dueCount: number;
      processedCount: number;
      createdDeliveryCount: number;
      results: CommittedRematchBatch[];
      dryRun: boolean;
    }
  | {
      status: 'lock_busy';
      runId: string;
      dueCount: 0;
      processedCount: 0;
      createdDeliveryCount: 0;
      results: [];
      dryRun: boolean;
    }
  | {
      status: 'server_error';
      code: 'transaction_aborted' | 'firebase_unavailable';
      message: string;
      details?: unknown;
    };

export type RematchPushAdapter = (params: {
  db: Firestore;
  messaging: Messaging | null;
  deliveries: Array<{ deliveryId: string; recipientUid: string; worryId: string }>;
}) => Promise<void>;
