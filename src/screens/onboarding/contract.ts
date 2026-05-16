import type { WorryCategory } from '@midnight-radio/domain';
import type { FieldValidationMessages, ProcessingState } from '../shared/contract';

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
