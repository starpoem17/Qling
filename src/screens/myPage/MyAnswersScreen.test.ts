import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { MyAnswersScreen } from './MyAnswersScreen';
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
      dateLabel: '2026-05-02',
      hasReceivedHeart: true,
      feedbackLabel: '받은 하트',
      feedbackComment: '힘이 됐어요',
      accessibilityLabel: '내가 쓴 답변, 카테고리 자존감, 피드백 받은 하트, 코멘트 있음',
    }],
    onBack: () => undefined,
    ...overrides,
  };
}

test('my answers screen renders same card format with heart and one small comment', () => {
  const html = renderToStaticMarkup(MyAnswersScreen(baseProps()));

  assert.match(html, /내가 쓴 답변/);
  assert.match(html, /자존감/);
  assert.match(html, /2026-05-02/);
  assert.match(html, /주변 친구들은/);
  assert.match(html, /누구나 그런 시기가/);
  assert.match(html, /힘이 됐어요/);
  assert.match(html, /text-xs/);
  assert.match(html, /fill-\[var\(--qling-color-danger\)\]/);
});

test('my answers screen does not make item cards navigate to detail routes', () => {
  const html = renderToStaticMarkup(MyAnswersScreen(baseProps()));

  assert.doesNotMatch(html, /<button[^>]*aria-label="내가 쓴 답변/);
  assert.doesNotMatch(html, /my_answer_detail|read_my_reply|routeToMyReplyDetail/);
});

test('my answers screen hides dislike feedback and publisher private data from DOM', () => {
  const html = renderToStaticMarkup(MyAnswersScreen(baseProps({
    items: [{
      replyId: 'reply-private',
      deliveryId: 'delivery-private',
      worryId: 'worry-private',
      previewText: '내 답변만 표시합니다.',
      originalWorryPreview: '허용된 고민 context만 표시합니다.',
      categoryLabel: '잡담',
      dateLabel: '방금 전',
      hasReceivedHeart: false,
      accessibilityLabel: '내가 쓴 답변, 카테고리 잡담, 피드백 없음',
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
