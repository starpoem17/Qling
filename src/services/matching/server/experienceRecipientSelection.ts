import type { ConcernAnalysis } from './concernAnalysis';
import {
  retrieveExperienceCandidates,
  type MatchingTier,
} from './candidateRetrieval';
import {
  normalizeMatchingJudgeResult,
  toMatchingJudgeCandidateContext,
  type MatchingJudgeProvider,
} from './llmJudge';
import {
  selectFinalExperienceRecipients,
  type FinalExperienceDeliveryRecipient,
} from './postProcessing';
import type {
  AuthorProfile,
  HumanCandidate,
} from './recipientPolicy';

export interface ExperienceDeliveryLlmMatchSnapshot {
  tier: MatchingTier;
  rank: number;
  reason: string;
  retrievalScore: number;
  topicOverlap: number;
  situationOverlap: number;
  answerStyleOverlap: number;
}

export interface SelectedExperienceRecipient {
  uid: string;
  gender: string;
  interests: string[];
  helpedCount: number;
  activeDeliveryCount: number;
  matchOverlapCount: number;
  llmMatch: ExperienceDeliveryLlmMatchSnapshot;
}

export async function selectExperienceRecipients(params: {
  author: AuthorProfile;
  candidates: HumanCandidate[];
  concern: ConcernAnalysis;
  targetCount: number;
  excludedUids?: Set<string>;
  matchingJudgeProvider?: MatchingJudgeProvider;
}): Promise<SelectedExperienceRecipient[]> {
  if (params.targetCount <= 0) return [];

  const retrieved = retrieveExperienceCandidates({
    authorUid: params.author.uid,
    concern: params.concern,
    candidates: params.candidates,
    excludedUids: params.excludedUids,
  });

  const allowedIds = new Set(retrieved.map(candidate => candidate.uid));
  const judgeResult = params.matchingJudgeProvider
    ? await params.matchingJudgeProvider({
      concern: params.concern,
      candidates: retrieved.map(toMatchingJudgeCandidateContext),
    }).then(result => normalizeMatchingJudgeResult(result, allowedIds)).catch(() => fallbackJudgeResult(retrieved))
    : fallbackJudgeResult(retrieved);

  const finalRecipients = selectFinalExperienceRecipients({
    candidates: retrieved,
    judgeResult,
    targetCount: params.targetCount,
  });

  return finalRecipients.map(recipient => ({
    uid: recipient.uid,
    gender: recipient.gender,
    interests: recipient.interests,
    helpedCount: recipient.helpedCount,
    activeDeliveryCount: recipient.activeDeliveryCount,
    matchOverlapCount: recipient.topicOverlap,
    llmMatch: toDeliveryLlmMatch(recipient),
  }));
}

function fallbackJudgeResult(candidates: ReturnType<typeof retrieveExperienceCandidates>) {
  return {
    rankedCandidates: candidates.map(candidate => ({
      candidateId: candidate.uid,
      reason: '경험 프로필과 고민 분석이 상대적으로 잘 맞는 후보입니다.',
    })),
  };
}

function toDeliveryLlmMatch(recipient: FinalExperienceDeliveryRecipient): ExperienceDeliveryLlmMatchSnapshot {
  return {
    tier: recipient.tier,
    rank: recipient.llmMatch.rank,
    reason: recipient.llmMatch.reason,
    retrievalScore: recipient.retrievalScore,
    topicOverlap: recipient.topicOverlap,
    situationOverlap: recipient.situationOverlap,
    answerStyleOverlap: recipient.answerStyleOverlap,
  };
}
