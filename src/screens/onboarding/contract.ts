import type { WorryCategory } from '@midnight-radio/domain';
import type { FieldValidationMessages, ProcessingState } from '../shared/contract';

export const ONBOARDING_INTEREST_CATEGORY_ORDER = [
  '진로',
  '취업',
  '시험',
  '학업',
  '소득',
  '연애',
  '결혼',
  '부모',
  '자녀',
  '우울',
  '불안',
  '외로움',
  '직장',
  '워라밸',
  '외모',
  '자존감',
  '건강',
  '노후',
  '미래',
  '잡담',
  '주거',
] as const satisfies readonly WorryCategory[];

export const ONBOARDING_INTEREST_GRID = {
  columns: 3,
  rows: 7,
  chipWidthPx: 103,
  chipHeightPx: 44,
  chipRadiusPx: 22,
  chipBorderWidthPx: 2,
  columnGapPx: 7,
  rowGapPx: 13,
  selectedBorderColor: '#ff8b0d',
  unselectedBackgroundColor: '#fff1d1',
  unselectedBorderColor: '#d4be91',
  textSizePx: 14,
  textLetterSpacingPx: -0.14,
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

export type OnboardingField = 'nickname' | 'gender' | 'age' | 'interests';

export type OnboardingBasicValues = {
  readonly nickname: string;
  readonly gender: OnboardingGenderValue;
  readonly age: string;
};

export type OnboardingInterestsValues = {
  readonly selectedInterests: readonly WorryCategory[];
};

export type OnboardingScreenProps = ProcessingState & {
  readonly values: OnboardingBasicValues & OnboardingInterestsValues;
  readonly validationMessages: FieldValidationMessages<OnboardingField>;
  readonly duplicateCheck: {
    readonly state: OnboardingDuplicateCheckState;
    readonly message?: string;
  };
  readonly onNicknameChange: (value: string) => void;
  readonly onGenderChange: (value: Exclude<OnboardingGenderValue, ''>) => void;
  readonly onAgeChange: (value: string) => void;
  readonly onInterestToggle: (value: WorryCategory) => void;
  readonly onDuplicateCheck: () => void;
  readonly onContinue: () => void;
  readonly onSubmit: () => void;
};
