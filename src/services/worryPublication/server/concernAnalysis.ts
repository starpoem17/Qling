import {
  normalizeConcernAnalysis,
  type ConcernAnalysis,
} from '../../matching/server/concernAnalysis';
import type { WorryConcernAnalyzerProvider } from './types';

export const FALLBACK_CONCERN_ANALYSIS: ConcernAnalysis = {
  topicTags: ['일상'],
  emotionTags: [],
  situationTags: [],
  desiredResponse: ['공감'],
  suggestedNewTags: [],
  riskLevel: 'low',
  riskReason: '',
  matchingBrief: '구체적인 고민 맥락을 바탕으로 공감 답변이 필요한 상황입니다.',
};

export async function analyzeConcernForPublication(params: {
  content: string;
  provider?: WorryConcernAnalyzerProvider;
}): Promise<ConcernAnalysis> {
  if (!params.provider) return FALLBACK_CONCERN_ANALYSIS;

  try {
    const first = normalizeConcernAnalysis(await params.provider(params.content));
    if (first.status === 'valid') return first.analysis;

    const second = normalizeConcernAnalysis(await params.provider(params.content, true));
    if (second.status === 'valid') return second.analysis;

    return FALLBACK_CONCERN_ANALYSIS;
  } catch {
    return FALLBACK_CONCERN_ANALYSIS;
  }
}

