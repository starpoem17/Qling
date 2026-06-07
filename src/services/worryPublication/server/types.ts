import type { ConcernAnalysis } from '../../matching/server/concernAnalysis';
import type { MatchingTier } from '../../matching/server/candidateRetrieval';
import type { ExperienceProfile, ExperienceProfileStatus } from '../../matching/server/experienceProfile';
import type { MatchingJudgeProvider } from '../../matching/server/llmJudge';
import type { WorryFeedSnapshot } from '../../homeWorryFeed/worrySnapshot';
import type { HighRiskBlockResult } from './riskPolicy';

export type ServerTimestampValue = unknown;

export interface Phase1AuthorProfile {
  uid: string;
  gender: string;
  interests: string[];
}

export interface Phase1HumanCandidate {
  uid: string;
  gender?: string;
  interests?: string[];
  helpedCount?: number;
  profileStatus?: ExperienceProfileStatus;
  experienceProfile?: Partial<ExperienceProfile>;
  activeDeliveryCount?: number;
  deleted?: boolean;
  status?: string;
  inactive?: boolean;
  disabled?: boolean;
  isBot?: boolean;
  type?: string;
}

export type DeliverySelectionType = 'matched' | 'random';

export interface DeliveryLlmMatchWriteModel {
  tier: MatchingTier;
  rank: number;
  reason: string;
  retrievalScore: number;
  topicOverlap: number;
  situationOverlap: number;
  answerStyleOverlap: number;
}

export interface SelectedPhase1Recipient {
  uid: string;
  gender: string;
  interests: string[];
  helpedCount: number;
  activeDeliveryCount: number;
  selectionType: DeliverySelectionType;
  matchOverlapCount: number;
  matchCategoriesSnapshot: string[];
  llmMatch?: DeliveryLlmMatchWriteModel;
  slotIndex: number;
}

export interface RecipientEligibilitySnapshot {
  uid: string;
  activeDeliveryCount: number;
}

export interface ModerationLogWriteModel {
  id: string;
  targetType: 'worry';
  targetId: string;
  uid: string;
  originalContent: string;
  status: 'approved' | 'rejected' | 'invalid_provider_response' | 'provider_error';
  reasonCode: string;
  userMessage: string;
  helpMessage: string | null;
  rawProviderResponse: unknown | null;
  rawCategories: string[];
  validCategories: string[];
  invalidCategories: string[];
  matchingCategories: string[];
  provider: string;
  model: string;
  createdAt: ServerTimestampValue;
  updatedAt: ServerTimestampValue;
}

export interface WorryWriteModel {
  id: string;
  authorUid: string;
  content: string;
  summaryText: string;
  summaryStatus: 'original' | 'llm_generated' | 'fallback_truncated';
  summaryGeneratedBy: 'none' | 'llm';
  summaryUpdatedAt: ServerTimestampValue;
  status: 'active';
  rawCategories: string[];
  validCategories: string[];
  invalidCategories: string[];
  matchingCategories: string[];
  llmAnalysis?: ConcernAnalysis;
  moderationLogId: string;
  initialDeliveryBatchId: string;
  initialDeliveryTargetCount: 5;
  humanDeliveryLimit: 15;
  humanDeliveryCount: number;
  humanReplyCount: 0;
  hasHumanReply: false;
  createdAt: ServerTimestampValue;
  updatedAt: ServerTimestampValue;
  lastDeliveryCreatedAt: ServerTimestampValue;
}

export interface SummaryFailureLogWriteModel {
  id: string;
  worryId: string;
  status: 'failed';
  attemptCount: number;
  failureReason: string;
  firstResponseText: string | null;
  retryResponseText: string | null;
  provider: string;
  model: string;
  createdAt: ServerTimestampValue;
}

export interface DeliveryBatchWriteModel {
  id: string;
  worryId: string;
  batchRound: 0;
  createdAt: ServerTimestampValue;
  targetCount: 5;
  createdCount: number;
  matchedCount: number;
  randomCount: number;
  reason: 'initial';
}

export interface DeliveryWriteModel {
  id: string;
  worryId: string;
  recipientUid: string;
  authorUid: string;
  status: 'active';
  answeredAt: null;
  worrySnapshot?: WorryFeedSnapshot;
  batchId: string;
  batchRound: 0;
  slotIndex: number;
  selectionType: DeliverySelectionType;
  matchOverlapCount: number;
  matchCategoriesSnapshot: string[];
  recipientInterestsSnapshot: string[];
  recipientGenderSnapshot: string;
  recipientHelpedCountSnapshot: number;
  authorGenderSnapshot: string;
  llmMatch?: DeliveryLlmMatchWriteModel;
  isAiRecipient: false;
  createdAt: ServerTimestampValue;
  updatedAt: ServerTimestampValue;
  answerableUntil: null;
}

export interface CommittedInitialWorryPublication {
  worryId: string;
  deliveryIds: string[];
  moderationLogId: string;
}

export interface InitialWorryPublicationRepository {
  createIds(): {
    worryId: string;
    batchId: string;
    moderationLogId: string;
    summaryFailureLogId: string;
  };

  fetchRecipientCandidates(params: {
    authorUid: string;
    minimumCandidateCount: 5;
    limit?: number;
  }): Promise<Phase1HumanCandidate[]>;

  commitRejectedWorryModeration(params: {
    moderationLog: ModerationLogWriteModel;
  }): Promise<{ moderationLogId: string; targetId: string }>;

  commitInitialWorryPublication(params: {
    worry: WorryWriteModel;
    moderationLog: ModerationLogWriteModel;
    summaryFailureLog?: SummaryFailureLogWriteModel;
    batch: DeliveryBatchWriteModel;
    deliveries: DeliveryWriteModel[];
    selectedRecipientUids: string[];
    eligibilitySnapshot: RecipientEligibilitySnapshot[];
  }): Promise<CommittedInitialWorryPublication>;
}

export type WorryModerationProvider = (content: string, strictRetry?: boolean) => Promise<unknown>;
export type WorrySummaryProvider = (content: string, strictRetry?: boolean) => Promise<unknown>;
export type WorryConcernAnalyzerProvider = (content: string, strictRetry?: boolean) => Promise<unknown>;
export type WorryMatchingJudgeProvider = MatchingJudgeProvider;

export type ServerPublishWorryResult =
  | { status: 'published'; worryId: string; deliveryIds: string[]; moderationLogId: string }
  | { status: 'rejected'; reasonCode: string; userMessage: string; helpMessage?: string; moderationLogId: string; targetId: string }
  | (HighRiskBlockResult & { moderationLogId: string; targetId: string })
  | { status: 'validation_error'; code: 'empty' | 'too_long' | 'invalid_content_type'; message: string }
  | { status: 'provider_error'; code: 'provider_error' | 'provider_invalid'; message: string; details?: unknown }
  | { status: 'server_error'; code: 'transaction_aborted' | 'firebase_unavailable'; message: string; details?: unknown };
