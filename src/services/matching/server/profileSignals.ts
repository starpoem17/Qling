import type { ConcernAnalysis } from './concernAnalysis';
import {
  type ExperienceProfile,
  type ExperienceProfileStatus,
  normalizeExperienceProfile,
  normalizeExperienceProfileStatus,
} from './experienceProfile';

export function applyConcernExperienceSignal(params: {
  currentProfile: Partial<ExperienceProfile> | undefined;
  concern: Partial<ConcernAnalysis> | undefined;
  weight: number;
  positiveSignal?: string;
}): ExperienceProfile {
  const profile = normalizeExperienceProfile(params.currentProfile);
  const weight = Math.max(0, params.weight);
  const topicScores = addScores(profile.topicScores, params.concern?.topicTags, weight);
  const situationScores = addScores(profile.situationScores, params.concern?.situationTags, weight);
  const answerStyleScores = addScores(profile.answerStyleScores, params.concern?.desiredResponse, weight);

  const next: ExperienceProfile = normalizeExperienceProfile({
    profileSummary: profile.profileSummary,
    profileSummaryUpdatedAt: profile.profileSummaryUpdatedAt,
    profileSummarySource: profile.profileSummarySource,
    profileSummaryHelpedCountSnapshot: profile.profileSummaryHelpedCountSnapshot,
    profileSummaryTopTopicsSnapshot: profile.profileSummaryTopTopicsSnapshot,
    profileSummaryPendingReason: profile.profileSummaryPendingReason,
    topicScores,
    situationScores,
    answerStyleScores,
    recentPositiveSignals: params.positiveSignal
      ? [params.positiveSignal, ...profile.recentPositiveSignals.filter(signal => signal !== params.positiveSignal)].slice(0, 10)
      : profile.recentPositiveSignals,
    safetyPenalty: profile.safetyPenalty,
  });

  return next;
}

export function applyExperienceSafetyPenalty(params: {
  currentProfile: Partial<ExperienceProfile> | undefined;
  amount?: number;
}): ExperienceProfile {
  const profile = normalizeExperienceProfile(params.currentProfile);
  return normalizeExperienceProfile({
    ...profile,
    safetyPenalty: profile.safetyPenalty + Math.max(0, params.amount ?? 1),
  });
}

export function promoteExperienceProfileStatus(value: unknown): ExperienceProfileStatus {
  const current = normalizeExperienceProfileStatus(value);
  return current === 'cold_start' ? 'light' : current;
}

function addScores<T extends string>(
  current: Partial<Record<T, number>>,
  tags: readonly T[] | undefined,
  weight: number
): Partial<Record<T, number>> {
  if (!tags?.length || weight <= 0) return current;
  const next: Partial<Record<T, number>> = { ...current };
  for (const tag of tags) {
    next[tag] = (next[tag] ?? 0) + weight;
  }
  return next;
}
