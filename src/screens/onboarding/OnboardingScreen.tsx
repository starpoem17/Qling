import { useState } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import type { WorryCategory } from '@midnight-radio/domain';
import { cn } from '../../lib/utils';
import { PROFILE_COLOR_OPTIONS, type ProfileColor } from '../../lib/profileColor';
import {
  ONBOARDING_INTEREST_GRID,
  ONBOARDING_PROFILE_COLOR_GRID,
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

type VisualStep = 'basic' | 'interests' | 'profileColor';

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
  const onboardingCanvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';

  const handleBasicNext = () => {
    if (!basicStepComplete || props.isProcessing) return;
    setVisualStep('interests');
  };

  return (
    <section className="h-full w-full overflow-hidden bg-[#fff7e3] text-[#1a1a1a]">
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden bg-[#fff7e3]">
        <div
          className="relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#ff8b0d]"
          style={{ transform: `scale(${onboardingCanvasScale})` }}
        >
          <div className="absolute left-[-1px] top-[196px] h-[656px] w-[394px] rounded-tl-[44px] rounded-tr-[44px] border-t border-[#b99b62] bg-[#fff7e3] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]" />
          <p className="absolute top-[70px] text-[17px] font-extrabold leading-none tracking-[-0.34px] text-white" style={{ left: visualStep === 'interests' ? 171 : 165 }}>
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
          ) : visualStep === 'interests' ? (
            <InterestsStep
              props={props}
              orderedCategoryOptions={orderedCategoryOptions}
              onPrevious={() => setVisualStep('basic')}
              onNext={() => setVisualStep('profileColor')}
            />
          ) : (
            <ProfileColorStep
              props={props}
              onPrevious={() => setVisualStep('interests')}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function ProgressHeader({
  question,
  title,
  subtitle,
  secondSubtitle,
  progressWidthClassName,
}: {
  readonly question: string;
  readonly title: string;
  readonly subtitle: string;
  readonly secondSubtitle?: string;
  readonly progressWidthClassName: string;
}) {
  return (
    <>
      <p className="absolute left-[30px] top-[127px] text-[10px] font-black leading-[19.5px] tracking-[3px] text-[#fff1d1]">{question}</p>
      <h1 className="absolute left-[28px] top-[147px] text-[26px] font-extrabold leading-[31px] tracking-[-1.3px] text-white">{title}</h1>
      <div className="absolute left-[24px] top-[235px] h-[6px] w-[345px] rounded-[3px] bg-[#f2e5d3]" />
      <div className={cn('absolute left-[24px] top-[235px] h-[6px] rounded-[3px] bg-[#ff8b3d]', progressWidthClassName)} />
      <p className="absolute left-[24px] top-[258px] text-[13px] font-bold leading-[17px] tracking-[-0.13px] text-[#8e9095]">{subtitle}</p>
      {secondSubtitle && (
        <p className="absolute left-[24px] top-[277px] text-[13px] font-bold leading-[17px] tracking-[-0.13px] text-[#8e9095]">{secondSubtitle}</p>
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
        progressWidthClassName="w-[115px]"
      />

      <label className="absolute left-[22px] top-[307px] text-[14px] font-extrabold leading-none tracking-normal" htmlFor="onboarding-nickname">닉네임</label>
      {!hasNicknameMessage && (
        <p id="onboarding-nickname-message" className="absolute left-[89px] top-[308px] text-[12px] font-bold leading-[17px] tracking-normal text-[#d4be91]">
          2~10자 · 한글, 영문, 숫자 사용 가능
        </p>
      )}
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
        className="absolute left-[24px] top-[752px] h-[56px] w-[345px] rounded-[28px] bg-[#ff8b3d] text-[17px] font-extrabold leading-none tracking-normal text-white disabled:cursor-not-allowed disabled:opacity-55"
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
  onNext,
}: {
  readonly props: Props;
  readonly orderedCategoryOptions: readonly WorryCategory[];
  readonly onPrevious: () => void;
  readonly onNext: () => void;
}) {
  const canContinue = !props.validationMessages.interests && props.values.selectedInterests.length > 0;

  return (
    <>
      <ProgressHeader
        question="QUESTION 2"
        title="주요 관심사는 무엇인가요?"
        subtitle="고민매칭에 필요해요! 언제든 나중에 수정할 수 있어요."
        secondSubtitle="최소 1개 선택, 복수 선택 가능"
        progressWidthClassName="w-[230px]"
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
        onClick={onNext}
        disabled={!canContinue || props.isProcessing}
        aria-label={canContinue ? '프로필 색상 선택으로 이동' : '관심 분야를 선택해야 이동 가능'}
        className="absolute left-[130px] top-[752px] h-[56px] w-[239px] rounded-[28px] bg-[#ff8b3d] text-[17px] font-extrabold leading-none tracking-normal text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        다음
      </button>
    </>
  );
}

function ProfileColorStep({
  props,
  onPrevious,
}: {
  readonly props: Props;
  readonly onPrevious: () => void;
}) {
  return (
    <>
      <p className="absolute left-[30px] top-[127px] text-[10px] font-black leading-[19.5px] tracking-[3px] text-[#fff1d1]">CUSTOMIZING</p>
      <h1 className="absolute left-[28px] top-[147px] text-[26px] font-extrabold leading-[34px] tracking-normal text-white">프로필 설정을 해주세요</h1>
      <div className="absolute left-[24px] top-[235px] h-[6px] w-[345px] rounded-[3px] bg-[#f2e5d3]" />
      <div className="absolute left-[24px] top-[235px] h-[6px] w-[345px] rounded-[3px] bg-[#ff8b3d]" />

      <h2 className="absolute left-[24px] top-[253px] text-[20px] font-black leading-7 tracking-normal text-[#545454]">프로필 색상을 골라주세요</h2>
      <p className="absolute left-[24px] top-[289px] w-[345px] text-[13px] font-normal leading-[18px] tracking-normal text-[#8b847a]">
        나를 표현할 색을 골라보세요. 익명이지만, 나만의 색이 생겨요.
      </p>

      <div className="absolute left-[112px] top-[343px] h-[168px] w-[168px] rounded-full bg-[rgb(255_255_255/0.7)]" />
      <div className="absolute left-[138px] top-[371px] h-[116px] w-[116px] drop-shadow-[6px_8px_0_rgba(128,87,33,0.18)]">
        <ProfileAvatarPreview color={props.values.selectedProfileColor} />
      </div>

      <div
        className="absolute left-[54px] top-[549px] grid w-[286px] grid-cols-5 gap-x-[14px] gap-y-[20px]"
        aria-label="프로필 색상 선택"
        data-columns={ONBOARDING_PROFILE_COLOR_GRID.columns}
      >
        {PROFILE_COLOR_OPTIONS.map(color => (
          <ProfileColorSwatch
            key={color}
            color={color}
            selected={props.values.selectedProfileColor === color}
            disabled={props.isProcessing}
            onSelect={() => props.onProfileColorChange(color)}
          />
        ))}
      </div>
      {props.validationMessages.profileColor && (
        <p className="absolute left-[54px] top-[683px] text-[13px] font-bold text-[#ea4335]" role="alert">
          {props.validationMessages.profileColor}
        </p>
      )}

      <button
        type="button"
        onClick={onPrevious}
        disabled={props.isProcessing}
        className="absolute left-[24px] top-[752px] h-[56px] w-[100px] rounded-[28px] border-[1.4px] border-[#efe2d0] bg-white text-[16px] font-bold leading-none tracking-normal text-[#8b847a] disabled:cursor-not-allowed disabled:opacity-55"
      >
        이전
      </button>
      <button
        type="button"
        onClick={props.onSubmit}
        disabled={props.disabled || props.isProcessing}
        aria-label={props.disabled ? '필수 정보를 완료해야 온보딩 완료 가능' : '온보딩 완료'}
        aria-busy={props.isProcessing || undefined}
        className="absolute left-[130px] top-[752px] h-[56px] w-[239px] rounded-[28px] bg-[#ff8b3d] text-[17px] font-extrabold leading-none tracking-normal text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {props.isProcessing ? '처리 중' : '완료'}
      </button>
    </>
  );
}

function ProfileColorSwatch({
  color,
  selected,
  disabled,
  onSelect,
}: {
  readonly color: ProfileColor;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`프로필 색상 ${color}`}
      className={cn(
        'relative h-[46px] w-[46px] rounded-full border-[3px] border-white transition-transform focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2 focus:ring-offset-[#fff7e3] disabled:cursor-not-allowed disabled:opacity-55',
        selected && 'ring-[3px] ring-[#ff8b3d] ring-offset-0',
      )}
      style={{ backgroundColor: color }}
    >
      {selected && <Check className="absolute left-[9px] top-[8px] h-7 w-7 text-white" strokeWidth={2.4} aria-hidden="true" />}
    </button>
  );
}

function ProfileAvatarPreview({ color }: { readonly color: ProfileColor }) {
  return (
    <svg width="116" height="116" viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="block h-full w-full">
      <circle cx="54" cy="54" r="54" fill={color} />
      <path d="M51.6143 55.3327C51.7625 70.315 46.9722 72.7348 41.2459 72.7348C35.5195 72.7348 30.5003 69.4912 30.8774 55.3327C31.2544 41.1742 35.5195 37.9307 41.2459 37.9307C46.9722 37.9307 51.4662 40.3505 51.6143 55.3327Z" fill="#FFF5EB" />
      <mask id="onboarding-profile-eye-left" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="30" y="37" width="23" height="36">
        <path d="M52.1308 55.1012C52.2826 70.2817 47.3732 72.7336 41.5044 72.7336C35.6355 72.7336 30.4915 69.4471 30.8779 55.1012C31.2643 40.7553 35.6355 37.4688 41.5044 37.4688C47.3732 37.4688 51.979 39.9206 52.1308 55.1012Z" fill="#FFF5EB" />
      </mask>
      <g mask="url(#onboarding-profile-eye-left)">
        <path d="M55.527 55.8039C55.527 62.8958 51.972 68.6449 47.5868 68.6449C43.2015 68.6449 39.6465 65.3867 39.6465 55.8039C39.6465 48.712 43.2015 42.9629 47.5868 42.9629C51.972 42.9629 55.527 48.712 55.527 55.8039Z" fill="#1A1A1A" />
      </g>
      <path d="M76.7204 55.3327C76.8754 70.315 71.8624 72.7348 65.8697 72.7348C59.877 72.7348 54.6244 69.4912 55.0189 55.3327C55.4135 41.1742 59.877 37.9307 65.8697 37.9307C71.8624 37.9307 76.5654 40.3505 76.7204 55.3327Z" fill="#FFF5EB" />
      <mask id="onboarding-profile-eye-right" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="55" y="37" width="22" height="36">
        <path d="M76.7187 55.1012C76.8705 70.2817 71.9611 72.7336 66.0923 72.7336C60.2234 72.7336 55.0794 69.4471 55.4658 55.1012C55.8522 40.7553 60.2234 37.4688 66.0923 37.4688C71.9611 37.4688 76.5669 39.9206 76.7187 55.1012Z" fill="#FFF5EB" />
      </mask>
      <g mask="url(#onboarding-profile-eye-right)">
        <path d="M80.113 55.8039C80.113 62.8958 76.558 68.6449 72.1727 68.6449C67.7874 68.6449 64.2324 65.3867 64.2324 55.8039C64.2324 48.712 67.7874 42.9629 72.1727 42.9629C76.558 42.9629 80.113 48.712 80.113 55.8039Z" fill="#1A1A1A" />
      </g>
    </svg>
  );
}
