import type { WorryCategory } from '@midnight-radio/domain';
import { mapInterestsToExperienceTopics } from './interestTopicMapping';
import {
  normalizeConcernAnalysis,
  type ConcernAnalysis,
} from './concernAnalysis';

export const DEFAULT_EXPERIENCE_CONCERN_ANALYSIS: ConcernAnalysis = {
  topicTags: ['일상'],
  emotionTags: [],
  situationTags: [],
  desiredResponse: ['공감'],
  suggestedNewTags: [],
  riskLevel: 'low',
  riskReason: '',
  matchingBrief: '구체적인 고민 맥락을 바탕으로 공감 답변이 필요한 상황입니다.',
};

export function resolveExperienceConcernAnalysis(params: {
  llmAnalysis: unknown;
  matchingCategories: string[];
}): ConcernAnalysis {
  const normalized = normalizeConcernAnalysis(params.llmAnalysis);
  if (normalized.status === 'valid') return normalized.analysis;

  const topicTags = mapInterestsToExperienceTopics(params.matchingCategories as WorryCategory[]);
  return {
    ...DEFAULT_EXPERIENCE_CONCERN_ANALYSIS,
    topicTags: topicTags.length > 0 ? topicTags.slice(0, 3) : DEFAULT_EXPERIENCE_CONCERN_ANALYSIS.topicTags,
  };
}
