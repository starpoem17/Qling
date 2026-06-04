export const EXPERIENCE_TOPIC_TAGS = [
  '진로',
  '취업',
  '직장',
  '학업',
  '시험',
  '경제',
  '연애',
  '결혼',
  '가족',
  '인간관계',
  '육아',
  '건강',
  '외모',
  '군대',
  '미래',
  '일상',
] as const;

export const EXPERIENCE_EMOTION_TAGS = [
  '불안',
  '우울감',
  '외로움',
  '자존감저하',
  '무기력',
  '좌절',
  '슬픔',
  '분노',
  '죄책감',
  '후회',
  '혼란',
  '부담감',
] as const;

export const EXPERIENCE_DESIRED_RESPONSE_TAGS = [
  '공감',
  '경험공유',
  '현실조언',
  '정보제공',
  '격려',
  '관점정리',
] as const;

export const EXPERIENCE_SITUATION_TAGS = [
  '장기취준',
  '서류탈락',
  '면접실패',
  '이직고민',
  '직장적응',
  '상사갈등',
  '번아웃',
  '성적부진',
  '시험불안',
  '진로혼란',
  '휴학고민',
  '전공불만',
  '이별',
  '짝사랑',
  '연애갈등',
  '부모갈등',
  '친구갈등',
  '대인관계어려움',
  '경제부담',
  '미래불확실성',
  '건강염려',
  '외모고민',
  '군생활적응',
  '일상무기력',
] as const;

export type ExperienceTopicTag = (typeof EXPERIENCE_TOPIC_TAGS)[number];
export type ExperienceEmotionTag = (typeof EXPERIENCE_EMOTION_TAGS)[number];
export type ExperienceDesiredResponseTag = (typeof EXPERIENCE_DESIRED_RESPONSE_TAGS)[number];
export type ExperienceSituationTag = (typeof EXPERIENCE_SITUATION_TAGS)[number];
export type ExperienceAnswerStyleTag = ExperienceDesiredResponseTag;

const TOPIC_SET = new Set<string>(EXPERIENCE_TOPIC_TAGS);
const EMOTION_SET = new Set<string>(EXPERIENCE_EMOTION_TAGS);
const DESIRED_RESPONSE_SET = new Set<string>(EXPERIENCE_DESIRED_RESPONSE_TAGS);
const SITUATION_SET = new Set<string>(EXPERIENCE_SITUATION_TAGS);

function normalizeKnownTags<T extends string>(
  values: unknown,
  known: ReadonlySet<string>,
  maxCount: number,
): T[] {
  if (!Array.isArray(values)) return [];
  const normalized: T[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const tag = value.trim();
    if (!known.has(tag) || seen.has(tag)) continue;
    seen.add(tag);
    normalized.push(tag as T);
    if (normalized.length >= maxCount) break;
  }
  return normalized;
}

export function normalizeTopicTags(values: unknown, maxCount = 3): ExperienceTopicTag[] {
  return normalizeKnownTags<ExperienceTopicTag>(values, TOPIC_SET, maxCount);
}

export function normalizeEmotionTags(values: unknown, maxCount = 2): ExperienceEmotionTag[] {
  return normalizeKnownTags<ExperienceEmotionTag>(values, EMOTION_SET, maxCount);
}

export function normalizeDesiredResponseTags(values: unknown, maxCount = 2): ExperienceDesiredResponseTag[] {
  return normalizeKnownTags<ExperienceDesiredResponseTag>(values, DESIRED_RESPONSE_SET, maxCount);
}

export function normalizeSituationTags(values: unknown, maxCount = 3): ExperienceSituationTag[] {
  return normalizeKnownTags<ExperienceSituationTag>(values, SITUATION_SET, maxCount);
}

