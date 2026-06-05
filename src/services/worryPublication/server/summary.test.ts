import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorrySummary } from './summary';
import type { WorrySummaryProvider } from './types';

test('worry summary keeps content at or under 50 characters as original text without provider', async () => {
  let providerCalls = 0;
  const result = await createWorrySummary({
    content: '01234567890123456789012345678901234567890123456789',
    worryId: 'worry-1',
    failureLogId: 'summary-log-1',
    provider: async () => {
      providerCalls += 1;
      throw new Error('provider should not be called');
    },
  });

  assert.deepEqual(result, {
    summaryText: '01234567890123456789012345678901234567890123456789',
    summaryStatus: 'original',
    summaryGeneratedBy: 'none',
  });
  assert.equal(providerCalls, 0);
});

test('worry summary calls provider when original content is over 50 characters', async () => {
  const calls: Array<{ content: string; strictRetry?: boolean }> = [];
  const provider: WorrySummaryProvider = async (content, strictRetry) => {
    calls.push({ content, strictRetry });
    return '시험 암기와 성적 불안';
  };

  const result = await createWorrySummary({
    content: '012345678901234567890123456789012345678901234567890',
    worryId: 'worry-2',
    failureLogId: 'summary-log-2',
    provider,
  });

  assert.equal(result.summaryText, '시험 암기와 성적 불안');
  assert.equal(result.summaryStatus, 'llm_generated');
  assert.equal(result.summaryGeneratedBy, 'llm');
  assert.deepEqual(calls.map(call => call.strictRetry), [undefined]);
});

test('worry summary retries when the first LLM summary is over 50 characters', async () => {
  const calls: Array<{ content: string; strictRetry?: boolean }> = [];
  const provider: WorrySummaryProvider = async (content, strictRetry) => {
    calls.push({ content, strictRetry });
    return strictRetry
      ? '전공을 살릴지 새 분야에 도전할지 고민'
      : '012345678901234567890123456789012345678901234567890';
  };

  const result = await createWorrySummary({
    content: '012345678901234567890123456789012345678901234567890',
    worryId: 'worry-3',
    failureLogId: 'summary-log-3',
    provider,
  });

  assert.equal(result.summaryText, '전공을 살릴지 새 분야에 도전할지 고민');
  assert.equal(result.summaryStatus, 'llm_generated');
  assert.equal(result.summaryGeneratedBy, 'llm');
  assert.deepEqual(calls.map(call => call.strictRetry), [undefined, true]);
});

test('worry summary fallback uses first 50 characters plus ellipsis after overlong retry', async () => {
  const provider: WorrySummaryProvider = async () => '012345678901234567890123456789012345678901234567890';

  const result = await createWorrySummary({
    content: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY',
    worryId: 'worry-4',
    failureLogId: 'summary-log-4',
    provider,
  });

  assert.equal(result.summaryText, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX...');
  assert.equal(result.summaryStatus, 'fallback_truncated');
  assert.equal(result.summaryGeneratedBy, 'none');
  assert.equal(result.failureLog.attemptCount, 2);
});
