import type {
  ExperienceAnswerStyleTag,
  ExperienceSituationTag,
  ExperienceTopicTag,
} from './ontology';
import {
  EXPERIENCE_DESIRED_RESPONSE_TAGS,
  EXPERIENCE_SITUATION_TAGS,
  EXPERIENCE_TOPIC_TAGS,
  normalizeDesiredResponseTags,
  normalizeSituationTags,
  normalizeTopicTags,
} from './ontology';

export type ExperienceProfileStatus = 'cold_start' | 'light' | 'validated' | 'trusted';

export type ExperienceScoreMap<T extends string = string> = Partial<Record<T, number>>;

export interface ExperienceProfile {
  topicScores: ExperienceScoreMap<ExperienceTopicTag>;
  situationScores: ExperienceScoreMap<ExperienceSituationTag>;
  answerStyleScores: ExperienceScoreMap<ExperienceAnswerStyleTag>;
  topTopics: ExperienceTopicTag[];
  topSituations: ExperienceSituationTag[];
  topAnswerStyles: ExperienceAnswerStyleTag[];
  profileSummary: string;
  profileSummaryUpdatedAt?: unknown;
  profileSummarySource?: 'llm' | 'none';
  profileSummaryHelpedCountSnapshot?: number;
  profileSummaryTopTopicsSnapshot?: ExperienceTopicTag[];
  profileSummaryPendingReason?: string;
  recentPositiveSignals: string[];
  safetyPenalty: number;
}

export interface ExperienceProfileCandidate {
  uid: string;
  gender?: string;
  interests?: string[];
  profileStatus?: ExperienceProfileStatus;
  experienceProfile?: Partial<ExperienceProfile>;
  helpedCount?: number;
  lastActiveAt?: Date | null;
  activeDeliveryCount?: number;
  deleted?: boolean;
  status?: string;
  inactive?: boolean;
  disabled?: boolean;
  isBot?: boolean;
  type?: string;
}

export const EMPTY_EXPERIENCE_PROFILE: ExperienceProfile = {
  topicScores: {},
  situationScores: {},
  answerStyleScores: {},
  topTopics: [],
  topSituations: [],
  topAnswerStyles: [],
  profileSummary: '',
  recentPositiveSignals: [],
  safetyPenalty: 0,
};

export function createInitialExperienceProfile(selectedTopics: readonly ExperienceTopicTag[]): ExperienceProfile {
  const topicScores: ExperienceProfile['topicScores'] = {};
  for (const topic of selectedTopics) {
    topicScores[topic] = 1;
  }
  return normalizeExperienceProfile({
    ...EMPTY_EXPERIENCE_PROFILE,
    topicScores,
    topTopics: [...selectedTopics],
  });
}

export function normalizeExperienceProfile(value: Partial<ExperienceProfile> | undefined): ExperienceProfile {
  const topicScores = normalizeScoreMap(value?.topicScores, new Set<string>(EXPERIENCE_TOPIC_TAGS));
  const situationScores = normalizeScoreMap(value?.situationScores, new Set<string>(EXPERIENCE_SITUATION_TAGS));
  const answerStyleScores = normalizeScoreMap(value?.answerStyleScores, new Set<string>(EXPERIENCE_DESIRED_RESPONSE_TAGS));

  const profile: ExperienceProfile = {
    topicScores,
    situationScores,
    answerStyleScores,
    topTopics: Array.isArray(value?.topTopics) ? normalizeTopicTags(value.topTopics, 5) : topKeys(topicScores),
    topSituations: Array.isArray(value?.topSituations) ? normalizeSituationTags(value.topSituations, 5) : topKeys(situationScores),
    topAnswerStyles: Array.isArray(value?.topAnswerStyles) ? normalizeDesiredResponseTags(value.topAnswerStyles, 5) : topKeys(answerStyleScores),
    profileSummary: typeof value?.profileSummary === 'string' ? value.profileSummary : '',
    recentPositiveSignals: Array.isArray(value?.recentPositiveSignals)
      ? value.recentPositiveSignals.filter((item): item is string => typeof item === 'string')
      : [],
    safetyPenalty: finiteNumber(value?.safetyPenalty, 0),
  };

  if (value && 'profileSummaryUpdatedAt' in value && value.profileSummaryUpdatedAt !== undefined) {
    profile.profileSummaryUpdatedAt = value.profileSummaryUpdatedAt;
  }
  if (value?.profileSummarySource === 'llm' || value?.profileSummarySource === 'none') {
    profile.profileSummarySource = value.profileSummarySource;
  }
  const helpedSnapshot = finiteOptionalNumber(value?.profileSummaryHelpedCountSnapshot);
  if (helpedSnapshot !== undefined) {
    profile.profileSummaryHelpedCountSnapshot = helpedSnapshot;
  }
  if (Array.isArray(value?.profileSummaryTopTopicsSnapshot)) {
    profile.profileSummaryTopTopicsSnapshot = normalizeTopicTags(value.profileSummaryTopTopicsSnapshot, 5);
  }
  if (typeof value?.profileSummaryPendingReason === 'string') {
    profile.profileSummaryPendingReason = value.profileSummaryPendingReason;
  }

  return profile;
}

export function isTrustedExperienceProfile(params: {
  helpedCount: number;
  safetyPenalty: number;
  lastActiveAt: Date | null;
  now: Date;
}): boolean {
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  return params.helpedCount >= 10
    && params.safetyPenalty <= 1
    && params.lastActiveAt !== null
    && params.now.getTime() - params.lastActiveAt.getTime() <= ninetyDaysMs;
}

export function normalizeExperienceProfileStatus(value: unknown): ExperienceProfileStatus {
  return value === 'light' || value === 'validated' || value === 'trusted' ? value : 'cold_start';
}

function normalizeScoreMap<T extends string>(value: ExperienceScoreMap<T> | undefined, known: ReadonlySet<string>): ExperienceScoreMap<T> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [T, number] => typeof entry[0] === 'string' && known.has(entry[0]) && typeof entry[1] === 'number' && Number.isFinite(entry[1]))
      .map(([key, score]) => [key, Math.max(0, score)]),
  ) as ExperienceScoreMap<T>;
}

function topKeys<T extends string>(scores: ExperienceScoreMap<T>, limit = 5): T[] {
  return Object.entries(scores)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, limit)
    .map(([key]) => key as T);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function finiteOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
