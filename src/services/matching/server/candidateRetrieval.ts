import { ACTIVE_DELIVERY_LIMIT } from './recipientPolicy';
import {
  normalizeExperienceProfile,
  normalizeExperienceProfileStatus,
  type ExperienceProfileCandidate,
  type ExperienceProfileStatus,
} from './experienceProfile';
import type { ConcernAnalysis } from './concernAnalysis';

export type MatchingTier = 'A' | 'B' | 'C' | 'Exploration';

export interface RetrievedExperienceCandidate {
  uid: string;
  tier: MatchingTier;
  profileStatus: ExperienceProfileStatus;
  retrievalScore: number;
  topicOverlap: number;
  situationOverlap: number;
  answerStyleOverlap: number;
  helpedCount: number;
  activeDeliveryCount: number;
  gender: string;
  interests: string[];
  experienceProfile: ReturnType<typeof normalizeExperienceProfile>;
}

export function isEligibleExperienceCandidate(candidate: ExperienceProfileCandidate, authorUid: string): boolean {
  if (!candidate.uid || candidate.uid === authorUid) return false;
  if (candidate.deleted === true) return false;
  if (candidate.status === 'deleted') return false;
  if (candidate.inactive === true) return false;
  if (candidate.disabled === true) return false;
  if (candidate.uid.startsWith('bot_')) return false;
  if (candidate.isBot === true) return false;
  if (candidate.type === 'bot') return false;
  if ((candidate.activeDeliveryCount ?? 0) >= ACTIVE_DELIVERY_LIMIT) return false;
  return true;
}

export function retrieveExperienceCandidates(params: {
  authorUid: string;
  concern: Pick<ConcernAnalysis, 'topicTags' | 'situationTags' | 'desiredResponse'>;
  candidates: ExperienceProfileCandidate[];
  excludedUids?: Set<string>;
}): RetrievedExperienceCandidate[] {
  const excludedUids = params.excludedUids ?? new Set<string>();
  return params.candidates
    .filter(candidate => !excludedUids.has(candidate.uid))
    .filter(candidate => isEligibleExperienceCandidate(candidate, params.authorUid))
    .map(candidate => {
      const experienceProfile = normalizeExperienceProfile(candidate.experienceProfile);
      const profileStatus = normalizeExperienceProfileStatus(candidate.profileStatus);
      const topicOverlap = overlapCount(Object.keys(experienceProfile.topicScores), params.concern.topicTags);
      const situationOverlap = overlapCount(Object.keys(experienceProfile.situationScores), params.concern.situationTags);
      const answerStyleOverlap = overlapCount(Object.keys(experienceProfile.answerStyleScores), params.concern.desiredResponse);
      const retrievalScore = calculateRetrievalScore({ topicOverlap, situationOverlap, answerStyleOverlap });
      return {
        uid: candidate.uid,
        tier: classifyMatchingTier({ retrievalScore, profileStatus }),
        profileStatus,
        retrievalScore,
        topicOverlap,
        situationOverlap,
        answerStyleOverlap,
        helpedCount: typeof candidate.helpedCount === 'number' ? candidate.helpedCount : 0,
        activeDeliveryCount: typeof candidate.activeDeliveryCount === 'number' ? candidate.activeDeliveryCount : 0,
        gender: typeof (candidate as { gender?: unknown }).gender === 'string' ? (candidate as { gender: string }).gender : '',
        interests: Array.isArray((candidate as { interests?: unknown }).interests)
          ? (candidate as { interests: unknown[] }).interests.filter((interest): interest is string => typeof interest === 'string')
          : [],
        experienceProfile,
      };
    })
    .filter(candidate => candidate.tier !== null)
    .sort((a, b) => {
      const tier = tierRank(a.tier) - tierRank(b.tier);
      if (tier !== 0) return tier;
      const score = b.retrievalScore - a.retrievalScore;
      if (score !== 0) return score;
      return b.helpedCount - a.helpedCount;
    });
}

export function calculateRetrievalScore(params: {
  topicOverlap: number;
  situationOverlap: number;
  answerStyleOverlap: number;
}): number {
  return (2 * params.topicOverlap) + (3 * params.situationOverlap) + params.answerStyleOverlap;
}

export function classifyMatchingTier(params: {
  retrievalScore: number;
  profileStatus: ExperienceProfileStatus;
}): MatchingTier | null {
  if (params.profileStatus === 'cold_start') return 'Exploration';
  if (params.retrievalScore >= 7 && (params.profileStatus === 'validated' || params.profileStatus === 'trusted')) return 'A';
  if (params.retrievalScore >= 4) return 'B';
  if (params.retrievalScore >= 1) return 'C';
  return null;
}

function overlapCount(left: readonly string[], right: readonly string[]): number {
  const leftSet = new Set(left);
  return right.filter(item => leftSet.has(item)).length;
}

function tierRank(tier: MatchingTier): number {
  if (tier === 'A') return 0;
  if (tier === 'B') return 1;
  if (tier === 'C') return 2;
  return 3;
}
