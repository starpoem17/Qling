import {
  normalizeDesiredResponseTags,
  normalizeEmotionTags,
  normalizeSituationTags,
  normalizeTopicTags,
  type ExperienceDesiredResponseTag,
  type ExperienceEmotionTag,
  type ExperienceSituationTag,
  type ExperienceTopicTag,
} from './ontology';

export type ConcernRiskLevel = 'low' | 'medium' | 'high' | '';

export interface ConcernAnalysis {
  topicTags: ExperienceTopicTag[];
  emotionTags: ExperienceEmotionTag[];
  situationTags: ExperienceSituationTag[];
  desiredResponse: ExperienceDesiredResponseTag[];
  suggestedNewTags: string[];
  riskLevel: ConcernRiskLevel;
  riskReason: string;
  matchingBrief: string;
}

export type ConcernAnalysisNormalizationResult =
  | { status: 'valid'; analysis: ConcernAnalysis }
  | { status: 'invalid'; code: 'invalid_shape' | 'invalid_matching_brief' };

export function normalizeConcernAnalysis(value: unknown): ConcernAnalysisNormalizationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { status: 'invalid', code: 'invalid_shape' };
  }
  const record = value as Record<string, unknown>;
  const matchingBrief = typeof record.matchingBrief === 'string' ? record.matchingBrief.trim() : '';
  const briefLength = Array.from(matchingBrief).length;
  if (briefLength < 30 || briefLength > 60 || /[\n\r]/.test(matchingBrief)) {
    return { status: 'invalid', code: 'invalid_matching_brief' };
  }

  return {
    status: 'valid',
    analysis: {
      topicTags: normalizeTopicTags(record.topicTags),
      emotionTags: normalizeEmotionTags(record.emotionTags),
      situationTags: normalizeSituationTags(record.situationTags),
      desiredResponse: normalizeDesiredResponseTags(record.desiredResponse),
      suggestedNewTags: normalizeSuggestedNewTags(record.suggestedNewTags),
      riskLevel: normalizeRiskLevel(record.riskLevel),
      riskReason: typeof record.riskReason === 'string' ? record.riskReason.trim() : '',
      matchingBrief,
    },
  };
}

function normalizeSuggestedNewTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const tag = item.trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

function normalizeRiskLevel(value: unknown): ConcernRiskLevel {
  return value === 'low' || value === 'medium' || value === 'high' ? value : '';
}

