import type { ExperienceProfileSummaryProvider } from '../services/matching/server/profileSummary';
import { fetchFromOpenAI } from './moderationProvider';

export const summarizeExperienceProfile: ExperienceProfileSummaryProvider = async input => {
  const payload = JSON.stringify({
    profileStatus: input.profileStatus,
    helpedCount: input.helpedCount,
    topTopics: input.profile.topTopics,
    topicScores: input.profile.topicScores,
    topSituations: input.profile.topSituations,
    situationScores: input.profile.situationScores,
    topAnswerStyles: input.profile.topAnswerStyles,
    answerStyleScores: input.profile.answerStyleScores,
    recentPositiveSignals: input.profile.recentPositiveSignals,
    safetyPenalty: input.profile.safetyPenalty,
  });

  return fetchFromOpenAI(`You summarize a Korean anonymous app user's experience profile for matching.
Return JSON only with this exact shape:
{ "profileSummary": "한국어 한 문장" }

Rules:
- Use only the provided experience signals.
- Do not mention or infer private, sensitive, demographic, location, age, gender, identity, or medical details.
- Do not mention internal scores or labels.
- The summary must be Korean, one sentence, 10 to 80 characters.
- Describe what kind of worry this user may be able to answer from experience.
- No markdown, no explanations, no extra keys.`, payload);
};
