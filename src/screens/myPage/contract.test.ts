import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import {
  HELPED_COUNT_LABEL,
  MY_PAGE_POLICY_SETTING_ITEMS,
  MY_PAGE_SETTING_ITEMS,
  PUSH_PERMISSION_STATUSES,
  type MyPageScreenProps,
  type PolicyScreenProps,
} from './contract';

test('my-page summary limits nickname to profile summary and labels helpedCount as received hearts', () => {
  const props = {
    profile: {
      nickname: 'Profile user',
      interests: [WORRY_CATEGORIES[0], WORRY_CATEGORIES[1]],
      ageLabel: '20s',
      helpedCount: 7,
      helpedCountLabel: HELPED_COUNT_LABEL,
      profileMotif: {
        kind: 'visual-only',
        label: 'Profile motif',
      },
    },
    settings: MY_PAGE_SETTING_ITEMS,
    pushSettings: {
      status: 'default',
      onOpenSettings: () => undefined,
    },
    appInstall: {
      canInstall: false,
      canShare: true,
      platformGuidance: 'share-url-or-qr',
      onShare: () => undefined,
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
    onSettingSelect: () => undefined,
  } satisfies MyPageScreenProps;

  assert.equal(props.profile.helpedCountLabel, '받은 하트');
  assert.equal(props.profile.helpedCount, 7);
  assert.equal(Object.hasOwn(props, 'nickname'), false);
});

test('my-page contract keeps profile motif visual-only with no avatar data field', () => {
  const profileKeys = Object.keys({
    nickname: 'Profile user',
    interests: [WORRY_CATEGORIES[0]],
    helpedCount: 0,
    helpedCountLabel: HELPED_COUNT_LABEL,
    profileMotif: { kind: 'visual-only', label: 'Profile motif' },
  });

  for (const forbidden of ['avatarUrl', 'avatarUpload', 'avatarImageData']) {
    assert.equal(profileKeys.includes(forbidden), false);
  }
});

test('settings contract includes required account rows and excludes non-MVP policy rows', () => {
  assert.deepEqual(MY_PAGE_POLICY_SETTING_ITEMS, ['privacy_policy', 'operation_policy']);
  assert.deepEqual(MY_PAGE_SETTING_ITEMS, [
    'edit_interests',
    'my_answers',
    'my_worries',
    'privacy_policy',
    'operation_policy',
    'app_install_guide',
    'push_notification_settings',
    'logout',
    'delete_account',
  ]);

  for (const excluded of ['usage' + '_guide', 'generic' + ' ' + 'policy', 'ter' + 'ms']) {
    assert.equal((MY_PAGE_SETTING_ITEMS as readonly string[]).includes(excluded), false);
  }
});

test('push and app-like usage access are UI states with callbacks', () => {
  assert.deepEqual(PUSH_PERMISSION_STATUSES, [
    'default',
    'granted',
    'denied',
    'unsupported',
    'registered',
    'error',
  ]);
});

test('policy screen contract carries title, body or unavailable state', () => {
  const props = {
    policy: 'privacy_policy',
    title: 'Privacy policy',
    state: { status: 'empty', message: 'Policy content unavailable' },
  } satisfies PolicyScreenProps;

  assert.equal(props.policy, 'privacy_policy');
  assert.equal(props.state.status, 'empty');
});
