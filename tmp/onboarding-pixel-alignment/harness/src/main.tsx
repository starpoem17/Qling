import React from 'react';
import { createRoot } from 'react-dom/client';
import { WORRY_CATEGORIES, type WorryCategory } from '@midnight-radio/domain';
import '../../../../dist/assets/index-BKXD6mF0.css';
import { OnboardingScreen } from '../../../../src/screens/onboarding/OnboardingScreen';
import type { OnboardingScreenProps } from '../../../../src/screens/onboarding/contract';

const params = new URLSearchParams(window.location.search);
const state = params.get('state') ?? '03';

function Harness() {
  const [nickname, setNickname] = React.useState('라미');
  const [gender, setGender] = React.useState<'male' | 'female' | ''>('female');
  const [age, setAge] = React.useState('25');
  const [selectedInterests, setSelectedInterests] = React.useState<WorryCategory[]>(['진로', '소득', '자존감', '미래']);

  const props: OnboardingScreenProps = {
    values: { nickname, gender, age, selectedInterests },
    validationMessages: state === '04' ? {} : state === '05' ? {} : {},
    duplicateCheck: state === '04'
      ? { state: 'duplicate', message: '사용중인 닉네임이에요! 다른 닉네임으로 시도해주세요.' }
      : { state: 'available', message: undefined },
    isProcessing: false,
    disabled: selectedInterests.length === 0,
    onNicknameChange: setNickname,
    onGenderChange: setGender,
    onAgeChange: setAge,
    onInterestToggle: category => {
      setSelectedInterests(current => current.includes(category)
        ? current.filter(item => item !== category)
        : [...current, category]);
    },
    onDuplicateCheck: () => undefined,
    onContinue: () => undefined,
    onSubmit: () => undefined,
  };

  React.useEffect(() => {
    if (state === '05') {
      window.setTimeout(() => {
        const nextButton = document.querySelector<HTMLButtonElement>('button[aria-label="관심사 선택으로 이동"]');
        nextButton?.click();
      }, 0);
    }
  }, []);

  return <OnboardingScreen {...props} categoryOptions={WORRY_CATEGORIES} />;
}

createRoot(document.getElementById('root')!).render(<Harness />);
