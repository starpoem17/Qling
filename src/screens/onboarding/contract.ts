import type { WorryCategory } from '@midnight-radio/domain';
import type { ProfileColor } from '../../lib/profileColor';
import type { FieldValidationMessages, ProcessingState } from '../shared/contract';

export const ONBOARDING_INTEREST_CATEGORY_ORDER = [
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
] as const satisfies readonly WorryCategory[];

export const ONBOARDING_INTEREST_GRID = {
  columns: 2,
  rows: 8,
  chipWidthPx: 155,
  chipHeightPx: 43,
  chipRadiusPx: 19,
  chipBorderWidthPx: 2,
  columnGapPx: 13,
  rowGapPx: 9,
  selectedBorderColor: '#ff8b0d',
  unselectedBackgroundColor: '#fff1d1',
  unselectedBorderColor: '#d4be91',
  textSizePx: 14,
  textLetterSpacingPx: 0,
} as const;

export const ONBOARDING_PROFILE_COLOR_GRID = {
  columns: 5,
  swatchSizePx: 46,
  swatchRadiusPx: 23,
  columnGapPx: 14,
  rowGapPx: 20,
} as const;

export function orderOnboardingInterestCategories(
  categoryOptions: readonly WorryCategory[],
): WorryCategory[] {
  const available = new Set<WorryCategory>(categoryOptions);
  const ordered = ONBOARDING_INTEREST_CATEGORY_ORDER.filter(category => available.has(category));
  const orderedSet = new Set<WorryCategory>(ordered);
  return [
    ...ordered,
    ...categoryOptions.filter(category => !orderedSet.has(category)),
  ];
}

export const ONBOARDING_DUPLICATE_CHECK_STATES = [
  'idle',
  'checking',
  'available',
  'duplicate',
  'invalid',
  'network-failed',
  'retry',
] as const;

export type OnboardingDuplicateCheckState = (typeof ONBOARDING_DUPLICATE_CHECK_STATES)[number];

export type OnboardingGenderValue = 'male' | 'female' | '';

export type OnboardingField = 'nickname' | 'gender' | 'age' | 'interests' | 'profileColor';

export type OnboardingBasicValues = {
  readonly nickname: string;
  readonly gender: OnboardingGenderValue;
  readonly age: string;
};

export type OnboardingInterestsValues = {
  readonly selectedInterests: readonly WorryCategory[];
};

export type OnboardingProfileColorValues = {
  readonly selectedProfileColor: ProfileColor;
};

export type OnboardingScreenProps = ProcessingState & {
  readonly values: OnboardingBasicValues & OnboardingInterestsValues & OnboardingProfileColorValues;
  readonly validationMessages: FieldValidationMessages<OnboardingField>;
  readonly duplicateCheck: {
    readonly state: OnboardingDuplicateCheckState;
    readonly message?: string;
  };
  readonly onNicknameChange: (value: string) => void;
  readonly onGenderChange: (value: Exclude<OnboardingGenderValue, ''>) => void;
  readonly onAgeChange: (value: string) => void;
  readonly onInterestToggle: (value: WorryCategory) => void;
  readonly onProfileColorChange: (value: ProfileColor) => void;
  readonly onDuplicateCheck: () => void;
  readonly onContinue: () => void;
  readonly onSubmit: () => void;
};
