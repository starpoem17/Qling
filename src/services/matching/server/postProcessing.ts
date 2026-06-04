import type { MatchingTier, RetrievedExperienceCandidate } from './candidateRetrieval';
import type { MatchingJudgeResult } from './llmJudge';

export const EXPERIENCE_DELIVERY_TARGET_COUNT = 5;

export interface FinalExperienceDeliveryRecipient extends RetrievedExperienceCandidate {
  llmMatch: {
    rank: number;
    reason: string;
  };
}

export function selectFinalExperienceRecipients(params: {
  candidates: RetrievedExperienceCandidate[];
  judgeResult: MatchingJudgeResult;
  targetCount?: number;
}): FinalExperienceDeliveryRecipient[] {
  const targetCount = params.targetCount ?? EXPERIENCE_DELIVERY_TARGET_COUNT;
  const candidateById = new Map(params.candidates.map(candidate => [candidate.uid, candidate]));
  const ranked = params.judgeResult.rankedCandidates
    .map((candidate, index) => ({
      candidate: candidateById.get(candidate.candidateId),
      rank: index + 1,
      reason: candidate.reason,
    }))
    .filter((item): item is { candidate: RetrievedExperienceCandidate; rank: number; reason: string } => Boolean(item.candidate));

  const selected: FinalExperienceDeliveryRecipient[] = [];
  const selectedIds = new Set<string>();

  takeByTier({ tier: 'A', ranked, selected, selectedIds, max: Math.min(2, targetCount) });
  takeByTier({ tier: 'B', ranked, selected, selectedIds, max: selected.length < targetCount ? 1 : 0 });
  takeByTier({ tier: 'B', ranked, selected, selectedIds, max: selected.length < targetCount ? 1 : 0 });
  takeByTier({ tier: 'C', ranked, selected, selectedIds, max: selected.length < targetCount ? 1 : 0 });
  takeByTier({ tier: 'A', ranked, selected, selectedIds, max: selected.length < targetCount ? 1 : 0 });
  takeByTier({ tier: 'Exploration', ranked, selected, selectedIds, max: selected.length < targetCount ? 1 : 0 });

  return selected.slice(0, targetCount);
}

function takeByTier(params: {
  tier: MatchingTier;
  ranked: Array<{ candidate: RetrievedExperienceCandidate; rank: number; reason: string }>;
  selected: FinalExperienceDeliveryRecipient[];
  selectedIds: Set<string>;
  max: number;
}) {
  let taken = 0;
  for (const item of params.ranked) {
    if (taken >= params.max) return;
    if (item.candidate.tier !== params.tier || params.selectedIds.has(item.candidate.uid)) continue;
    params.selectedIds.add(item.candidate.uid);
    params.selected.push({ ...item.candidate, llmMatch: { rank: item.rank, reason: item.reason } });
    taken += 1;
  }
}
