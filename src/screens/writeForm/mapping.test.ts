import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import { CONTENT_MAX_LENGTH, validateDraftContent } from '../../services/validation/content';
import type { SelectedReceivedWorry } from '../receivedWorries/ReceivedWorriesContainer';
import { buildUserFacingSummary, buildWriteDraftContract, mapSelectedWorryToOriginalWorrySummary } from './mapping';

const now = new Date(2026, 4, 19, 12, 0, 0);

test('maps selected delivery data to original worry summary props', () => {
  const summary = mapSelectedWorryToOriginalWorrySummary({
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    category: WORRY_CATEGORIES[2],
    categories: ['invalid-category', WORRY_CATEGORIES[3]],
    originalContent: 'Original worry body',
    refinedContent: 'LLM summary',
    createdAt: { toMillis: () => new Date(2026, 4, 18, 23, 59, 0).getTime() },
  } as SelectedReceivedWorry, { now });

  assert.deepEqual(summary, {
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    category: WORRY_CATEGORIES[3],
    summaryText: 'LLM summary',
    originalBodyText: 'Original worry body',
    receivedAt: {
      label: '2026.05.18',
      isoValue: new Date(2026, 4, 18, 23, 59, 0).toISOString(),
    },
  });
});

test('reply summary uses shared local display date formatter', () => {
  const base = {
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    category: WORRY_CATEGORIES[2],
    originalContent: 'Original worry',
    refinedContent: 'Original worry',
  } as SelectedReceivedWorry;

  assert.equal(mapSelectedWorryToOriginalWorrySummary({
    ...base,
    createdAt: { toMillis: () => new Date(2026, 4, 19, 11, 59, 45).getTime() },
  }, { now })?.receivedAt?.label, '방금 전');
  assert.equal(mapSelectedWorryToOriginalWorrySummary({
    ...base,
    createdAt: { toMillis: () => new Date(2026, 4, 19, 11, 10, 0).getTime() },
  }, { now })?.receivedAt?.label, '50분 전');
  assert.equal(mapSelectedWorryToOriginalWorrySummary({
    ...base,
    createdAt: { toMillis: () => new Date(2026, 4, 19, 1, 0, 0).getTime() },
  }, { now })?.receivedAt?.label, '11시간 전');
  assert.equal(mapSelectedWorryToOriginalWorrySummary({
    ...base,
    createdAt: { toMillis: () => new Date(2026, 4, 17, 12, 0, 0).getTime() },
  }, { now })?.receivedAt?.label, '2026.05.17');
  assert.equal(mapSelectedWorryToOriginalWorrySummary({
    ...base,
    createdAt: { seconds: new Date(2026, 4, 19, 11, 59, 45).getTime() / 1000 },
  }, { now })?.receivedAt?.label, '방금 전');
  assert.equal(mapSelectedWorryToOriginalWorrySummary({
    ...base,
    createdAt: { _seconds: new Date(2026, 4, 17, 12, 0, 0).getTime() / 1000 },
  }, { now })?.receivedAt?.label, '2026.05.17');
});

test('reply summary fallback uses original first 20 characters plus ellipsis', () => {
  assert.equal(buildUserFacingSummary({
    summaryText: '',
    originalBodyText: '01234567890123456789extra',
  }), '01234567890123456789...');
  assert.equal(buildUserFacingSummary({
    summaryText: '   ',
    originalBodyText: '짧은 원문',
  }), '짧은 원문...');
  assert.equal(buildUserFacingSummary({
    originalBodyText: '',
  }), '...');
});

test('reply summary mapping keeps original body out of the default summary field', () => {
  const summary = mapSelectedWorryToOriginalWorrySummary({
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    category: WORRY_CATEGORIES[0],
    originalContent: '원문 전체에는 화면 기본 카드에 노출되면 안 되는 긴 고민 내용이 들어 있습니다.',
    refinedContent: '',
    createdAt: null,
  } as SelectedReceivedWorry);

  assert.equal(summary?.summaryText, '원문 전체에는 화면 기본 카드에 노출...');
  assert.equal(summary?.originalBodyText, '원문 전체에는 화면 기본 카드에 노출되면 안 되는 긴 고민 내용이 들어 있습니다.');
});

test('reply summary mapping exposes only PRD-allowed worry context fields', () => {
  const summary = mapSelectedWorryToOriginalWorrySummary({
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    category: WORRY_CATEGORIES[0],
    originalContent: 'Original body',
    refinedContent: 'Summary',
    senderId: 'publisher-uid',
    authorUid: 'author-uid',
  } as SelectedReceivedWorry);

  assert.deepEqual(Object.keys(summary ?? {}).sort(), [
    'category',
    'deliveryId',
    'originalBodyText',
    'receivedAt',
    'summaryText',
    'worryId',
  ]);
  assert.equal(JSON.stringify(summary).includes('publisher-uid'), false);
  assert.equal(JSON.stringify(summary).includes('author-uid'), false);
});

test('does not create reply summary props without delivery or worry id', () => {
  assert.equal(mapSelectedWorryToOriginalWorrySummary({
    worryId: 'worry-1',
    category: WORRY_CATEGORIES[0],
    refinedContent: 'Legacy worry',
  } as SelectedReceivedWorry), null);

  assert.equal(mapSelectedWorryToOriginalWorrySummary({
    deliveryId: 'delivery-1',
    category: WORRY_CATEGORIES[0],
    refinedContent: 'Legacy worry',
  } as SelectedReceivedWorry), null);
});

test('builds valid draft contract', () => {
  const contract = buildWriteDraftContract({
    value: '  valid draft  ',
    maxLength: CONTENT_MAX_LENGTH,
    validation: validateDraftContent('  valid draft  ', 'worry'),
    moderation: { status: 'idle' },
    isProcessing: false,
  });

  assert.equal(contract.characterCount, 11);
  assert.equal(contract.validation.status, 'valid');
  assert.equal(contract.submitDisabledReason, undefined);
});

test('builds empty and too-long draft disabled states', () => {
  const empty = buildWriteDraftContract({
    value: '   ',
    maxLength: CONTENT_MAX_LENGTH,
    validation: validateDraftContent('   ', 'reply'),
    moderation: { status: 'idle' },
    isProcessing: false,
  });
  const tooLongValue = 'a'.repeat(CONTENT_MAX_LENGTH + 1);
  const tooLong = buildWriteDraftContract({
    value: tooLongValue,
    maxLength: CONTENT_MAX_LENGTH,
    validation: validateDraftContent(tooLongValue, 'reply'),
    moderation: { status: 'idle' },
    isProcessing: false,
  });

  assert.equal(empty.validation.status, 'invalid');
  assert.equal(empty.submitDisabledReason, 'empty');
  assert.equal(tooLong.characterCount, CONTENT_MAX_LENGTH + 1);
  assert.equal(tooLong.submitDisabledReason, 'too-long');
});

test('builds processing and moderation display states', () => {
  const processing = buildWriteDraftContract({
    value: 'draft',
    maxLength: CONTENT_MAX_LENGTH,
    validation: validateDraftContent('draft', 'worry'),
    moderation: { status: 'checking' },
    isProcessing: true,
  });
  const rejected = buildWriteDraftContract({
    value: 'draft',
    maxLength: CONTENT_MAX_LENGTH,
    validation: validateDraftContent('draft', 'worry'),
    moderation: { status: 'rejected', reason: 'Rejected', helpMessage: 'Help' },
    isProcessing: false,
  });
  const failed = buildWriteDraftContract({
    value: 'draft',
    maxLength: CONTENT_MAX_LENGTH,
    validation: validateDraftContent('draft', 'worry'),
    moderation: { status: 'failed', message: 'Failed' },
    isProcessing: false,
  });

  assert.equal(processing.submitDisabledReason, 'processing');
  assert.equal(rejected.moderation.status, 'rejected');
  assert.equal(failed.errorMessage, 'Failed');
});

test('builds moderation-pending disabled state when checking is represented without submit processing', () => {
  const contract = buildWriteDraftContract({
    value: 'draft',
    maxLength: CONTENT_MAX_LENGTH,
    validation: validateDraftContent('draft', 'worry'),
    moderation: { status: 'checking' },
    isProcessing: false,
  });

  assert.equal(contract.submitDisabledReason, 'moderation-pending');
});
