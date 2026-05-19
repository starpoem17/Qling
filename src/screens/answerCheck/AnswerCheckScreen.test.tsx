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
      bodyText: '내 고민 본문',
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
        feedbackState: 'liked',
        canLike: true,
        canDislike: false,
        canComment: true,
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
  assert.match(html, /내 고민 본문/);
  assert.match(html, /첫 번째 답변 본문/);
  assert.match(html, /두 번째 답변 본문/);
});

test('zero replies state shows only my worry without empty copy', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({ replies: [] })));

  assert.match(html, /내 고민 본문/);
  assert.doesNotMatch(html, /아직 답변이 없어요/);
  assert.doesNotMatch(html, /첫 고민을 남겨보세요/);
  assert.equal((html.match(/도착한 답변<\/p>/g) ?? []).length, 0);
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
});

test('comment dialog supports submit and skip close callbacks', () => {
  const html = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    commentDialog: {
      replyId: 'reply-1',
      feedbackState: 'disliked',
      draft: 'private comment',
      maxLength: 1000,
    },
  })));

  assert.match(html, /좋아요 코멘트 입력|싫어요 코멘트 입력/);
  assert.match(html, /건너뛰기/);
  assert.match(html, /제출/);
});

test('comment dialog copy appears only while the comment dialog is open', () => {
  const closedHtml = renderToStaticMarkup(AnswerCheckScreen(baseProps({ commentDialog: null })));
  const openHtml = renderToStaticMarkup(AnswerCheckScreen(baseProps({
    commentDialog: {
      replyId: 'reply-2',
      feedbackState: 'liked',
      draft: '고마웠어요',
      maxLength: 1000,
    },
  })));

  for (const dialogOnlyCopy of ['코멘트 남기기', '전하고 싶은 말을 남겨주세요.', '건너뛰기', '제출']) {
    assert.equal(closedHtml.includes(dialogOnlyCopy), false);
    assert.equal(openHtml.includes(dialogOnlyCopy), true);
  }
});
