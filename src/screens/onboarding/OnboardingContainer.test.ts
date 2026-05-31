import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import {
  canSubmitOnboarding,
  mapReservationResultToDuplicateState,
  validateOnboardingDraft,
  type OnboardingDraft,
  type OnboardingDuplicateUiState,
} from '../../services/userProfile/onboardingProfile';
import { submitAvailableOnboarding } from '../../services/userProfile/onboardingFlow';

const validDraft: OnboardingDraft = {
  nickname: '라미',
  gender: 'female',
  age: '20',
  interests: ['워라밸'],
  profileColor: '#FF8B3D',
};

function canSubmit(draft: OnboardingDraft, duplicateState: OnboardingDuplicateUiState) {
  return canSubmitOnboarding({ draft, duplicateState });
}

test('initial and missing required onboarding states are blocked before nickname availability is proven', () => {
  assert.equal(canSubmit(validDraft, 'idle'), false);
  assert.equal(canSubmit({ ...validDraft, nickname: '' }, 'available'), false);
  assert.equal(canSubmit({ ...validDraft, gender: '' }, 'available'), false);
  assert.equal(canSubmit({ ...validDraft, age: '' }, 'available'), false);
  assert.equal(canSubmit({ ...validDraft, interests: [] }, 'available'), false);
});

test('nickname duplicate invalid network-failed and retry states block until a later available state', () => {
  assert.equal(mapReservationResultToDuplicateState({ status: 'invalid', code: 'tooShort', message: 'invalid' }), 'invalid');
  assert.equal(mapReservationResultToDuplicateState({ status: 'duplicate', code: 'nickname_taken', message: 'duplicate' }), 'duplicate');
  assert.equal(mapReservationResultToDuplicateState({ status: 'server_error', code: 'network_failed', message: 'failed' }), 'network-failed');
  assert.equal(mapReservationResultToDuplicateState({ status: 'conflict', code: 'transaction_conflict', message: 'retry' }), 'retry');

  for (const state of ['invalid', 'duplicate', 'network-failed', 'retry'] as const) {
    assert.equal(canSubmit(validDraft, state), false);
  }
  assert.equal(canSubmit(validDraft, 'available'), true);
});

test('required age and interests behavior is enforced by service state', () => {
  assert.equal(validateOnboardingDraft({ ...validDraft, age: '' }).age.valid, false);
  assert.equal(validateOnboardingDraft({ ...validDraft, age: '스무살' }).age.valid, false);
  assert.equal(validateOnboardingDraft({ ...validDraft, age: '14' }).age.valid, true);
  assert.equal(validateOnboardingDraft({ ...validDraft, interests: [] }).interests.valid, false);
  assert.deepEqual(validateOnboardingDraft({ ...validDraft, interests: [WORRY_CATEGORIES[14]] }).interests, {
    valid: true,
    interests: ['워라밸'],
  });
  assert.equal(canSubmit({ ...validDraft, age: '14', interests: ['워라밸'] }, 'available'), true);
});

test('onboarding side effects complete profile then examples then route completion', async () => {
  const calls: string[] = [];
  const result = await submitAvailableOnboarding({
    user: { uid: 'user-1' } as never,
    disabled: false,
    profile: { nickname: '라미', gender: 'female', age: 20, interests: ['워라밸'], profileColor: '#FF8B3D' },
    deps: {
      async completeOnboarding() {
        calls.push('completeOnboarding');
        return { status: 'completed', profile: { uid: 'user-1', nickname: '라미', normalizedNickname: '라미', gender: 'female', age: 20, interests: ['워라밸'], profileColor: '#FF8B3D' } };
      },
      async createExamples() {
        calls.push('createExamples');
      },
      onComplete() {
        calls.push('onComplete');
      },
      onError(message) {
        calls.push(`onError:${message}`);
      },
    },
  });

  assert.equal(result, 'completed');
  assert.deepEqual(calls, ['completeOnboarding', 'createExamples', 'onComplete']);
});

test('profile completion failure does not create examples or route transition', async () => {
  const calls: string[] = [];
  const result = await submitAvailableOnboarding({
    user: { uid: 'user-1' } as never,
    disabled: false,
    profile: { nickname: '라미', gender: 'female', age: 20, interests: ['워라밸'], profileColor: '#FF8B3D' },
    deps: {
      async completeOnboarding() {
        calls.push('completeOnboarding');
        return { status: 'reservation_missing', code: 'nickname_reservation_missing', message: '닉네임 중복 확인을 먼저 완료해주세요.' };
      },
      async createExamples() {
        calls.push('createExamples');
      },
      onComplete() {
        calls.push('onComplete');
      },
      onError(message) {
        calls.push(`onError:${message}`);
      },
    },
  });

  assert.equal(result, 'failed');
  assert.deepEqual(calls, ['completeOnboarding', 'onError:닉네임 중복 확인을 먼저 완료해주세요.']);
});

test('example creation failure blocks route transition under current implementation', async () => {
  const calls: string[] = [];
  const result = await submitAvailableOnboarding({
    user: { uid: 'user-1' } as never,
    disabled: false,
    profile: { nickname: '라미', gender: 'female', age: 20, interests: ['워라밸'], profileColor: '#FF8B3D' },
    deps: {
      async completeOnboarding() {
        calls.push('completeOnboarding');
        return { status: 'completed', profile: { uid: 'user-1', nickname: '라미', normalizedNickname: '라미', gender: 'female', age: 20, interests: ['워라밸'], profileColor: '#FF8B3D' } };
      },
      async createExamples() {
        calls.push('createExamples');
        throw new Error('examples failed');
      },
      onComplete() {
        calls.push('onComplete');
      },
      onError(message) {
        calls.push(`onError:${message}`);
      },
    },
  });

  assert.equal(result, 'failed');
  assert.deepEqual(calls, ['completeOnboarding', 'createExamples', 'onError:examples failed']);
});

test('disabled submission is blocked before API side effects', async () => {
  const calls: string[] = [];
  const result = await submitAvailableOnboarding({
    user: { uid: 'user-1' } as never,
    disabled: true,
    profile: { nickname: '라미', gender: 'female', age: 20, interests: ['워라밸'], profileColor: '#FF8B3D' },
    deps: {
      async completeOnboarding() {
        calls.push('completeOnboarding');
        throw new Error('should not run');
      },
      async createExamples() {
        calls.push('createExamples');
      },
      onComplete() {
        calls.push('onComplete');
      },
      onError(message) {
        calls.push(`onError:${message}`);
      },
    },
  });

  assert.equal(result, 'blocked');
  assert.deepEqual(calls, []);
});

test('onboarding screen remains presentational while container owns API calls', () => {
  const screen = fs.readFileSync('src/screens/onboarding/OnboardingScreen.tsx', 'utf8');
  const container = fs.readFileSync('src/screens/onboarding/OnboardingContainer.tsx', 'utf8');

  assert.doesNotMatch(screen, /apiClient|firebase|fetch\(|completeOnboardingViaApi|reserveNicknameViaApi/);
  assert.match(container, /reserveNicknameViaApi/);
  assert.match(container, /submitAvailableOnboarding/);
});

test('onboarding interests use a responsive three-column chip grid contract', () => {
  const screen = fs.readFileSync('src/screens/onboarding/OnboardingScreen.tsx', 'utf8');

  assert.match(screen, /grid-cols-3/);
  assert.match(screen, /max-w-\[323px\]/);
  assert.match(screen, /gap-x-\[7px\]/);
  assert.match(screen, /gap-y-\[13px\]/);
  assert.match(screen, /h-\[44px\]/);
  assert.match(screen, /max-w-\[103px\]/);
  assert.match(screen, /rounded-\[22px\]/);
  assert.match(screen, /border-2/);
  assert.match(screen, /text-\[14px\]/);
  assert.match(screen, /tracking-normal/);
  assert.doesNotMatch(screen, /flex flex-wrap gap-2/);
});

test('onboarding screen uses ranking-style responsive Figma canvas scaling', () => {
  const screen = fs.readFileSync('src/screens/onboarding/OnboardingScreen.tsx', 'utf8');

  assert.match(screen, /max-w-\[480px\]/);
  assert.match(screen, /origin-top/);
  assert.match(screen, /calc\(min\(100vw, var\(--qling-mobile-canvas-max-width\)\) \/ 393px\)/);
  assert.match(screen, /scale\(\$\{onboardingCanvasScale\}\)/);
  assert.match(screen, /h-\[852px\]/);
  assert.match(screen, /w-\[393px\]/);
});

test('onboarding progress bars use the Figma anchored fill contract', () => {
  const screen = fs.readFileSync('src/screens/onboarding/OnboardingScreen.tsx', 'utf8');

  assert.match(screen, /left-\[24px\] top-\[235px\] h-\[6px\] w-\[345px\] rounded-\[3px\] bg-\[#f2e5d3\]/);
  assert.match(screen, /left-\[24px\] top-\[235px\] h-\[6px\] rounded-\[3px\] bg-\[#ff8b3d\]/);
  assert.match(screen, /progressWidthClassName="w-\[115px\]"/);
  assert.match(screen, /progressWidthClassName="w-\[230px\]"/);
  assert.doesNotMatch(screen, /bg-\[#2a2c30\]/);
  assert.doesNotMatch(screen, /progressClassName="left-\[180px\]"/);
});

test('onboarding basic screen keeps the Figma helper until validation or duplicate feedback replaces it', () => {
  const screen = fs.readFileSync('src/screens/onboarding/OnboardingScreen.tsx', 'utf8');

  assert.match(screen, /!\s*hasNicknameMessage && \(/);
  assert.match(screen, /2~10자 · 한글, 영문, 숫자 사용 가능/);
  assert.match(screen, /hasNicknameMessage && \(/);
  assert.match(screen, /id="onboarding-nickname-message"/);
});

test('onboarding core Figma visual tokens are preserved', () => {
  const screen = fs.readFileSync('src/screens/onboarding/OnboardingScreen.tsx', 'utf8');

  assert.match(screen, /shadow-\[4px_4px_4px_0px_rgba\(0,0,0,0\.25\)\]/);
  assert.match(screen, /tracking-\[-0\.34px\]/);
  assert.match(screen, /top-\[147px\] text-\[26px\] font-extrabold leading-\[31px\] tracking-\[-1\.3px\]/);
  assert.match(screen, /text-\[13px\] font-bold leading-\[17px\] tracking-\[-0\.13px\]/);
  assert.match(screen, /bg-\[#ff8b3d\] text-\[17px\] font-extrabold leading-none tracking-normal text-white/);
});
