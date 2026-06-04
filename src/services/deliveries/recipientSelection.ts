import {
  rankMatchedHumanCandidates,
  type AuthorProfile,
  type HumanCandidate,
  type RankedHumanCandidate,
} from '../matching/server/recipientPolicy';
import { resolveExperienceConcernAnalysis } from '../matching/server/concernFallback';
import { selectExperienceRecipients } from '../matching/server/experienceRecipientSelection';
import type { MatchingJudgeProvider } from '../matching/server/llmJudge';
import type { PassReplacementSelectedRecipient } from './types';

const PASS_REPLACEMENT_CANDIDATE_LIMIT = 5;

export function selectPassReplacementCandidates(params: {
  author: AuthorProfile;
  candidates: HumanCandidate[];
  matchingCategories: string[];
  excludedUids: Set<string>;
  random: () => number;
}): RankedHumanCandidate[] {
  return rankMatchedHumanCandidates({
    author: params.author,
    candidates: params.candidates,
    matchingCategories: params.matchingCategories,
    excludedUids: params.excludedUids,
    random: params.random,
  });
}

export async function selectExperiencePassReplacementCandidates(params: {
  author: AuthorProfile;
  candidates: HumanCandidate[];
  matchingCategories: string[];
  llmAnalysis?: unknown;
  excludedUids: Set<string>;
  matchingJudgeProvider?: MatchingJudgeProvider;
}): Promise<PassReplacementSelectedRecipient[]> {
  const recipients = await selectExperienceRecipients({
    author: params.author,
    candidates: params.candidates,
    concern: resolveExperienceConcernAnalysis({
      llmAnalysis: params.llmAnalysis,
      matchingCategories: params.matchingCategories,
    }),
    targetCount: PASS_REPLACEMENT_CANDIDATE_LIMIT,
    excludedUids: params.excludedUids,
    matchingJudgeProvider: params.matchingJudgeProvider,
  });

  const selected: PassReplacementSelectedRecipient[] = recipients.map(recipient => ({
    ...recipient,
    randomTieBreaker: 0,
  }));

  const excludedUids = new Set(params.excludedUids);
  for (const recipient of selected) {
    excludedUids.add(recipient.uid);
  }

  if (selected.length < PASS_REPLACEMENT_CANDIDATE_LIMIT) {
    selected.push(...rankMatchedHumanCandidates({
      author: params.author,
      candidates: params.candidates,
      matchingCategories: params.matchingCategories,
      excludedUids,
      random: () => 0,
    }).slice(0, PASS_REPLACEMENT_CANDIDATE_LIMIT - selected.length));
  }

  return selected;
}
