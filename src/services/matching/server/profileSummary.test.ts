import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProfileSummaryProviderOutput } from './profileSummary';

test('normalizes valid profile summary provider output from string or object', () => {
  assert.deepEqual(
    normalizeProfileSummaryProviderOutput(' 취업 고민에 현실적인 경험을 나눌 수 있어요. '),
    { status: 'valid', summary: '취업 고민에 현실적인 경험을 나눌 수 있어요.' }
  );
  assert.deepEqual(
    normalizeProfileSummaryProviderOutput({ profileSummary: '진로 혼란에 공감과 관점 정리를 도울 수 있어요.' }),
    { status: 'valid', summary: '진로 혼란에 공감과 관점 정리를 도울 수 있어요.' }
  );
});

test('rejects empty multiline and overlong profile summaries', () => {
  assert.deepEqual(normalizeProfileSummaryProviderOutput(''), { status: 'invalid' });
  assert.deepEqual(normalizeProfileSummaryProviderOutput('짧음'), { status: 'invalid' });
  assert.deepEqual(normalizeProfileSummaryProviderOutput('첫 문장\n둘째 문장'), { status: 'invalid' });
  assert.deepEqual(normalizeProfileSummaryProviderOutput('가'.repeat(81)), { status: 'invalid' });
});
