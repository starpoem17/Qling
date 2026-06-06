import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateChatMessageRuleSafety } from './ruleBasedFilter';

test('chat rule safety allows benign food and app recommendation context', () => {
  assert.deepEqual(
    evaluateChatMessageRuleSafety('고소한 거 좋아하면 다오홍슈 추천해요'),
    { status: 'approved' }
  );
  assert.deepEqual(
    evaluateChatMessageRuleSafety('사진 보정은 메이튜 쓰세요'),
    { status: 'approved' }
  );
  assert.deepEqual(
    evaluateChatMessageRuleSafety('카톡 알림 설정을 바꿔봐'),
    { status: 'approved' }
  );
});

test('chat rule safety blocks only clear immediate-risk patterns', () => {
  assert.equal(evaluateChatMessageRuleSafety('010-1234-5678로 연락해').status, 'rejected');
  assert.equal(evaluateChatMessageRuleSafety('https://example.com 여기로 와').status, 'rejected');
  assert.equal(evaluateChatMessageRuleSafety('카톡 아이디 알려줘').status, 'rejected');
  assert.equal(evaluateChatMessageRuleSafety('야동 같이 보자').status, 'rejected');
  assert.equal(evaluateChatMessageRuleSafety('씨발 꺼져').status, 'rejected');
  assert.equal(evaluateChatMessageRuleSafety('존나 별로야').status, 'rejected');
  assert.equal(evaluateChatMessageRuleSafety('가'.repeat(1001)).status, 'rejected');
});
