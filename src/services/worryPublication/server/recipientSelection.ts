import type {
  DeliveryLlmMatchWriteModel,
  Phase1AuthorProfile,
  Phase1HumanCandidate,
  SelectedPhase1Recipient,
  WorryMatchingJudgeProvider,
} from './types';
import type { ConcernAnalysis } from '../../matching/server/concernAnalysis';
import { retrieveExperienceCandidates } from '../../matching/server/candidateRetrieval';
import {
  normalizeMatchingJudgeResult,
  toMatchingJudgeCandidateContext,
} from '../../matching/server/llmJudge';
import { selectFinalExperienceRecipients } from '../../matching/server/postProcessing';
import {
  ACTIVE_DELIVERY_LIMIT,
  isEligibleHumanCandidate,
  rankMatchedHumanCandidates,
} from '../../matching/server/recipientPolicy';

export const INITIAL_DELIVERY_TARGET_COUNT = 5;
export const INITIAL_MATCHED_DELIVERY_COUNT = 4;
export const INITIAL_RANDOM_DELIVERY_COUNT = 1;
export { ACTIVE_DELIVERY_LIMIT };

export function isEligiblePhase1HumanCandidate(
  candidate: Phase1HumanCandidate,
  authorUid: string
): boolean {
  return isEligibleHumanCandidate(candidate, authorUid);
}

export type InitialRecipientSelectionResult =
  | { status: 'selected'; recipients: SelectedPhase1Recipient[] };

export function selectInitialWorryRecipients(params: {
  author: Phase1AuthorProfile;
  candidates: Phase1HumanCandidate[];
  matchingCategories: string[];
  random: () => number;
}): InitialRecipientSelectionResult {
  const eligible = rankMatchedHumanCandidates({
    author: params.author,
    candidates: params.candidates,
    matchingCategories: params.matchingCategories,
    random: params.random,
  });

  if (eligible.length < INITIAL_DELIVERY_TARGET_COUNT) {
    return {
      status: 'selected',
      recipients: eligible.map((candidate, index): SelectedPhase1Recipient => ({
        uid: candidate.uid,
        gender: candidate.gender,
        interests: candidate.interests,
        helpedCount: candidate.helpedCount,
        activeDeliveryCount: candidate.activeDeliveryCount,
        selectionType: 'matched',
        matchOverlapCount: candidate.matchOverlapCount,
        matchCategoriesSnapshot: [...params.matchingCategories],
        slotIndex: index,
      })),
    };
  }

  const matched = eligible.slice(0, INITIAL_MATCHED_DELIVERY_COUNT);
  const matchedUids = new Set(matched.map(candidate => candidate.uid));
  const remaining = eligible.filter(candidate => !matchedUids.has(candidate.uid));
  const randomIndex = Math.floor(params.random() * remaining.length);
  const random = remaining[randomIndex];

  const recipients = [
    ...matched.map((candidate, index): SelectedPhase1Recipient => ({
      uid: candidate.uid,
      gender: candidate.gender,
      interests: candidate.interests,
      helpedCount: candidate.helpedCount,
      activeDeliveryCount: candidate.activeDeliveryCount,
      selectionType: 'matched',
      matchOverlapCount: candidate.matchOverlapCount,
      matchCategoriesSnapshot: [...params.matchingCategories],
      slotIndex: index,
    })),
    {
      uid: random.uid,
      gender: random.gender,
      interests: random.interests,
      helpedCount: random.helpedCount,
      activeDeliveryCount: random.activeDeliveryCount,
      selectionType: 'random' as const,
      matchOverlapCount: random.matchOverlapCount,
      matchCategoriesSnapshot: [...params.matchingCategories],
      slotIndex: INITIAL_MATCHED_DELIVERY_COUNT,
    },
  ];

  return { status: 'selected', recipients };
}

export async function selectInitialExperienceRecipients(params: {
  author: Phase1AuthorProfile;
  candidates: Phase1HumanCandidate[];
  concern: ConcernAnalysis;
  matchingCategories: string[];
  matchingJudgeProvider?: WorryMatchingJudgeProvider;
  random?: () => number;
}): Promise<InitialRecipientSelectionResult> {
  const retrieved = retrieveExperienceCandidates({
    authorUid: params.author.uid,
    concern: params.concern,
    candidates: params.candidates,
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
  });

  const experienceRecipients = finalRecipients.map((recipient, index): SelectedPhase1Recipient => ({
    uid: recipient.uid,
    gender: recipient.gender,
    interests: recipient.interests,
    helpedCount: recipient.helpedCount,
    activeDeliveryCount: recipient.activeDeliveryCount,
    selectionType: 'matched',
    matchOverlapCount: recipient.topicOverlap,
    matchCategoriesSnapshot: [...params.matchingCategories],
    llmMatch: toDeliveryLlmMatch(recipient),
    slotIndex: index,
  }));

  if (experienceRecipients.length >= INITIAL_DELIVERY_TARGET_COUNT) {
    return { status: 'selected', recipients: experienceRecipients };
  }

  const selectedUids = new Set(experienceRecipients.map(recipient => recipient.uid));
  const fallbackSelection = selectInitialWorryRecipients({
    author: params.author,
    candidates: params.candidates.filter(candidate => !selectedUids.has(candidate.uid)),
    matchingCategories: params.matchingCategories,
    random: params.random ?? Math.random,
  });
  const fallbackRecipients = fallbackSelection.recipients
    .slice(0, INITIAL_DELIVERY_TARGET_COUNT - experienceRecipients.length)
    .map((recipient, index): SelectedPhase1Recipient => ({
      ...recipient,
      slotIndex: experienceRecipients.length + index,
    }));

  return {
    status: 'selected',
    recipients: [...experienceRecipients, ...fallbackRecipients],
  };
}

function fallbackJudgeResult(candidates: ReturnType<typeof retrieveExperienceCandidates>) {
  return {
    rankedCandidates: candidates.map(candidate => ({
      candidateId: candidate.uid,
      reason: '경험 프로필과 고민 분석이 상대적으로 잘 맞는 후보입니다.',
    })),
  };
}

function toDeliveryLlmMatch(recipient: ReturnType<typeof selectFinalExperienceRecipients>[number]): DeliveryLlmMatchWriteModel {
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
