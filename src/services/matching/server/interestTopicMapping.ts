import type { WorryCategory } from '@midnight-radio/domain';
import type { ExperienceTopicTag } from './ontology';

export const INTEREST_TO_EXPERIENCE_TOPICS = {
  '진로': ['진로'],
  '취업': ['취업'],
  '직장': ['직장'],
  '학업': ['학업'],
  '시험': ['시험'],
  '경제': ['경제'],
  '연애': ['연애'],
  '결혼': ['결혼'],
  '가족': ['가족'],
  '인간관계': ['인간관계'],
  '육아': ['육아', '가족'],
  '건강': ['건강'],
  '외모': ['외모'],
  '군대': ['군대'],
  '미래': ['미래'],
  '일상': ['일상'],
} as const satisfies Record<WorryCategory, readonly ExperienceTopicTag[]>;

export function mapInterestsToExperienceTopics(interests: readonly WorryCategory[]): ExperienceTopicTag[] {
  const topics: ExperienceTopicTag[] = [];
  const seen = new Set<string>();
  for (const interest of interests) {
    for (const topic of INTEREST_TO_EXPERIENCE_TOPICS[interest] ?? []) {
      if (seen.has(topic)) continue;
      seen.add(topic);
      topics.push(topic);
    }
  }
  return topics;
}
