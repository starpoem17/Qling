import test from 'node:test';
import assert from 'node:assert/strict';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import { EditInterestsScreen, MyPageScreen, PolicyScreen } from './MyPageScreen';
import { HELPED_COUNT_LABEL, MY_PAGE_SETTING_ITEMS, type EditInterestsProps, type MyPageScreenProps } from './contract';

function baseMyPageProps(overrides: Partial<MyPageScreenProps> = {}): MyPageScreenProps {
  return {
    profile: {
      nickname: '라미',
      helpedCount: 314,
      helpedCountLabel: HELPED_COUNT_LABEL,
      profileMotif: { kind: 'visual-only', label: '프로필 모티프' },
    },
    answerPreviewItems: [{
      replyId: 'reply-1',
      deliveryId: 'delivery-1',
      worryId: 'worry-1',
      previewText: '누구나 그런 시기가 있는 것 같아요.',
      originalWorryPreview: '주변 친구들은 잘하고 있는 것 같아요.',
      categoryLabel: '자존감',
      dateLabel: '2026-05-02',
      hasReceivedHeart: true,
      accessibilityLabel: '내가 쓴 답변, 카테고리 자존감, 피드백 받은 하트',
    }],
    settings: MY_PAGE_SETTING_ITEMS,
    pushSettings: {
      status: 'default',
      enabled: false,
      message: '켜면 브라우저 알림 권한 요청과 푸시 등록을 시도합니다.',
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
    ...overrides,
  };
}

test('my-page screen renders only PRD my-page items and excludes non-MVP rows', () => {
  const html = renderToStaticMarkup(MyPageScreen(baseMyPageProps()));

  for (const expected of ['라미', '314', '받은 하트', '관심분야 수정', '내가 쓴 답변', '전체보기', '알림 설정', '개인정보처리방침', '로그아웃', '회원 탈퇴']) {
    assert.match(html, new RegExp(expected));
  }
  for (const excluded of ['성별', '나이', '운영정책', '앱처럼 사용하기', '이용약관', 'QR', '공유', '나의 고민']) {
    assert.doesNotMatch(html, new RegExp(excluded));
  }
});

test('my-page profile summary does not render private profile fields or interests', () => {
  const html = renderToStaticMarkup(MyPageScreen(baseMyPageProps({
    profile: {
      nickname: '본인닉네임',
      helpedCount: 2,
      helpedCountLabel: HELPED_COUNT_LABEL,
      profileMotif: { kind: 'visual-only', label: '프로필 모티프' },
      gender: '여성',
      ageLabel: '33세',
      interests: ['취업'],
      profileMetadata: { hidden: true },
    } as never,
  })));

  assert.match(html, /본인닉네임/);
  for (const forbidden of ['여성', '33세', '취업', 'profileMetadata']) {
    assert.equal(html.includes(forbidden), false);
  }
});

test('my-page forwards edit interests, my answers, push toggle, and policy actions', () => {
  const events: string[] = [];
  const tree = MyPageScreen(baseMyPageProps({
    pushSettings: {
      status: 'default',
      enabled: false,
      onToggle: enabled => {
        events.push(`push:${enabled}`);
      },
    },
    onEditInterests: () => events.push('edit'),
    onOpenMyAnswers: () => events.push('answers'),
    onSettingSelect: item => events.push(`setting:${item}`),
  }));

  click(findElement(tree, element => element.type === 'button' && /관심 분야 수정/.test(String(element.props['aria-label'] ?? ''))));
  click(findElement(tree, element => element.type === 'button' && /전체보기/.test(String(element.props['aria-label'] ?? ''))));
  click(findElement(tree, element => element.type === 'button' && element.props.role === 'switch'));
  click(findElement(tree, element => element.type === 'button' && /개인정보처리방침/.test(String(element.props['aria-label'] ?? ''))));

  assert.deepEqual(events, ['edit', 'answers', 'push:true', 'setting:privacy_policy']);
});

test('logout and account deletion rows open modal dialog requests', () => {
  const events: string[] = [];
  const tree = MyPageScreen(baseMyPageProps({
    onSettingSelect: item => events.push(`setting:${item}`),
  }));

  click(findElement(tree, element => element.type === 'button' && /로그아웃/.test(String(element.props['aria-label'] ?? ''))));
  click(findElement(tree, element => element.type === 'button' && /회원 탈퇴/.test(String(element.props['aria-label'] ?? ''))));

  assert.deepEqual(events, ['setting:logout', 'setting:delete_account']);
});

test('logout dialog is an accessible overlay and only dialog buttons fire logout confirmation handlers', () => {
  const events: string[] = [];
  const tree = MyPageScreen(baseMyPageProps({
    logoutConfirmation: {
      isOpen: true,
      isProcessing: false,
      onCancel: () => events.push('cancel-logout'),
      onConfirm: () => events.push('confirm-logout'),
    },
    onSettingSelect: item => events.push(`background:${item}`),
  }));
  const html = renderToStaticMarkup(tree);

  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /로그아웃할까요\?/);
  assert.match(html, /fixed inset-0 z-\[100\]/);

  const dialog = findElement(tree, element => typeof element.type === 'function'
    && element.type.name === 'QlingDialog'
    && element.props.confirmLabel === '로그아웃');
  assert.equal(dialog.props.cancelLabel, '취소');
  assert.equal(dialog.props.confirmLabel, '로그아웃');
  clickProp(dialog, 'onCancel');
  clickProp(dialog, 'onConfirm');

  assert.deepEqual(events, ['cancel-logout', 'confirm-logout']);
});

test('account deletion dialog blocks background interaction and confirm calls only deletion handler', () => {
  const events: string[] = [];
  const tree = MyPageScreen(baseMyPageProps({
    accountDeletionConfirmation: {
      isOpen: true,
      isProcessing: false,
      onCancel: () => events.push('cancel-deletion'),
      onConfirm: () => events.push('confirm-deletion'),
    },
    onSettingSelect: item => events.push(`background:${item}`),
  }));
  const html = renderToStaticMarkup(tree);

  assert.match(html, /role="dialog"/);
  assert.match(html, /계정을 삭제할까요\?/);
  assert.match(html, /fixed inset-0 z-\[100\]/);
  assert.match(html, /bg-black\/40/);

  const dialog = findElement(tree, element => typeof element.type === 'function'
    && element.type.name === 'QlingDialog'
    && element.props.confirmLabel === '계정 삭제');
  assert.equal(dialog.props.cancelLabel, '취소');
  assert.equal(dialog.props.confirmLabel, '계정 삭제');
  assert.equal(dialog.props.destructive, true);
  clickProp(dialog, 'onConfirm');

  assert.deepEqual(events, ['confirm-deletion']);
});

function baseEditInterestsProps(overrides: Partial<EditInterestsProps> = {}): EditInterestsProps {
  return {
    categoryOptions: WORRY_CATEGORIES,
    selectedInterests: ['진로'],
    validationMessages: {},
    isProcessing: false,
    onBack: () => undefined,
    onInterestToggle: () => undefined,
    onSubmit: () => undefined,
    ...overrides,
  };
}

test('edit interests screen renders fixed three-column chip grid and exact zero-selection validation', () => {
  const html = renderToStaticMarkup(EditInterestsScreen(baseEditInterestsProps({
    selectedInterests: [],
    validationMessages: { interests: '1개 이상의 관심 분야를 선택해주세요.' },
  })));

  assert.match(html, /grid-cols-3/);
  assert.match(html, /1개 이상의 관심 분야를 선택해주세요\./);
  assert.match(html, /저장하기/);
  assert.match(html, /워라밸/);
  assert.doesNotMatch(html, /워라벨/);
});

test('edit interests screen forwards chip toggle and submit interactions', () => {
  const events: string[] = [];
  const tree = EditInterestsScreen(baseEditInterestsProps({
    onInterestToggle: value => events.push(`toggle:${value}`),
    onSubmit: () => events.push('submit'),
  }));

  click(findElement(tree, element => element.type === 'button' && element.props.children === '진로'));
  click(findElement(tree, element => element.type === 'button' && element.props['aria-label'] === '관심 분야 저장'));

  assert.deepEqual(events, ['toggle:진로', 'submit']);
});

test('privacy policy screen uses exact PRD empty copy', () => {
  const html = renderToStaticMarkup(PolicyScreen({
    policy: 'privacy_policy',
    title: '개인정보처리방침',
    state: { status: 'empty', message: '정책을 준비 중입니다.' },
    onBack: () => undefined,
  }));

  assert.match(html, /개인정보처리방침/);
  assert.match(html, /정책을 준비 중입니다\./);
  assert.doesNotMatch(html, /운영정책/);
});

type TestElement = ReactElement<Record<string, unknown>>;

function findElement(tree: ReactNode, predicate: (element: TestElement) => boolean): TestElement {
  const found = findOptionalElement(tree, predicate);
  assert.ok(found, 'element not found');
  return found;
}

function findOptionalElement(tree: ReactNode, predicate: (element: TestElement) => boolean): TestElement | null {
  if (!isValidElement(tree)) return null;
  const element = tree as TestElement;
  if (predicate(element)) return element;
  if (typeof element.type === 'function' && element.type.name !== 'QlingDialog') {
    const rendered = (element.type as (props: Record<string, unknown>) => ReactNode)(element.props);
    const foundInRendered = findOptionalElement(rendered, predicate);
    if (foundInRendered) return foundInRendered;
  }
  let found: TestElement | null = null;
  Children.forEach(element.props.children as ReactNode, child => {
    if (found) return;
    found = findOptionalElement(child, predicate);
  });
  return found;
}

function click(element: TestElement): void {
  const onClick = element.props.onClick;
  assert.equal(typeof onClick, 'function');
  (onClick as () => void)();
}

function clickProp(element: TestElement, propName: 'onCancel' | 'onConfirm'): void {
  const handler = element.props[propName];
  assert.equal(typeof handler, 'function');
  (handler as () => void)();
}
