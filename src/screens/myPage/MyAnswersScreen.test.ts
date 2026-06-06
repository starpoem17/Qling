import test from 'node:test';
import assert from 'node:assert/strict';
import { Children, createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MyAnswersScreen, MyAnswersScreenView } from './MyAnswersScreen';
import type { MyAnswersScreenProps } from './contract';

function baseProps(overrides: Partial<MyAnswersScreenProps> = {}): MyAnswersScreenProps {
  return {
    state: { status: 'ready' },
    items: [{
      replyId: 'reply-1',
      deliveryId: 'delivery-1',
      worryId: 'worry-1',
      previewText: '누구나 그런 시기가 있는 것 같아요. 저도 비슷한 경험이 있어요.',
      originalWorryPreview: '주변 친구들은 원하는대로 잘하고 있는 것 같은데 저만 뒤처지는 기분이 들어요.',
      categoryLabel: '자존감',
      dateLabel: '2026.05.02',
      hasReceivedHeart: true,
      feedbackLabel: '받은 하트',
      feedbackComment: '힘이 됐어요',
      accessibilityLabel: '내가 쓴 답변, 카테고리 자존감, 피드백 받은 하트, 코멘트 있음',
    }],
    onBack: () => undefined,
    onStartChat: () => undefined,
    ...overrides,
  };
}

function viewProps(overrides: Partial<Parameters<typeof MyAnswersScreenView>[0]> = {}): Parameters<typeof MyAnswersScreenView>[0] {
  return {
    ...baseProps(),
    chatStartTarget: null,
    onOpenChatStartConfirmation: () => undefined,
    onCancelChatStartConfirmation: () => undefined,
    onConfirmChatStartConfirmation: () => undefined,
    ...overrides,
  };
}

test('my answers screen renders same card format with heart and one small comment', () => {
  const html = renderToStaticMarkup(createElement(MyAnswersScreen, baseProps()));

  assert.match(html, /내가 쓴 답변/);
  assert.match(html, /자존감/);
  assert.match(html, /2026\.05\.02/);
  assert.match(html, /주변 친구들은/);
  assert.match(html, /누구나 그런 시기가/);
  assert.match(html, /힘이 됐어요/);
  assert.match(html, /익명 채팅 시작하기/);
  assert.match(html, /bg-\[#ff8b3d\]/);
  assert.match(html, /fill-\[#e94335\]/);
  assert.doesNotMatch(html, /내가 보낸 답변과 받은 반응을 확인합니다\./);
});

test('my answers screen uses the responsive direct header canvas and ready-only body scroll area', () => {
  const html = renderToStaticMarkup(createElement(MyAnswersScreen, baseProps()));

  assert.match(html, /mx-auto flex h-full w-full justify-center overflow-hidden max-w-\[480px\]/);
  assert.match(html, /h-\[852px\] w-full max-w-\[480px\]/);
  assert.doesNotMatch(html, /transform:scale/);
  assert.match(html, /-mx-\[var\(--qling-space-shell-x\)\] h-\[var\(--qling-tab-viewport-height\)\] overflow-hidden bg-\[#ff8b3d\]/);
  assert.match(html, /aria-label="내가 쓴 답변 목록"/);
  assert.match(html, /<header[^>]*h-\[calc\(100px\+var\(--qling-pwa-direct-topbar-shift\)\)\][\s\S]*<section[^>]*aria-label="내가 쓴 답변 목록"/);
  assert.match(html, /top-\[calc\(45px\+var\(--qling-pwa-direct-topbar-shift\)\)\]/);
  assert.match(html, /top-\[calc\(60px\+var\(--qling-pwa-direct-topbar-shift\)\)\]/);
  assert.match(html, /relative h-\[752px\] overflow-y-auto overscroll-contain/);
  assert.match(html, /pb-\[calc\(108px\+env\(safe-area-inset-bottom,0px\)\)\]/);
  assert.match(html, /height:min\(752px, max\(320px, calc\(calc\(var\(--qling-visual-viewport-height\) - var\(--qling-space-nav-height\)\) - 100px - var\(--qling-pwa-direct-topbar-shift\)\)\)\)/);
  assert.doesNotMatch(html, /data-qling-peek-header-content/);
  assert.doesNotMatch(html, /qling-peek-progress/);
  assert.doesNotMatch(html, /transform:translateY\(calc\(var\(--qling-peek-progress, 0\) \* -88px\)\)/);
  assert.doesNotMatch(html, /absolute left-0 top-\[100px\]/);
});

test('my answers loading empty and error states keep the canvas locked without list scrolling', () => {
  const loadingHtml = renderToStaticMarkup(createElement(MyAnswersScreen, baseProps({
    state: { status: 'loading', label: '내가 쓴 답변을 불러오는 중입니다.' },
    items: [],
  })));
  const emptyHtml = renderToStaticMarkup(createElement(MyAnswersScreen, baseProps({
    state: { status: 'empty', message: 'empty message must stay hidden' },
    items: [],
  })));
  const errorHtml = renderToStaticMarkup(createElement(MyAnswersScreen, baseProps({
    state: { status: 'error', message: '네트워크 오류', canRetry: false },
    items: [],
  })));

  for (const html of [loadingHtml, emptyHtml, errorHtml]) {
    assert.match(html, /relative h-\[752px\] touch-none overscroll-none overflow-hidden/);
    assert.doesNotMatch(html, /aria-label="내가 쓴 답변 목록"/);
    assert.doesNotMatch(html, /absolute left-0 top-\[100px\]/);
  }
  assert.match(loadingHtml, /내가 쓴 답변을 불러오는 중입니다\./);
  assert.doesNotMatch(emptyHtml, /empty message must stay hidden/);
  assert.doesNotMatch(emptyHtml, /rounded-\[18px\] bg-white px-\[18px\] py-8/);
  assert.match(errorHtml, /네트워크 오류/);
});

test('my answers chat start button appears only for replies with a comment', () => {
  const html = renderToStaticMarkup(createElement(MyAnswersScreen, baseProps({
    items: [
      baseProps().items[0],
      {
        ...baseProps().items[0],
        replyId: 'reply-without-comment',
        deliveryId: 'delivery-without-comment',
        worryId: 'worry-without-comment',
        hasReceivedHeart: false,
        feedbackLabel: undefined,
        feedbackComment: undefined,
        accessibilityLabel: '내가 쓴 답변, 카테고리 자존감, 피드백 없음',
      },
    ],
  })));

  assert.equal((html.match(/<button[^>]*aria-label="익명 채팅 시작하기"/g) ?? []).length, 1);
});

test('my answers chat start button opens confirmation popup before starting chat', () => {
  const events: string[] = [];
  const tree = MyAnswersScreenView(viewProps({
    onStartChat: item => events.push(`start:${item.worryId}:${item.replyId}`),
    onOpenChatStartConfirmation: item => events.push(`open:${item.worryId}:${item.replyId}`),
  }));

  click(findElement(tree, element => element.type === 'button' && element.props['aria-label'] === '익명 채팅 시작하기'));

  assert.deepEqual(events, ['open:worry-1:reply-1']);
});

test('my answers chat start confirmation popup matches the Figma modal chrome', () => {
  const html = renderToStaticMarkup(MyAnswersScreenView(viewProps({
    chatStartTarget: baseProps().items[0],
  })));

  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-labelledby="my-answers-chat-start-confirmation-title"/);
  assert.match(html, /aria-describedby="my-answers-chat-start-confirmation-description"/);
  assert.match(html, /absolute inset-0 z-40 bg-\[rgba\(40,30,20,0\.42\)\]/);
  assert.match(html, /left-1\/2 top-\[251px\] z-50 h-\[288px\] w-\[310px\] -translate-x-1\/2 rounded-\[24px\] bg-white/);
  assert.match(html, /shadow-\[0_12px_20px_rgba\(0,0,0,0\.18\)\]/);
  assert.match(html, /chat_start_dot\.svg/);
  assert.match(html, /채팅을 시작할까요\?/);
  assert.match(html, /채팅을 시작하면 서로의 닉네임을 볼 수 있고/);
  assert.match(html, /상대방에게 채팅 시작 알림이 전송됩니다\./);
  assert.match(html, />취소<\/button>/);
  assert.match(html, />확인<\/button>/);
});

test('my answers chat start confirmation cancel closes without starting chat', () => {
  const events: string[] = [];
  const tree = MyAnswersScreenView(viewProps({
    chatStartTarget: baseProps().items[0],
    onCancelChatStartConfirmation: () => events.push('cancel'),
    onConfirmChatStartConfirmation: () => events.push('confirm'),
    onStartChat: () => events.push('start'),
  }));

  click(findElement(tree, element => element.type === 'button' && element.props.children === '취소'));

  assert.deepEqual(events, ['cancel']);
});

test('my answers chat start confirmation confirm starts chat with selected reply', () => {
  const events: string[] = [];
  const selectedReply = baseProps().items[0];
  const tree = MyAnswersScreenView(viewProps({
    chatStartTarget: selectedReply,
    onConfirmChatStartConfirmation: () => {
      events.push(`start:${selectedReply.worryId}:${selectedReply.replyId}`);
    },
  }));

  click(findElement(tree, element => element.type === 'button' && element.props.children === '확인'));

  assert.deepEqual(events, ['start:worry-1:reply-1']);
});

test('my answers disables chat start controls while chat creation is processing', () => {
  const selectedReply = baseProps().items[0];
  const tree = MyAnswersScreenView(viewProps({
    chatCreationReplyId: selectedReply.replyId,
    chatStartTarget: selectedReply,
  }));

  const startButton = findElement(tree, element => element.type === 'button' && element.props['aria-label'] === '익명 채팅 시작하기');
  const confirmButton = findElement(tree, element => element.type === 'button' && element.props.children === '확인');

  assert.equal(startButton.props.disabled, true);
  assert.equal(startButton.props['aria-busy'], true);
  assert.equal(confirmButton.props.disabled, true);
  assert.equal(confirmButton.props['aria-busy'], true);
});

test('my answers screen does not make item cards navigate to detail routes', () => {
  const html = renderToStaticMarkup(createElement(MyAnswersScreen, baseProps()));

  assert.doesNotMatch(html, /<button[^>]*aria-label="내가 쓴 답변/);
  assert.doesNotMatch(html, /my_answer_detail|read_my_reply|routeToMyReplyDetail/);
});

test('my answers screen hides dislike feedback and publisher private data from DOM', () => {
  const html = renderToStaticMarkup(createElement(MyAnswersScreen, baseProps({
    items: [{
      replyId: 'reply-private',
      deliveryId: 'delivery-private',
      worryId: 'worry-private',
      previewText: '내 답변만 표시합니다.',
      originalWorryPreview: '허용된 고민 context만 표시합니다.',
      categoryLabel: '일상',
      dateLabel: '방금 전',
      hasReceivedHeart: false,
      accessibilityLabel: '내가 쓴 답변, 카테고리 일상, 피드백 없음',
      feedbackLabel: undefined,
      feedbackComment: undefined,
      publisherNickname: '게시자닉네임',
      gender: '여성',
      age: 33,
      interests: ['취업'],
      profileMetadata: { hidden: true },
      uid: 'publisher-uid-secret',
      dislikeComment: '운영자만 보는 싫어요 이유',
    } as never],
  })));

  for (const forbidden of ['게시자닉네임', '여성', '33', '취업', 'profileMetadata', 'publisher-uid-secret', '운영자만 보는 싫어요 이유', '싫어요']) {
    assert.equal(html.includes(forbidden), false);
  }
  assert.match(html, /내 답변만 표시합니다\./);
  assert.match(html, /허용된 고민 context만 표시합니다\./);
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
  if (typeof element.type === 'function') {
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
