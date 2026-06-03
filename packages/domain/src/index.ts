export const WORRY_CATEGORIES = [
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

export type WorryCategory = (typeof WORRY_CATEGORIES)[number];

export const WORRY_CATEGORY_SET = new Set<string>(WORRY_CATEGORIES);
export const DEFAULT_WORRY_CATEGORY: WorryCategory = '일상';

const LEGACY_WORRY_CATEGORY_MAP = new Map<string, WorryCategory>([
  ['소득', '경제'],
  ['주거', '일상'],
  ['부모', '가족'],
  ['자녀', '가족'],
  ['우울', '건강'],
  ['불안', '건강'],
  ['외로움', '인간관계'],
  ['워라밸', '직장'],
  ['자존감', '건강'],
  ['노후', '미래'],
  ['잡담', '일상'],
]);

export function normalizeWorryCategories(
  values: readonly unknown[],
  options: { readonly fallback?: boolean } = {},
): WorryCategory[] {
  const seen = new Set<WorryCategory>();
  const normalized: WorryCategory[] = [];
  let hadInput = false;

  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    hadInput = true;

    const category = WORRY_CATEGORY_SET.has(trimmed)
      ? trimmed as WorryCategory
      : LEGACY_WORRY_CATEGORY_MAP.get(trimmed);
    if (!category || seen.has(category)) continue;

    seen.add(category);
    normalized.push(category);
  }

  return normalized.length > 0
    ? normalized
    : hadInput && options.fallback !== false
      ? [DEFAULT_WORRY_CATEGORY]
      : [];
}

export type MatchSelectionType = 'matched' | 'random_fallback' | 'ai' | 'ai_safety_fallback';

export interface HumanProfile {
  uid: string;
  gender: string;
  interests: string[];
}

export interface DeliveryRecipient extends HumanProfile {
  matchOverlapCount: number;
  matchSelectionType: MatchSelectionType;
  matchCategoriesSnapshot: string[];
}

export interface CreatedWorryLetterMetadata {
  id: string;
  receiverId: string;
  publicationGroupId: string;
  matchOverlapCount: number;
  matchSelectionType: MatchSelectionType;
  matchCategoriesSnapshot: string[];
}
