import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { WorryCategory } from '@midnight-radio/domain';
import { cn } from '../../lib/utils';
import {
  ONBOARDING_INTEREST_GRID,
  orderOnboardingInterestCategories,
  type OnboardingScreenProps,
} from './contract';

type Props = OnboardingScreenProps & {
  readonly categoryOptions: readonly WorryCategory[];
};

const genderOptions = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
] as const;

type VisualStep = 'basic' | 'interests';

export function OnboardingScreen(props: Props) {
  const [visualStep, setVisualStep] = useState<VisualStep>('basic');
  const nicknameError = props.validationMessages.nickname;
  const duplicateMessage = props.duplicateCheck.message;
  const duplicateIsPositive = props.duplicateCheck.state === 'available';
  const duplicateButtonDisabled = props.isProcessing
    || props.duplicateCheck.state === 'checking'
    || Boolean(nicknameError)
    || props.values.nickname.trim().length === 0;
  const basicStepComplete = !props.validationMessages.nickname
    && !props.validationMessages.gender
    && !props.validationMessages.age
    && props.duplicateCheck.state === 'available';
  const orderedCategoryOptions = orderOnboardingInterestCategories(props.categoryOptions);

  const handleBasicNext = () => {
    if (!basicStepComplete || props.isProcessing) return;
    setVisualStep('interests');
  };

  return (
    <section className="mx-auto flex min-h-dvh w-full justify-center bg-[#ff8b0d] text-[#1a1a1a]">
      <div className="relative h-[852px] w-[393px] shrink-0 overflow-hidden bg-[#ff8b0d]">
        <div className="absolute left-0 top-[196px] h-[656px] w-[393px] rounded-tl-[44px] rounded-tr-[44px] border-t border-[#b99b62] bg-[#fff7e3]" />
        <p className="absolute top-[70px] text-[17px] font-extrabold leading-none tracking-normal text-white" style={{ left: visualStep === 'interests' ? 171 : 165 }}>
          회원가입
        </p>

        {visualStep === 'basic' ? (
          <BasicStep
            props={props}
            nicknameError={nicknameError}
            duplicateMessage={duplicateMessage}
            duplicateIsPositive={duplicateIsPositive}
            duplicateButtonDisabled={duplicateButtonDisabled}
            basicStepComplete={basicStepComplete}
            onNext={handleBasicNext}
          />
        ) : (
          <InterestsStep
            props={props}
            orderedCategoryOptions={orderedCategoryOptions}
            onPrevious={() => setVisualStep('basic')}
          />
        )}
      </div>
    </section>
  );
}

function ProgressHeader({
  question,
  title,
  subtitle,
  secondSubtitle,
  progressClassName,
}: {
  readonly question: string;
  readonly title: string;
  readonly subtitle: string;
  readonly secondSubtitle?: string;
  readonly progressClassName: string;
}) {
  return (
    <>
      <p className="absolute left-[30px] top-[127px] text-[10px] font-black leading-[19.5px] tracking-[3px] text-[#fff1d1]">{question}</p>
      <h1 className="absolute left-[28px] top-[141px] text-[26px] font-extrabold leading-[34px] tracking-normal text-white">{title}</h1>
      <div className="absolute left-[24px] top-[235px] h-[6px] w-[345px] rounded-[3px] bg-[#2a2c30]" />
      <div className={cn('absolute top-[235px] h-[6px] w-[190px] rounded-[3px] bg-[#ff8b0d]', progressClassName)} />
      <p className="absolute left-[24px] top-[258px] text-[13px] font-bold leading-[19px] tracking-normal text-[#8e9095]">{subtitle}</p>
      {secondSubtitle && (
        <p className="absolute left-[24px] top-[277px] text-[13px] font-bold leading-[19px] tracking-normal text-[#8e9095]">{secondSubtitle}</p>
      )}
    </>
  );
}

function BasicStep({
  props,
  nicknameError,
  duplicateMessage,
  duplicateIsPositive,
  duplicateButtonDisabled,
  basicStepComplete,
  onNext,
}: {
  readonly props: Props;
  readonly nicknameError?: string;
  readonly duplicateMessage?: string;
  readonly duplicateIsPositive: boolean;
  readonly duplicateButtonDisabled: boolean;
  readonly basicStepComplete: boolean;
  readonly onNext: () => void;
}) {
  const hasNicknameMessage = Boolean(nicknameError || duplicateMessage);
  const nicknameHasError = Boolean(nicknameError) || (!duplicateIsPositive && Boolean(duplicateMessage));

  return (
    <>
      <ProgressHeader
        question="QUESTION 1"
        title="기본 정보를 알려주세요"
        subtitle="본인에 대해 소개해주세요! 외부에는 공개되지 않아요."
        progressClassName="left-[24px]"
      />

      <label className="absolute left-[22px] top-[307px] text-[14px] font-extrabold leading-none tracking-normal" htmlFor="onboarding-nickname">닉네임</label>
      {hasNicknameMessage && (
        <p
          id="onboarding-nickname-message"
          className={cn(
            'absolute left-[89px] top-[308px] text-[13px] font-bold leading-none tracking-normal',
            duplicateIsPositive ? 'text-[#4f9f68]' : 'text-[#ea4335]',
          )}
          role={duplicateIsPositive ? 'status' : 'alert'}
        >
          {duplicateIsPositive && <CheckCircle2 className="mr-1 inline h-4 w-4 align-[-0.2em]" aria-hidden="true" />}
          {nicknameError ?? duplicateMessage}
        </p>
      )}
      <div
        className={cn(
          'absolute left-[22px] top-[339px] h-[60px] w-[345px] overflow-hidden rounded-[14px] border-[1.5px] bg-transparent',
          nicknameHasError ? 'border-[#ea4335]' : duplicateIsPositive ? 'border-[#4f9f68]' : 'border-[#d4be91]',
        )}
      >
        <input
          id="onboarding-nickname"
          value={props.values.nickname}
          onChange={event => props.onNicknameChange(event.target.value)}
          className="absolute left-[18.5px] top-0 h-[60px] w-[210px] bg-transparent text-[16px] font-bold leading-none tracking-normal outline-none placeholder:text-[#8e9095] disabled:cursor-not-allowed disabled:opacity-60"
          maxLength={24}
          placeholder="닉네임 입력"
          aria-invalid={nicknameHasError || undefined}
          aria-describedby="onboarding-nickname-message"
          disabled={props.isProcessing}
        />
        <button
          type="button"
          onClick={props.onDuplicateCheck}
          disabled={duplicateButtonDisabled}
          aria-label="닉네임 중복 확인"
          aria-busy={props.duplicateCheck.state === 'checking' || undefined}
          className={cn(
            'absolute left-[245.5px] top-[10.5px] h-[36px] w-[86px] rounded-[18px] border-[1.5px] text-[13px] font-semibold leading-none tracking-normal disabled:cursor-not-allowed disabled:opacity-55',
            nicknameHasError ? 'border-[#ea3535] text-[#ea4335]' : 'border-[#d4be91] text-[#1a1a1a]',
          )}
        >
          {props.duplicateCheck.state === 'checking' ? '확인 중' : '중복확인'}
        </button>
      </div>

      <p className="absolute left-[22px] top-[420px] text-[14px] font-extrabold leading-none tracking-normal">성별</p>
      <div className="absolute left-[22px] top-[452px] grid h-[60px] w-[345px] grid-cols-2 gap-[7px]">
        {genderOptions.map(option => {
          const selected = props.values.gender === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => props.onGenderChange(option.value)}
              disabled={props.isProcessing}
              aria-pressed={selected}
              className={cn(
                'h-[60px] rounded-[14px] border-[1.5px] bg-transparent text-[16px] font-bold leading-none tracking-normal disabled:cursor-not-allowed disabled:opacity-55',
                selected
                  ? 'border-2 border-[#ff8b3d] text-[#ff8b3d]'
                  : 'border-[#d4be91] text-[#1a1a1a]',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {props.validationMessages.gender && (
        <p className="absolute left-[22px] top-[520px] text-[13px] font-bold text-[#ea4335]" role="alert">
          {props.validationMessages.gender}
        </p>
      )}

      <label className="absolute left-[22px] top-[548px] text-[14px] font-extrabold leading-none tracking-normal" htmlFor="onboarding-age">나이</label>
      <div
        className={cn(
          'absolute left-[22px] top-[580px] h-[60px] w-[345px] overflow-hidden rounded-[14px] border-[1.5px] bg-transparent',
          props.validationMessages.age ? 'border-[#ea4335]' : 'border-[#d4be91]',
        )}
      >
        <input
          id="onboarding-age"
          inputMode="numeric"
          value={props.values.age}
          onChange={event => props.onAgeChange(event.target.value)}
          className="absolute left-[24.5px] top-0 h-[60px] w-[250px] bg-transparent text-[16px] font-bold leading-none tracking-normal outline-none placeholder:text-[#8e9095] disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="만 나이 입력"
          aria-invalid={Boolean(props.validationMessages.age) || undefined}
          aria-describedby="onboarding-age-message"
          disabled={props.isProcessing}
        />
        <span className="pointer-events-none absolute left-[308.5px] top-[19px] text-[16px] font-bold leading-none tracking-normal text-[#d4be91]">세</span>
      </div>
      {props.validationMessages.age && (
        <p id="onboarding-age-message" className="absolute left-[22px] top-[648px] text-[13px] font-bold text-[#ea4335]" role="alert">
          {props.validationMessages.age}
        </p>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!basicStepComplete || props.isProcessing}
        aria-label={basicStepComplete ? '관심사 선택으로 이동' : '필수 기본 정보와 닉네임 중복 확인 완료 후 이동 가능'}
        className="absolute left-[24px] top-[752px] h-[56px] w-[345px] rounded-[28px] bg-[#ff8b0d] text-[17px] font-extrabold leading-none tracking-normal text-[#121316] disabled:cursor-not-allowed disabled:opacity-55"
      >
        다음
      </button>
    </>
  );
}

function InterestsStep({
  props,
  orderedCategoryOptions,
  onPrevious,
}: {
  readonly props: Props;
  readonly orderedCategoryOptions: readonly WorryCategory[];
  readonly onPrevious: () => void;
}) {
  return (
    <>
      <ProgressHeader
        question="QUESTION 2"
        title="주요 관심사는 무엇인가요?"
        subtitle="고민매칭에 필요해요! 언제든 나중에 수정할 수 있어요."
        secondSubtitle="최소 1개 선택, 복수 선택 가능"
        progressClassName="left-[180px]"
      />

      <div
        className="absolute left-[34px] top-[322px] grid w-[324px] grid-cols-3 justify-center gap-x-[7px] gap-y-[13px] max-w-[323px]"
        aria-label="관심 분야 선택"
        data-columns={ONBOARDING_INTEREST_GRID.columns}
        data-rows={ONBOARDING_INTEREST_GRID.rows}
      >
        {orderedCategoryOptions.map(category => {
          const selected = props.values.selectedInterests.includes(category);
          const displayLabel = category === '워라밸' ? '워라벨' : category;
          return (
            <button
              key={category}
              type="button"
              disabled={props.isProcessing}
              aria-pressed={selected}
              onClick={() => props.onInterestToggle(category)}
              className={cn(
                'box-border h-[44px] w-[103px] max-w-[103px] rounded-[22px] border-2 px-1 py-0 text-[14px] font-bold leading-none tracking-normal disabled:cursor-not-allowed disabled:opacity-55',
                selected
                  ? 'border-[#ff8b0d] bg-transparent text-[#2a2a2a]'
                  : 'border-[#d4be91] bg-[#fff1d1] text-[#25272b]',
              )}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
      {props.validationMessages.interests && (
        <p className="absolute left-[34px] top-[716px] text-[13px] font-bold text-[#ea4335]" role="alert">
          {props.validationMessages.interests}
        </p>
      )}

      <button
        type="button"
        onClick={onPrevious}
        disabled={props.isProcessing}
        className="absolute left-[24px] top-[752px] h-[56px] w-[96px] rounded-[28px] border-2 border-[#d4be91] text-[17px] font-extrabold leading-none tracking-normal text-[#121316] disabled:cursor-not-allowed disabled:opacity-55"
      >
        이전
      </button>
      <button
        type="button"
        onClick={props.onSubmit}
        disabled={props.disabled || props.isProcessing}
        aria-label={props.disabled ? '필수 정보를 완료해야 온보딩 완료 가능' : '온보딩 완료'}
        aria-busy={props.isProcessing || undefined}
        className="absolute left-[130px] top-[752px] h-[56px] w-[239px] rounded-[28px] bg-[#ff8b0d] text-[17px] font-extrabold leading-none tracking-normal text-[#121316] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {props.isProcessing ? '처리 중' : '완료'}
      </button>
    </>
  );
}
