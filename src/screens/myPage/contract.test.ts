import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import {
  HELPED_COUNT_LABEL,
  MY_PAGE_POLICY_SETTING_ITEMS,
  MY_PAGE_SETTING_ITEMS,
  PUSH_PERMISSION_STATUSES,
  type MyPageScreenProps,
  type MyAnswersScreenProps,
  type MyWorriesScreenProps,
  type PolicyScreenProps,
  type EditInterestsProps,
  type ConfirmationProps,
} from './contract';

test('my-page summary limits nickname to profile summary and labels helpedCount as received hearts', () => {
  const props = {
    profile: {
      nickname: 'Profile user',
      helpedCount: 7,
      helpedCountLabel: HELPED_COUNT_LABEL,
      profileMotif: {
        kind: 'visual-only',
        label: 'Profile motif',
      },
    },
    answerPreviewItems: [],
    settings: MY_PAGE_SETTING_ITEMS,
    pushSettings: {
      status: 'default',
      enabled: false,
      onToggle: () => undefined,
    },
    logoutConfirmation: {
      isOpen: false,
      isProcessing: false,
      onCancel: () => undefined,
      onConfirm: () => undefined,
    },
    accountDeletionConfirmation: {
      isOpen: false,
      isProcessing: false,
      onCancel: () => undefined,
      onConfirm: () => undefined,
    },
    onEditInterests: () => undefined,
    onOpenMyAnswers: () => undefined,
    onSettingSelect: () => undefined,
    onBack: () => undefined,
  } satisfies MyPageScreenProps;

  assert.equal(props.profile.helpedCountLabel, '받은 하트');
  assert.equal(props.profile.helpedCount, 7);
  assert.equal(Object.hasOwn(props, 'nickname'), false);
  assert.equal(Object.hasOwn(props.profile, 'ageLabel'), false);
  assert.equal(Object.hasOwn(props.profile, 'interests'), false);
});

test('my-page contract keeps profile motif visual-only with no avatar data field', () => {
  const profileKeys = Object.keys({
    nickname: 'Profile user',
    helpedCount: 0,
    helpedCountLabel: HELPED_COUNT_LABEL,
    profileMotif: { kind: 'visual-only', label: 'Profile motif' },
  });

  for (const forbidden of ['avatarUrl', 'avatarUpload', 'avatarImageData']) {
    assert.equal(profileKeys.includes(forbidden), false);
  }
});

test('settings contract includes required account rows and excludes non-MVP policy rows', () => {
  assert.deepEqual(MY_PAGE_POLICY_SETTING_ITEMS, ['privacy_policy']);
  assert.deepEqual(MY_PAGE_SETTING_ITEMS, [
    'push_notifications',
    'privacy_policy',
    'logout',
    'delete_account',
  ]);

  for (const excluded of [
    'usage' + '_guide',
    'generic' + ' ' + 'policy',
    'ter' + 'ms',
    'operation_policy',
    'app_install_guide',
    'notification_settings',
    'my_answers',
    'my_worries',
  ]) {
    assert.equal((MY_PAGE_SETTING_ITEMS as readonly string[]).includes(excluded), false);
  }
});

test('push access stays inside my-page props without a standalone notification route', () => {
  assert.deepEqual(PUSH_PERMISSION_STATUSES, [
    'default',
    'granted',
    'denied',
    'unsupported',
    'registered',
    'error',
  ]);

  assert.equal((MY_PAGE_SETTING_ITEMS as readonly string[]).includes('push_notifications'), true);
  assert.equal((MY_PAGE_SETTING_ITEMS as readonly string[]).includes('notification_settings'), false);
});

test('my answers and my worries contracts expose list states and route callbacks without sample labels', () => {
  const answers = {
    state: { status: 'ready' },
    items: [{
      replyId: 'reply-1',
      deliveryId: 'delivery-1',
      worryId: 'worry-1',
      previewText: '답장 내용',
      originalWorryPreview: '원래 고민',
      categoryLabel: WORRY_CATEGORIES[0],
      dateLabel: '2026.05.17',
      hasReceivedHeart: false,
      accessibilityLabel: '내가 쓴 답변, 원래 고민 원래 고민, 피드백 없음, 선택되지 않음',
    }],
    onBack: () => undefined,
  } satisfies MyAnswersScreenProps;
  const worries = {
    state: { status: 'ready' },
    items: [{
      worryId: 'worry-1',
      summaryText: '고민 요약...',
      categoryLabel: WORRY_CATEGORIES[0],
      createdAtLabel: '방금 전',
      replyCountLabel: '1명이 답변했어요',
      accessibilityLabel: '답변 확인으로 이동, 카테고리 취업, 작성일 방금 전, 1명이 답변했어요',
    },
    ],
    onWriteWorry: () => undefined,
    onOpenMyPage: () => undefined,
    onSelectWorryForAnswers: () => undefined,
  } satisfies MyWorriesScreenProps;

  assert.equal(answers.items[0].previewText, '답장 내용');
  assert.match(answers.items[0].accessibilityLabel, /내가 쓴 답변/);
  assert.match(answers.items[0].accessibilityLabel, /피드백 없음/);
  assert.equal(worries.items[0].replyCountLabel, '1명이 답변했어요');
  assert.match(worries.items[0].accessibilityLabel, /1명이 답변했어요/);
  assert.doesNotMatch(worries.items[0].accessibilityLabel, /읽지 않은 답장/);
  assert.match(worries.items[0].accessibilityLabel, /답변 확인으로 이동/);
  for (const item of [...answers.items, ...worries.items]) {
    assert.equal(Object.hasOwn(item, 'exampleLabel'), false);
    assert.equal(Object.hasOwn(item, 'fakeLabel'), false);
    assert.equal(Object.hasOwn(item, 'sampleLabel'), false);
  }
});

test('my worries contract is list-only and excludes answer-writer privacy fields', () => {
  const itemKeys = Object.keys({
    worryId: 'worry-1',
    summaryText: '요약...',
    categoryLabel: WORRY_CATEGORIES[0],
    createdAtLabel: '2026.05.19',
    replyCountLabel: '아직 답변이 없어요.',
    accessibilityLabel: '답변 확인으로 이동',
  } satisfies MyWorriesScreenProps['items'][number]);

  for (const forbidden of [
    'selectedWorry',
    'contentPreview',
    'replyCount',
    'replyPreview',
    'answerWriterNickname',
    'nickname',
    'gender',
    'age',
    'interests',
    'profileMetadata',
    'replierUid',
  ]) {
    assert.equal(itemKeys.includes(forbidden), false);
  }
});

test('policy screen contract carries title, body or unavailable state', () => {
  const props = {
    policy: 'privacy_policy',
    title: 'Privacy policy',
    state: { status: 'empty', message: 'Policy content unavailable' },
  } satisfies PolicyScreenProps;
  const error = {
    policy: 'privacy_policy',
    title: 'Privacy policy',
    state: { status: 'error', message: 'Policy load failed', canRetry: false },
  } satisfies PolicyScreenProps;

  assert.equal(props.policy, 'privacy_policy');
  assert.equal(props.state.status, 'empty');
  assert.equal(error.state.status, 'error');
});

test('edit-interests contract exposes only interest fields and callbacks', () => {
  const props = {
    categoryOptions: WORRY_CATEGORIES,
    selectedInterests: ['워라밸'],
    validationMessages: {},
    isProcessing: false,
    onBack: () => undefined,
    onInterestToggle: () => undefined,
    onSubmit: () => undefined,
  } satisfies EditInterestsProps;

  assert.equal(props.selectedInterests.includes('워라밸'), true);
  for (const forbidden of ['nickname', 'gender', 'age', 'onNicknameChange', 'onGenderChange', 'onAgeChange']) {
    assert.equal(Object.hasOwn(props, forbidden), false);
  }
});

test('confirmation props require explicit destructive/account callbacks without importing deletion logic', () => {
  const confirmation = {
    isOpen: true,
    isProcessing: false,
    errorMessage: undefined,
    onCancel: () => undefined,
    onConfirm: () => undefined,
  } satisfies ConfirmationProps;

  assert.equal(confirmation.isOpen, true);
  assert.equal(typeof confirmation.onCancel, 'function');
  assert.equal(typeof confirmation.onConfirm, 'function');
  assert.equal(confirmation.errorMessage, undefined);
});
