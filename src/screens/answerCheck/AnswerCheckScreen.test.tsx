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
        canOneLineReply: false,
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
        canOneLineReply: false,
        isFeedbackProcessing: false,
        isCommentProcessing: false,
      },
    ],
    commentDialog: null,
    onBack: () => undefined,
    onLike: () => undefined,
    onDislike: () => undefined,
    onOpenOneLineReply: () => undefined,
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

  assert.match(html, /absolute left-0 top-\[127px\] h-\[725px\] w-full overflow-y-auto/);
  assert.match(html, /overflow-hidden rounded-\[18px\] bg-white px-\[19px\] pb-\[24px\] pt-\[11px\]/);
  assert.match(html, /shadow-\[0_4px_4px_rgb\(0_0_0\/0\.25\)\]/);
  assert.match(html, /flex min-w-0 items-start gap-\[18px\]/);
  assert.match(html, /mt-\[10px\] h-\[0\.7px\] rounded-\[3px\] bg-\[#c2c4c8\]/);
  assert.match(html, /text-\[16px\] font-extrabold leading-6 tracking-\[-0\.48px\]/);
  assert.match(html, /text-\[12px\] font-bold leading-6 tracking-\[-0\.36px\]/);
  assert.doesNotMatch(html, /h-\[300px\]/);
  assert.doesNotMatch(html, /absolute left-\[19px\] top-\[112px\]/);
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

test('screen exposes like and dislike actions without the old comment action', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps()));

  assert.match(html, /aria-label="좋아요"/);
  assert.match(html, /aria-label="싫어요"/);
  assert.doesNotMatch(html, /aria-label="코멘트"/);
  assert.match(html, /my_concerns\/good\.svg/);
  assert.match(html, /my_concerns\/good_activate\.svg/);
  assert.match(html, /my_concerns\/bad\.svg/);
  assert.match(html, /h-5 w-5/);
  assert.doesNotMatch(html, /my_concerns\/good\.png/);
  assert.doesNotMatch(html, /my_concerns\/comment\.svg/);
  assert.doesNotMatch(html, /my_concerns\/comment_activate\.svg/);
  assert.doesNotMatch(html, /disabled:opacity-45/);
  assert.doesNotMatch(html, /rotate-180/);
  assert.doesNotMatch(html, /sepia saturate|hue-rotate/);
});

test('liked answer without a comment shows chat and one-line reply actions', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    replies: [{
      replyId: 'reply-liked',
      bodyText: '좋아요 답변 본문',
      createdAtLabel: '1분 전',
      feedbackState: 'liked',
      canLike: true,
      canDislike: false,
      canOneLineReply: true,
      isFeedbackProcessing: false,
      isCommentProcessing: false,
    }],
  })));

  assert.match(html, /채팅 시작/);
  assert.match(html, /한 줄 답변/);
  assert.match(html, /relative -mx-\[19px\] mt-0 grid h-\[50px\] grid-cols-2/);
  assert.match(html, /absolute left-1\/2 top-\[3px\] h-\[45px\] w-px -translate-x-1\/2/);
  assert.match(html, /bg-gradient-to-b/);
  assert.match(html, /bg-\[#c2c4c8\]/);
  assert.doesNotMatch(html, /min-h-\[281px\]/);
  assert.doesNotMatch(html, /absolute left-\[15px\] top-\[230px\]/);
});

test('none and disliked answers do not show chat or one-line reply actions', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    replies: [
      {
        replyId: 'reply-none',
        bodyText: '아직 선택 전',
        createdAtLabel: '1분 전',
        feedbackState: 'none',
        canLike: true,
        canDislike: true,
        canOneLineReply: false,
        isFeedbackProcessing: false,
        isCommentProcessing: false,
      },
      {
        replyId: 'reply-disliked',
        bodyText: '싫어요 답변 본문',
        createdAtLabel: '2분 전',
        feedbackState: 'disliked',
        canLike: false,
        canDislike: true,
        canOneLineReply: false,
        isFeedbackProcessing: false,
        isCommentProcessing: false,
      },
    ],
  })));

  assert.equal(html.includes('채팅 시작'), false);
  assert.equal(html.includes('한 줄 답변'), false);
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
      canOneLineReply: false,
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
  assert.match(html, /mt-\[12px\] whitespace-pre-wrap break-words/);
  assert.match(html, /bg-\[#c2c4c8\]/);
  assert.equal(html.includes('채팅 시작'), false);
  assert.equal(html.includes('한 줄 답변'), false);
});

test('one-line reply editor supports submit and cancel callbacks', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    commentDialog: {
      replyId: 'reply-1',
      feedbackState: 'liked',
      draft: 'private comment',
      maxLength: 1000,
      validationMessage: '코멘트를 입력해 주세요.',
      moderationMessage: '다시 작성해 주세요.',
    },
  })));

  assert.match(html, /한 줄 답변 입력/);
  assert.match(html, /textarea/);
  assert.match(html, /My example comment\./);
  assert.match(html, /취소/);
  assert.match(html, /제출/);
  assert.match(html, /코멘트를 입력해 주세요\./);
  assert.match(html, /다시 작성해 주세요\./);
  assert.doesNotMatch(html, /role="dialog"/);
  assert.doesNotMatch(html, /코멘트 남기기/);
});

test('one-line reply editor copy appears only while entry is open', () => {
  const closedHtml = renderToStaticMarkup(AnswerCheckScreen(baseProps({ commentDialog: null })));
  const openHtml = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    commentDialog: {
      replyId: 'reply-1',
      feedbackState: 'liked',
      draft: '고마웠어요',
      maxLength: 1000,
    },
  })));

  for (const dialogOnlyCopy of ['My example comment.', '취소', '제출']) {
    assert.equal(closedHtml.includes(dialogOnlyCopy), false);
    assert.equal(openHtml.includes(dialogOnlyCopy), true);
  }
  assert.equal(closedHtml.includes('코멘트 남기기'), false);
  assert.equal(openHtml.includes('코멘트 남기기'), false);
});
