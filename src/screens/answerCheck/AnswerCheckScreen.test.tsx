import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnswerCheckScreen } from './AnswerCheckScreen';
import type { AnswerCheckScreenProps } from './contract';

function baseProps(overrides: Partial<AnswerCheckScreenProps> = {}): AnswerCheckScreenProps {
  return {
    state: { status: 'ready' },
    worry: {
      worryId: 'worry-1',
      summaryText: '내 고민 본문...',
      bodyText: '내 고민 본문 원문',
      categoryLabel: '외모',
      createdAtLabel: '2026.05.02',
    },
    replies: [
      {
        replyId: 'reply-1',
        bodyText: '첫 번째 답변 본문',
        createdAtLabel: '방금 전',
        feedbackState: 'none',
        canLike: true,
        canDislike: true,
        canComment: false,
        isFeedbackProcessing: false,
        isCommentProcessing: false,
      },
      {
        replyId: 'reply-2',
        bodyText: '두 번째 답변 본문',
        createdAtLabel: '1분 전',
        publisherComment: '고마웠어요',
        feedbackState: 'liked',
        canLike: true,
        canDislike: false,
        canComment: false,
        isFeedbackProcessing: false,
        isCommentProcessing: false,
      },
    ],
    commentDialog: null,
    onBack: () => undefined,
    onLike: () => undefined,
    onDislike: () => undefined,
    onOpenComment: () => undefined,
    onCommentChange: () => undefined,
    onCommentSubmit: () => undefined,
    onCommentClose: () => undefined,
    ...overrides,
  };
}

test('answer check renders one worry and multiple answer cards', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps()));

  assert.match(html, /답변 확인/);
  assert.match(html, /내 고민 본문\.\.\./);
  assert.match(html, /내 고민 본문 원문/);
  assert.match(html, /첫 번째 답변 본문/);
  assert.match(html, /두 번째 답변 본문/);
});

test('answer check loading state matches the Figma loading shell', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    state: { status: 'loading', label: '답변을 불러오고 있습니다.' },
  })));

  assert.match(html, /답변 확인/);
  assert.match(html, /aria-label="나의 고민으로 돌아가기"/);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /data-testid="answer-check-figma-loading-indicator"/);
  assert.match(html, /답변을 불러오고 있습니다\./);
  assert.match(html, /figma-progress-active\.svg/);
  assert.match(html, /figma-progress-track\.svg/);
  assert.match(html, /relative h-\[852px\] w-\[393px\] shrink-0 origin-top overflow-hidden bg-\[#fff1d1\]/);
  assert.match(html, /left-\[177px\] top-\[406px\] h-10 w-10/);
  assert.doesNotMatch(html, /flex min-h-48 flex-col items-center justify-center rounded-\[var\(--qling-radius-card\)\]/);
});

test('zero replies state shows only my worry without empty copy', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({ replies: [] })));

  assert.match(html, /내 고민 본문\.\.\./);
  assert.match(html, /내 고민 본문 원문/);
  assert.doesNotMatch(html, /아직 답변이 없어요/);
  assert.doesNotMatch(html, /첫 고민을 남겨보세요/);
  assert.equal((html.match(/도착한 답변<\/p>/g) ?? []).length, 0);
});

test('answer check cards use Figma-like card internals without the old helper labels', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps()));

  assert.match(html, /rounded-\[18px\] bg-white px-\[19px\]/);
  assert.match(html, /shadow-\[0_4px_4px_rgb\(0_0_0\/0\.25\)\]/);
  assert.match(html, /text-\[16px\] font-extrabold leading-6 tracking-\[-0\.48px\]/);
  assert.match(html, /text-\[12px\] font-bold leading-6 tracking-\[-0\.36px\]/);
  assert.doesNotMatch(html, />내 고민<\/p>/);
  assert.doesNotMatch(html, />도착한 답변<\/p>/);
});

test('worry card renders summary and original body in separate Figma text styles', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    worry: {
      worryId: 'worry-long',
      summaryText: '01234567890123456789...',
      bodyText: '012345678901234567890123456789 원문 전체',
      categoryLabel: '외모',
      createdAtLabel: '2026.05.02',
    },
  })));

  assert.match(html, /01234567890123456789\.\.\./);
  assert.match(html, /012345678901234567890123456789 원문 전체/);
  assert.match(html, /text-\[16px\] font-extrabold leading-6 tracking-\[-0\.48px\]/);
  assert.match(html, /text-\[12px\] font-bold leading-6 tracking-\[-0\.36px\]/);
});

test('answer check DOM does not render answer writer private data', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    replies: [{
      ...baseProps().replies[0],
      bodyText: '허용된 답변 본문',
    }],
  })));

  for (const forbidden of ['답변자닉', '남성', '29세', '관심사-비밀', 'profileMetadata-secret', 'answer-writer-uid']) {
    assert.equal(html.includes(forbidden), false);
  }
});

test('screen exposes separate like dislike and comment actions', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps()));

  assert.match(html, /aria-label="좋아요"/);
  assert.match(html, /aria-label="싫어요"/);
  assert.match(html, /aria-label="코멘트"/);
  assert.match(html, /my_concerns\/good\.svg/);
  assert.match(html, /my_concerns\/good_activate\.svg/);
  assert.match(html, /my_concerns\/bad\.svg/);
  assert.match(html, /my_concerns\/comment\.svg/);
  assert.match(html, /my_concerns\/comment_activate\.svg/);
  assert.doesNotMatch(html, /rotate-180/);
  assert.doesNotMatch(html, /sepia saturate|hue-rotate/);
});

test('disliked answers use the active bad asset without rotating the icon', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    replies: [{
      replyId: 'reply-disliked',
      bodyText: '싫어요 답변 본문',
      createdAtLabel: '1분 전',
      feedbackState: 'disliked',
      canLike: false,
      canDislike: true,
      canComment: false,
      isFeedbackProcessing: false,
      isCommentProcessing: false,
    }],
  })));

  assert.match(html, /my_concerns\/bad_activate\.svg/);
  assert.doesNotMatch(html, /rotate-180/);
});

test('saved publisher comment appears under the answer card divider', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps()));

  assert.match(html, /고마웠어요/);
  assert.match(html, /bg-\[#c2c4c8\]/);
});

test('inline comment editor supports submit and skip close callbacks', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    commentDialog: {
      replyId: 'reply-1',
      feedbackState: 'disliked',
      draft: 'private comment',
      maxLength: 1000,
    },
  })));

  assert.match(html, /좋아요 코멘트 입력|싫어요 코멘트 입력/);
  assert.match(html, /textarea/);
  assert.match(html, /건너뛰기/);
  assert.match(html, /제출/);
  assert.doesNotMatch(html, /role="dialog"/);
  assert.doesNotMatch(html, /코멘트 남기기/);
});

test('inline comment editor copy appears only while comment entry is open', () => {
  const closedHtml = renderToStaticMarkup(AnswerCheckScreen(baseProps({ commentDialog: null })));
  const openHtml = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    commentDialog: {
      replyId: 'reply-1',
      feedbackState: 'liked',
      draft: '고마웠어요',
      maxLength: 1000,
    },
  })));

  for (const dialogOnlyCopy of ['전하고 싶은 말을 남겨주세요.', '건너뛰기', '제출']) {
    assert.equal(closedHtml.includes(dialogOnlyCopy), false);
    assert.equal(openHtml.includes(dialogOnlyCopy), true);
  }
  assert.equal(closedHtml.includes('코멘트 남기기'), false);
  assert.equal(openHtml.includes('코멘트 남기기'), false);
});
