import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  SHARED_UI_PRIMITIVE_OWNERSHIP,
  type BottomNavigationProps,
  type CategoryChipProps,
  type QlingDialogProps,
  type QlingSuccessDialogProps,
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
      'contentSheet',
      'orangeHeaderBand',
      'primaryCta',
      'secondaryDestructiveCta',
      'card',
      'categoryChip',
      'textArea',
      'modalDialog',
      'loadingSpinner',
      'emptyLoadingErrorState',
      'profileMotif',
      'policyTextContainer',
      'settingsRow',
    ],
  );
});

test('bottom navigation contract preserves PRD tabs without central route or action props', () => {
  const props = {
    tabs: [
      { tab: '답변하기', label: '답변하기' },
      { tab: '나의 고민', label: '나의 고민' },
      { tab: '채팅', label: '채팅' },
      { tab: '순위', label: '순위' },
    ],
    activeTab: null,
    onSelectTab: () => undefined,
  } satisfies BottomNavigationProps;

  assert.deepEqual(props.tabs.map(tab => tab.label), ['답변하기', '나의 고민', '채팅', '순위']);
  assert.equal(props.activeTab, null);
  assert.equal(Object.hasOwn(props, 'centralAction'), false);
  assert.equal(Object.hasOwn(props, 'onCentralAction'), false);
  assert.equal(JSON.stringify(props).includes('write_worry'), false);
});

test('bottom navigation removes the legacy central eye indicator', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'shared', 'ui.tsx'), 'utf8');

  assert.doesNotMatch(source, /bottom-navigation-central-indicator/);
  assert.doesNotMatch(source, /bottom-navigation-left-eye-mask/);
  assert.doesNotMatch(source, /bottom-navigation-right-eye-mask/);
  assert.doesNotMatch(source, /isVisuallyActive/);
});

test('bottom navigation renders asset svg icons without css mask fallback boxes', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'shared', 'ui.tsx'), 'utf8');

  assert.match(source, /assets\/bottom_bar\/reply\.svg/);
  assert.match(source, /assets\/bottom_bar\/reply_activate\.svg/);
  assert.match(source, /bottomNavIconUrlByState/);
  assert.match(source, /<img/);
  assert.match(source, /draggable=\{false\}/);
  assert.match(source, /whitespace-nowrap/);
  assert.doesNotMatch(source, /maskImage/);
  assert.doesNotMatch(source, /WebkitMaskImage/);
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
    leadingIcon: 'icon',
    danger: true,
    disabled: false,
    accessibilityLabel: '계정 탈퇴',
    showDivider: false,
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
  assert.equal(settingsRow.showDivider, false);
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

test('category chip primitive computes a stable width from domain category labels', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'shared', 'ui.tsx'), 'utf8');

  assert.match(source, /WORRY_CATEGORIES/);
  assert.match(source, /longestCategoryLabelLength/);
  assert.match(source, /categoryChipWidth/);
  assert.match(source, /style=\{\{ width: categoryChipWidth \}\}/);
  assert.match(source, /whitespace-nowrap/);
});

test('loading state uses the shared spinner primitive without PRD empty text', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'shared', 'ui.tsx'), 'utf8');
  const loadingSpinnerBlock = source.slice(
    source.indexOf('export function LoadingSpinner'),
    source.indexOf('export function ErrorState'),
  );

  assert.match(loadingSpinnerBlock, /role="status"/);
  assert.match(loadingSpinnerBlock, /animate-spin/);
  assert.match(loadingSpinnerBlock, /sr-only/);
  assert.doesNotMatch(source, /지금은 도착한 고민이 없어요|첫 고민을 남겨보세요/);
});

test('production shared primitives do not implement static mobile chrome', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'shared', 'ui.tsx'), 'utf8');
  const forbiddenChrome = [
    'status bar',
    'battery',
    'network',
    'home indicator',
    '10:46',
  ];

  for (const pattern of forbiddenChrome) {
    assert.equal(source.toLowerCase().includes(pattern), false, `shared UI includes fake OS chrome marker ${pattern}`);
  }
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
  assert.match(source, /aria-labelledby=\{labelledBy\}/);
  assert.match(source, /aria-describedby=\{describedBy\}/);
  assert.match(source, /useId/);
});

test('modal dialog uses the Figma popup default without static mobile chrome', () => {
  const successDialog = {
    title: '고민 전송이 완료되었어요 !',
    description: '답변이 오면 알려드릴게요',
    accessibilityLabel: '고민 전송 완료 확인',
    onConfirm: () => undefined,
  } satisfies QlingSuccessDialogProps;
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'shared', 'ui.tsx'), 'utf8');

  assert.equal(successDialog.title, '고민 전송이 완료되었어요 !');
  assert.match(source, /bg-black\/32/);
  assert.match(source, /pt-\[251px\]/);
  assert.match(source, /max-w-\[310px\]/);
  assert.match(source, /rounded-\[24px\]/);
  assert.match(source, /shadow-\[0_12px_40px_rgb\(0_0_0\/0\.18\)\]/);
  assert.match(source, /text-center/);
  assert.match(source, /min-h-\[52px\]/);
  assert.match(source, /rounded-\[12px\]/);
  assert.match(source, /bg-\[#ff8b3d\]/);
  assert.match(source, /data-testid="figma-clover"/);
  assert.match(source, /bg-\[#5cc15a\]/);
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
    'onCentralAction',
    'centralWriteWorryAction',
    'targetRoute',
  ];

  for (const pattern of forbidden) {
    assert.equal(uiSource.includes(pattern), false, `shared primitive module includes forbidden boundary ${pattern}`);
  }
});
