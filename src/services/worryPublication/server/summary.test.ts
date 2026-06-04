import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorrySummary } from './summary';
import type { WorrySummaryProvider } from './types';

test('worry summary keeps content at or under 20 characters as original text', async () => {
  const result = await createWorrySummary({
    content: '시험준비가너무불안해요',
    worryId: 'worry-1',
    failureLogId: 'summary-log-1',
    provider: async () => {
      throw new Error('provider should not be called');
    },
  });

  assert.deepEqual(result, {
    summaryText: '시험준비가너무불안해요',
    summaryStatus: 'original',
    summaryGeneratedBy: 'none',
  });
});

test('worry summary retries when the first LLM summary is over 20 characters', async () => {
  const calls: Array<{ content: string; strictRetry?: boolean }> = [];
  const provider: WorrySummaryProvider = async (content, strictRetry) => {
    calls.push({ content, strictRetry });
    return strictRetry
      ? '시험암기A+가능성'
      : '시험 2일 동안 암기로 A+ 받을 수 있을까요?';
  };

  const result = await createWorrySummary({
    content: '시험 2일 동안 암기로 A+ 받을 수 있을까요? 구체적으로 어떻게 공부해야 할지 모르겠어요.',
    worryId: 'worry-2',
    failureLogId: 'summary-log-2',
    provider,
  });

  assert.equal(result.summaryText, '시험암기A+가능성');
  assert.equal(result.summaryStatus, 'llm_generated');
  assert.equal(result.summaryGeneratedBy, 'llm');
  assert.deepEqual(calls.map(call => call.strictRetry), [undefined, true]);
});

test('worry summary only accepts LLM output at or under 20 characters', async () => {
  const provider: WorrySummaryProvider = async () => '전공살릴지새분야도전고민';

  const result = await createWorrySummary({
    content: '전공을 살릴지 새 분야에 도전할지 고민이에요. 어느 쪽이 맞을까요?',
    worryId: 'worry-3',
    failureLogId: 'summary-log-3',
    provider,
  });

  assert.deepEqual(result, {
    summaryText: '전공살릴지새분야도전고민',
    summaryStatus: 'llm_generated',
    summaryGeneratedBy: 'llm',
  });
});
