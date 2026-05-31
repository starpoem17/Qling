import { useState } from 'react';
import { WORRY_CATEGORIES, type WorryCategory } from '@midnight-radio/domain';
import type { User } from 'firebase/auth';
import { DEFAULT_PROFILE_COLOR, type ProfileColor } from '../../lib/profileColor';
import {
  completeOnboardingViaApi,
  createExampleWorriesViaApi,
  reserveNicknameViaApi,
} from '../../services/userProfile/apiClient';
import { submitAvailableOnboarding } from '../../services/userProfile/onboardingFlow';
import {
  canSubmitOnboarding,
  mapReservationResultToDuplicateState,
  validateOnboardingDraft,
  type OnboardingDuplicateUiState,
} from '../../services/userProfile/onboardingProfile';
import type { OnboardingScreenProps } from './contract';
import { OnboardingScreen } from './OnboardingScreen';

type Props = {
  readonly user: User | null;
  readonly isProcessing: boolean;
  readonly setIsProcessing: (value: boolean) => void;
  readonly onComplete: (profile: unknown) => void;
  readonly onError: (message: string) => void;
};

export function OnboardingContainer(props: Props) {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [age, setAge] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<WorryCategory[]>([]);
  const [selectedProfileColor, setSelectedProfileColor] = useState<ProfileColor>(DEFAULT_PROFILE_COLOR);
  const [duplicateState, setDuplicateState] = useState<OnboardingDuplicateUiState>('idle');
  const [duplicateMessage, setDuplicateMessage] = useState<string | undefined>();

  const draft = { nickname, gender, age, interests: selectedInterests, profileColor: selectedProfileColor };
  const validation = validateOnboardingDraft(draft);

  const validationMessages: OnboardingScreenProps['validationMessages'] = {
    nickname: validation.nickname.valid === false ? validation.nickname.message : undefined,
    gender: !validation.gender.valid ? validation.gender.message : undefined,
    age: validation.age.valid === false ? validation.age.message : undefined,
    interests: !validation.interests.valid ? validation.interests.message : undefined,
    profileColor: !validation.profileColor.valid ? validation.profileColor.message : undefined,
  };

  const disabled = !canSubmitOnboarding({ draft, duplicateState });

  const handleDuplicateCheck = async () => {
    if (!props.user) return;
    setDuplicateState('checking');
    setDuplicateMessage(undefined);
    try {
      const result = await reserveNicknameViaApi({ user: props.user, nickname });
      const state = mapReservationResultToDuplicateState(result);
      setDuplicateState(state);
      setDuplicateMessage(result.status === 'available' ? '사용할 수 있는 닉네임이에요.' : result.message);
    } catch {
      setDuplicateState('network-failed');
      setDuplicateMessage('닉네임 확인 중 문제가 발생했어요. 다시 시도해주세요.');
    }
  };

  const handleSubmit = async () => {
    if (!props.user || disabled) return;
    props.setIsProcessing(true);
    try {
      await submitAvailableOnboarding({
        user: props.user,
        disabled,
        profile: {
          nickname: validation.nickname.valid ? validation.nickname.nickname : nickname,
          gender: gender === '' ? 'female' : gender,
          age: validation.age.valid ? validation.age.age : 0,
          interests: selectedInterests,
          profileColor: selectedProfileColor,
        },
        deps: {
          completeOnboarding: completeOnboardingViaApi,
          createExamples: createExampleWorriesViaApi,
          onComplete: props.onComplete,
          onError: props.onError,
        },
      });
    } finally {
      props.setIsProcessing(false);
    }
  };

  return (
    <OnboardingScreen
      values={{ nickname, gender, age, selectedInterests, selectedProfileColor }}
      validationMessages={validationMessages}
      duplicateCheck={{ state: duplicateState, message: duplicateMessage }}
      isProcessing={props.isProcessing}
      disabled={disabled}
      disabledReason={disabled ? 'missing-required-field' : undefined}
      categoryOptions={WORRY_CATEGORIES}
      onNicknameChange={value => {
        setNickname(value);
        setDuplicateState('idle');
        setDuplicateMessage(undefined);
      }}
      onGenderChange={setGender}
      onAgeChange={setAge}
      onInterestToggle={category => {
        setSelectedInterests(current => current.includes(category)
          ? current.filter(item => item !== category)
          : [...current, category]);
      }}
      onProfileColorChange={setSelectedProfileColor}
      onDuplicateCheck={handleDuplicateCheck}
      onContinue={() => undefined}
      onSubmit={handleSubmit}
    />
  );
}
