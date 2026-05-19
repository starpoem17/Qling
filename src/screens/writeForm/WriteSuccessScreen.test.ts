import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { WriteReplySuccessScreen } from './WriteReplySuccessScreen';
import { WriteWorrySuccessScreen } from './WriteWorrySuccessScreen';

test('write worry success screen renders Figma success dialog copy and clover primitive', () => {
  const html = renderToStaticMarkup(WriteWorrySuccessScreen({
    onConfirm: () => undefined,
  }));

  assert.match(html, /role="dialog"/);
  assert.match(html, /고민 전송이 완료되었어요 !/);
  assert.match(html, /답변이 오면 알려드릴게요/);
  assert.match(html, /aria-label="고민 전송 완료 확인"/);
  assert.match(html, /data-testid="figma-clover"/);
  assert.match(html, /bg-black\/32/);
  assert.match(html, /pt-\[251px\]/);
  assert.doesNotMatch(html, /lucide-clover/);
});

test('write reply success screen keeps reply copy while sharing Figma success dialog', () => {
  const html = renderToStaticMarkup(WriteReplySuccessScreen({
    onConfirm: () => undefined,
  }));

  assert.match(html, /role="dialog"/);
  assert.match(html, /답변 전송이 완료되었어요 !/);
  assert.match(html, /따뜻한 의견을 공유해주셔서 감사해요/);
  assert.match(html, /aria-label="답변 전송 완료 확인"/);
  assert.match(html, /data-testid="figma-clover"/);
  assert.doesNotMatch(html, /고민 전송이 완료되었어요 !/);
  assert.doesNotMatch(html, /lucide-clover/);
});
