import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import {
  ONBOARDING_INTEREST_CATEGORY_ORDER,
  ONBOARDING_INTEREST_GRID,
  ONBOARDING_PROFILE_COLOR_GRID,
  ONBOARDING_DUPLICATE_CHECK_STATES,
  orderOnboardingInterestCategories,
  type OnboardingScreenProps,
} from './contract';

test('onboarding contract includes required field values, validation, and event callbacks', () => {
  const props = {
    values: {
      nickname: '',
      gender: '',
      age: '',
      selectedInterests: [WORRY_CATEGORIES[0]],
      selectedProfileColor: '#FF8B3D',
    },
    validationMessages: {
      nickname: 'Required',
      age: 'Required',
    },
    duplicateCheck: {
      state: 'idle',
    },
    isProcessing: false,
    disabled: true,
    disabledReason: 'missing-required-field',
    onNicknameChange: () => undefined,
    onGenderChange: () => undefined,
    onAgeChange: () => undefined,
    onInterestToggle: () => undefined,
    onProfileColorChange: () => undefined,
    onDuplicateCheck: () => undefined,
    onContinue: () => undefined,
    onSubmit: () => undefined,
  } satisfies OnboardingScreenProps;

  assert.equal(typeof props.values.nickname, 'string');
  assert.equal(typeof props.values.age, 'string');
  assert.deepEqual(props.values.selectedInterests, [WORRY_CATEGORIES[0]]);
  assert.equal(props.values.selectedProfileColor, '#FF8B3D');
  assert.equal(typeof props.onDuplicateCheck, 'function');
  assert.equal(typeof props.onSubmit, 'function');
});

test('duplicate-check state union covers expected UI states only', () => {
  assert.deepEqual(ONBOARDING_DUPLICATE_CHECK_STATES, [
    'idle',
    'checking',
    'available',
    'duplicate',
    'invalid',
    'network-failed',
    'retry',
  ]);
});

test('onboarding interests use the Figma 16 category order', () => {
  assert.equal(ONBOARDING_INTEREST_CATEGORY_ORDER.length, 16);
  assert.equal(ONBOARDING_INTEREST_GRID.rows, 8);
  assert.equal(ONBOARDING_INTEREST_GRID.columns, 2);
  assert.deepEqual(
    Array.from(ONBOARDING_INTEREST_CATEGORY_ORDER),
    [
      '진로', '취업', '직장', '학업',
      '시험', '경제', '연애', '결혼',
      '가족', '인간관계', '육아', '건강',
      '외모', '군대', '미래', '일상',
    ],
  );
  assert.equal((ONBOARDING_INTEREST_CATEGORY_ORDER as readonly string[]).includes('워라밸'), false);
  assert.deepEqual(orderOnboardingInterestCategories(WORRY_CATEGORIES), Array.from(ONBOARDING_INTEREST_CATEGORY_ORDER));
});

test('onboarding interest grid contract preserves design chip dimensions with accessible letter spacing', () => {
  assert.deepEqual(ONBOARDING_INTEREST_GRID, {
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
  });
});

test('onboarding contract has no implementation object or design default nickname', () => {
  const props = {
    values: {
      nickname: '',
      gender: 'female',
      age: '20',
      selectedInterests: [],
      selectedProfileColor: '#FF8B3D',
    },
    validationMessages: {},
    duplicateCheck: {
      state: 'retry',
      message: 'Try again.',
    },
    isProcessing: false,
    disabled: true,
    onNicknameChange: () => undefined,
    onGenderChange: () => undefined,
    onAgeChange: () => undefined,
    onInterestToggle: () => undefined,
    onProfileColorChange: () => undefined,
    onDuplicateCheck: () => undefined,
    onContinue: () => undefined,
    onSubmit: () => undefined,
  } satisfies OnboardingScreenProps;

  assert.notEqual(props.values.nickname, '\ub77c\ubbf8');
  assert.equal(Object.hasOwn(props, 'nicknameReservation'), false);
  assert.equal(Object.hasOwn(props, 'apiClient'), false);
});

test('onboarding profile color grid follows the Figma swatch contract', () => {
  assert.deepEqual(ONBOARDING_PROFILE_COLOR_GRID, {
    columns: 5,
    swatchSizePx: 46,
    swatchRadiusPx: 23,
    columnGapPx: 14,
    rowGapPx: 20,
  });
});
