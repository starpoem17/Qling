import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  SHARED_UI_PRIMITIVE_OWNERSHIP,
  type BottomNavigationProps,
  type CategoryChipProps,
  type LoadingSpinnerProps,
  type QlingDialogProps,
  type PolicyTextContainerProps,
  type ProfileMotifProps,
  type QlingTextAreaProps,
  type SettingsRowProps,
} from './uiContract';

test('shared primitive inventory covers every Phase 14 ownership item', () => {
  assert.deepEqual(
    SHARED_UI_PRIMITIVE_OWNERSHIP.map(item => item.id),
    [
      'appShellMobileFrame',
      'bottomNavigation',
      'bottomNavigationCentralIndicator',
      'contentSheet',
      'orangeHeaderBand',
      'primaryCta',
      'secondaryDestructiveCta',
      'card',
      'categoryChip',
      'textArea',
      'modalDialog',
      'emptyLoadingErrorState',
      'spinnerLoadingPrimitive',
      'profileMotif',
      'policyTextContainer',
      'settingsRow',
    ],
  );
});

test('bottom navigation contract preserves PRD tabs and visual central indicator', () => {
  const props = {
    tabs: [
      { tab: '답변하기', label: '답변하기' },
      { tab: '나의 고민', label: '나의 고민' },
      { tab: '마이페이지', label: '마이페이지' },
    ],
    activeTab: '답변하기',
    centralIndicator: {
      accessibleLabel: '중앙 눈 인디케이터',
      state: 'left',
    },
    onSelectTab: () => undefined,
  } satisfies BottomNavigationProps;

  assert.deepEqual(props.tabs.map(tab => tab.label), ['답변하기', '나의 고민', '마이페이지']);
  assert.equal(props.activeTab, '답변하기');
  assert.equal(props.centralIndicator.accessibleLabel, '중앙 눈 인디케이터');
  assert.equal(props.centralIndicator.state, 'left');
  assert.deepEqual(Object.keys(props), ['tabs', 'activeTab', 'centralIndicator', 'onSelectTab']);
});

test('profile motif remains visual-only without avatar data requirements', () => {
  const props = {
    label: 'Profile motif',
  } satisfies ProfileMotifProps;

  assert.equal(props.label, 'Profile motif');
  for (const forbidden of ['avatarUrl', 'avatarUpload', 'avatarImageData', 'photoURL']) {
    assert.equal(Object.hasOwn(props, forbidden), false);
  }
});

test('policy text container accepts empty, error, and real body states without fake body', () => {
  const empty = {
    state: 'empty',
    title: '개인정보처리방침',
    message: '정책 본문을 준비 중입니다.',
  } satisfies PolicyTextContainerProps;
  const error = {
    state: 'error',
    title: '운영정책',
    message: '정책 본문을 불러오지 못했습니다.',
    onRetry: () => undefined,
  } satisfies PolicyTextContainerProps;
  const body = {
    state: 'body',
    title: '운영정책',
    body: '실제 정책 본문',
  } satisfies PolicyTextContainerProps;

  assert.equal(empty.state, 'empty');
  assert.equal(error.state, 'error');
  assert.equal(body.state, 'body');
  assert.equal(Object.hasOwn(empty, 'body'), false);
});

test('text area and settings row contracts expose required state mapping props', () => {
  const textArea = {
    value: '고민 내용',
    onChange: () => undefined,
    maxLength: 1000,
    errorMessage: '너무 길어요.',
    disabled: false,
    processing: false,
  } satisfies QlingTextAreaProps;
  const settingsRow = {
    label: '탈퇴',
    description: '계정을 삭제합니다.',
    danger: true,
    disabled: false,
    accessibilityLabel: '계정 탈퇴',
    onSelect: () => undefined,
  } satisfies SettingsRowProps;

  assert.equal(textArea.value.length, 5);
  assert.equal(textArea.maxLength, 1000);
  assert.equal(textArea.errorMessage, '너무 길어요.');
  assert.equal(textArea.disabled, false);
  assert.equal(textArea.processing, false);
  assert.equal(settingsRow.danger, true);
  assert.equal(settingsRow.disabled, false);
  assert.equal(settingsRow.accessibilityLabel, '계정 탈퇴');
});

test('category chip contract allows layout classes without changing selection behavior', () => {
  const chip = {
    label: '워라밸',
    selected: true,
    disabled: false,
    className: 'h-[44px] w-full max-w-[103px]',
    onSelect: () => undefined,
  } satisfies CategoryChipProps;

  assert.equal(chip.label, '워라밸');
  assert.equal(chip.selected, true);
  assert.equal(chip.className?.includes('max-w-[103px]'), true);
  assert.equal(Object.hasOwn(chip, 'apiClient'), false);
});

test('loading spinner contract stays visual-only and copy-free', () => {
  const spinner = {
    label: '목록 로딩 중',
  } satisfies LoadingSpinnerProps;
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'shared', 'ui.tsx'), 'utf8');

  assert.equal(spinner.label, '목록 로딩 중');
  assert.doesNotMatch(source, /지금은 도착한 고민이 없어요|첫 고민을 남겨보세요/);
});

test('modal dialog contract preserves aria-capable confirmation and processing/error states', () => {
  const dialog = {
    isOpen: true,
    title: '계정을 삭제할까요?',
    description: '계정 삭제는 되돌릴 수 없습니다.',
    cancelLabel: '취소',
    confirmLabel: '계정 삭제',
    destructive: true,
    processing: true,
    errorMessage: '계정 삭제 처리 중 문제가 발생했습니다.',
    onCancel: () => undefined,
    onConfirm: () => undefined,
  } satisfies QlingDialogProps;
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'shared', 'ui.tsx'), 'utf8');

  assert.equal(dialog.destructive, true);
  assert.equal(dialog.processing, true);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby=\{titleId\}/);
  assert.match(source, /aria-describedby=\{describedBy\}/);
  assert.match(source, /useId/);
});

test('shared primitive module does not import Firebase, API, server, or service mutation boundaries', () => {
  const uiSource = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'shared', 'ui.tsx'), 'utf8');
  const forbidden = [
    'firebase',
    'firestore',
    'src/services/',
    '../../services/',
    'apiClient',
    'server.ts',
    'deleteMyAccountViaApi',
    'submitReplyFeedbackWithProductionAdapters',
    'passDeliveryViaApi',
    'routeToWriteWorry',
    'tabForRoute',
  ];

  for (const pattern of forbidden) {
    assert.equal(uiSource.includes(pattern), false, `shared primitive module includes forbidden boundary ${pattern}`);
  }
});
