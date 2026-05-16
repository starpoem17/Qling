import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import {
  ONBOARDING_DUPLICATE_CHECK_STATES,
  type OnboardingScreenProps,
} from './contract';

test('onboarding contract includes required field values, validation, and event callbacks', () => {
  const props = {
    values: {
      nickname: '',
      gender: '',
      age: '',
      selectedInterests: [WORRY_CATEGORIES[0]],
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
    onDuplicateCheck: () => undefined,
    onContinue: () => undefined,
    onSubmit: () => undefined,
  } satisfies OnboardingScreenProps;

  assert.equal(typeof props.values.nickname, 'string');
  assert.equal(typeof props.values.age, 'string');
  assert.deepEqual(props.values.selectedInterests, [WORRY_CATEGORIES[0]]);
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

test('onboarding contract has no implementation object or design default nickname', () => {
  const props = {
    values: {
      nickname: '',
      gender: 'female',
      age: '20',
      selectedInterests: [],
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
    onDuplicateCheck: () => undefined,
    onContinue: () => undefined,
    onSubmit: () => undefined,
  } satisfies OnboardingScreenProps;

  assert.notEqual(props.values.nickname, '\ub77c\ubbf8');
  assert.equal(Object.hasOwn(props, 'nicknameReservation'), false);
  assert.equal(Object.hasOwn(props, 'apiClient'), false);
});
