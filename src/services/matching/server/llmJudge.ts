import type { RetrievedExperienceCandidate } from './candidateRetrieval';
import type { ConcernAnalysis } from './concernAnalysis';

export interface MatchingJudgeCandidateContext {
  candidateId: string;
  tier: RetrievedExperienceCandidate['tier'];
  profileStatus: RetrievedExperienceCandidate['profileStatus'];
  topTopics: string[];
  topicScores: Record<string, number>;
  topSituations: string[];
  situationScores: Record<string, number>;
  topAnswerStyles: string[];
  answerStyleScores: Record<string, number>;
  profileSummary: string;
  recentPositiveSignals: string[];
  qualitySignals: {
    helpedCount: number;
    safetyPenalty: number;
  };
}

export interface MatchingJudgeRankedCandidate {
  candidateId: string;
  reason: string;
}

export interface MatchingJudgeResult {
  rankedCandidates: MatchingJudgeRankedCandidate[];
}

export type MatchingJudgeProvider = (params: {
  concern: ConcernAnalysis;
  candidates: MatchingJudgeCandidateContext[];
}) => Promise<MatchingJudgeResult>;

export function toMatchingJudgeCandidateContext(candidate: RetrievedExperienceCandidate): MatchingJudgeCandidateContext {
  return {
    candidateId: candidate.uid,
    tier: candidate.tier,
    profileStatus: candidate.profileStatus,
    topTopics: candidate.experienceProfile.topTopics,
    topicScores: candidate.experienceProfile.topicScores as Record<string, number>,
    topSituations: candidate.experienceProfile.topSituations,
    situationScores: candidate.experienceProfile.situationScores as Record<string, number>,
    topAnswerStyles: candidate.experienceProfile.topAnswerStyles,
    answerStyleScores: candidate.experienceProfile.answerStyleScores as Record<string, number>,
    profileSummary: candidate.experienceProfile.profileSummary,
    recentPositiveSignals: candidate.experienceProfile.recentPositiveSignals,
    qualitySignals: {
      helpedCount: candidate.helpedCount,
      safetyPenalty: candidate.experienceProfile.safetyPenalty,
    },
  };
}

export function normalizeMatchingJudgeResult(
  result: MatchingJudgeResult,
  allowedCandidateIds: ReadonlySet<string>,
): MatchingJudgeResult {
  const seen = new Set<string>();
  return {
    rankedCandidates: result.rankedCandidates.filter(candidate => {
      if (!allowedCandidateIds.has(candidate.candidateId) || seen.has(candidate.candidateId)) return false;
      seen.add(candidate.candidateId);
      return true;
    }).map(candidate => ({
      candidateId: candidate.candidateId,
      reason: oneSentenceReason(candidate.reason),
    })),
  };
}

function oneSentenceReason(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/\s+/g, ' ');
  const firstSentence = trimmed.match(/^.*?[.!?。！？]|^.*$/)?.[0] ?? '';
  return firstSentence.trim();
}

