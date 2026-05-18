import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import type {
  WriteDraftContract,
  WriteFormScreenProps,
  WriteReplyFormProps,
  WriteReplySuccessScreenProps,
  WriteWorryFormProps,
  WriteWorryScreenProps,
  WriteWorrySuccessScreenProps,
} from './contract';

const validDraft = {
  value: 'Draft text',
  characterCount: 10,
  maxLength: 500,
  validation: { status: 'valid' },
  moderation: { status: 'idle' },
  isProcessing: false,
} as const;

test('write-worry form contract represents draft, category, validation, and publish event', () => {
  const props = {
    kind: 'write-worry',
    draft: {
      ...validDraft,
      moderation: { status: 'failed', message: 'Submit failed' },
      errorMessage: 'Submit failed',
      submitDisabledReason: 'processing',
    },
    category: WORRY_CATEGORIES[0],
    onBack: () => undefined,
    onDraftChange: () => undefined,
    onCategoryChange: () => undefined,
    onPublish: () => undefined,
  } satisfies WriteWorryFormProps;

  assert.equal(props.kind, 'write-worry');
  assert.equal(props.draft.characterCount, 10);
  assert.equal(props.draft.maxLength, 500);
  assert.equal(props.draft.value, 'Draft text');
  assert.equal(props.draft.validation.status, 'valid');
  assert.equal(props.draft.moderation.status, 'failed');
  assert.equal(props.draft.errorMessage, 'Submit failed');
  assert.equal(props.draft.isProcessing, false);
  assert.equal(typeof props.onDraftChange, 'function');
  assert.equal(typeof props.onBack, 'function');
  assert.equal(typeof props.onPublish, 'function');
});

test('write-worry screen contract separates back, draft, and publish intents from route/API objects', () => {
  const props = {
    draft: validDraft,
    onBack: () => undefined,
    onDraftChange: () => undefined,
    onPublish: () => undefined,
  } satisfies WriteWorryScreenProps;

  assert.equal(typeof props.onBack, 'function');
  assert.equal(typeof props.onDraftChange, 'function');
  assert.equal(typeof props.onPublish, 'function');
  assert.equal(Object.hasOwn(props, 'setView'), false);
  assert.equal(Object.hasOwn(props, 'publishWorryViaApi'), false);
  assert.equal(Object.hasOwn(props, 'draftStorage'), false);
});

test('write-worry success screen contract exposes confirm only', () => {
  const props = {
    onConfirm: () => undefined,
  } satisfies WriteWorrySuccessScreenProps;

  assert.equal(typeof props.onConfirm, 'function');
  assert.equal(Object.hasOwn(props, 'setView'), false);
  assert.equal(Object.hasOwn(props, 'route'), false);
});

test('write-reply success screen contract exposes confirm only', () => {
  const props = {
    onConfirm: () => undefined,
  } satisfies WriteReplySuccessScreenProps;

  assert.equal(typeof props.onConfirm, 'function');
  assert.equal(Object.hasOwn(props, 'setView'), false);
  assert.equal(Object.hasOwn(props, 'route'), false);
});

test('write-reply form contract carries original worry summary, selected delivery, and worry ids', () => {
  const props = {
    kind: 'write-reply',
    originalWorry: {
      deliveryId: 'delivery-1',
      worryId: 'worry-1',
      category: WORRY_CATEGORIES[1],
      summaryText: 'LLM summary',
      originalBodyText: 'Original worry body',
      receivedAt: { label: 'Today' },
    },
    draft: {
      ...validDraft,
      moderation: { status: 'rejected', reason: 'Rejected content' },
      errorMessage: 'Submit failed',
      submitDisabledReason: 'moderation-pending',
    },
    isOriginalOverlayOpen: false,
    onBack: () => undefined,
    onDraftChange: () => undefined,
    onOpenOriginal: () => undefined,
    onCloseOriginal: () => undefined,
    onPublish: () => undefined,
  } satisfies WriteReplyFormProps;

  assert.equal(props.originalWorry.deliveryId, 'delivery-1');
  assert.equal(props.originalWorry.worryId, 'worry-1');
  assert.equal(props.originalWorry.summaryText, 'LLM summary');
  assert.equal(props.originalWorry.originalBodyText, 'Original worry body');
  assert.equal(props.draft.value, 'Draft text');
  assert.equal(props.draft.moderation.status, 'rejected');
  assert.equal(props.draft.submitDisabledReason, 'moderation-pending');
  assert.equal(typeof props.onDraftChange, 'function');
  assert.equal(typeof props.onBack, 'function');
  assert.equal(typeof props.onOpenOriginal, 'function');
  assert.equal(typeof props.onCloseOriginal, 'function');
  assert.equal(typeof props.onPublish, 'function');
});

test('write form union keeps publication as event props only', () => {
  const props: WriteFormScreenProps = {
    kind: 'write-reply',
    originalWorry: {
      deliveryId: 'delivery-1',
      worryId: 'worry-1',
      category: WORRY_CATEGORIES[0],
      summaryText: 'Summary',
      originalBodyText: 'Original',
    },
    draft: {
      ...validDraft,
      validation: { status: 'invalid', message: 'Too long' },
      submitDisabledReason: 'too-long',
    },
    isOriginalOverlayOpen: false,
    onBack: () => undefined,
    onDraftChange: () => undefined,
    onOpenOriginal: () => undefined,
    onCloseOriginal: () => undefined,
    onPublish: () => undefined,
  };

  assert.equal(typeof props.onPublish, 'function');
  assert.equal(Object.hasOwn(props, 'publishResult'), false);
  assert.equal(Object.hasOwn(props, 'publicationClient'), false);
  assert.equal(Object.hasOwn(props, 'successRoute'), false);
  assert.equal(Object.hasOwn(props, 'successScreen'), false);
});

test('write form contract covers empty, too-long, valid, processing, rejected, and failed states', () => {
  const states: Array<Partial<WriteDraftContract> & Pick<WriteDraftContract, 'validation'>> = [
    { validation: { status: 'invalid', message: 'Required' }, submitDisabledReason: 'empty' },
    { validation: { status: 'invalid', message: 'Too long' }, submitDisabledReason: 'too-long' },
    { validation: { status: 'valid' }, submitDisabledReason: undefined },
    { validation: { status: 'valid' }, isProcessing: true, submitDisabledReason: 'processing' },
    { validation: { status: 'valid' }, moderation: { status: 'rejected', reason: 'Rejected', helpMessage: 'Help' } },
    { validation: { status: 'valid' }, moderation: { status: 'failed', message: 'Failed' }, errorMessage: 'Failed' },
  ] as const;

  for (const state of states) {
    const draft: WriteDraftContract = {
      ...validDraft,
      ...state,
      moderation: state.moderation ?? validDraft.moderation,
      isProcessing: state.isProcessing ?? false,
    };
    const props = {
      kind: 'write-worry',
      draft,
      onBack: () => undefined,
      onDraftChange: () => undefined,
      onPublish: () => undefined,
    } satisfies WriteWorryFormProps;

    assert.equal(props.draft.validation.status, state.validation.status);
    assert.equal(props.draft.submitDisabledReason, state.submitDisabledReason);
  }
});

test('write form callbacks stay pure events for publish, draft clearing, and route transition policies', () => {
  const events: string[] = [];
  const props = {
    kind: 'write-reply',
    originalWorry: {
      deliveryId: 'delivery-1',
      worryId: 'worry-1',
      category: WORRY_CATEGORIES[0],
      summaryText: 'Summary',
      originalBodyText: 'Original',
    },
    draft: validDraft,
    isOriginalOverlayOpen: false,
    onBack: () => events.push('back'),
    onDraftChange: value => events.push(`draft:${value}`),
    onOpenOriginal: () => events.push('open-original'),
    onCloseOriginal: () => events.push('close-original'),
    onPublish: target => events.push(`publish:${target.deliveryId}:${target.worryId}`),
  } satisfies WriteReplyFormProps;

  props.onBack();
  props.onDraftChange('updated');
  props.onOpenOriginal();
  props.onCloseOriginal();
  props.onPublish({ deliveryId: props.originalWorry.deliveryId, worryId: props.originalWorry.worryId });

  assert.deepEqual(events, ['back', 'draft:updated', 'open-original', 'close-original', 'publish:delivery-1:worry-1']);
  assert.equal(Object.hasOwn(props, 'clearDraft'), false);
  assert.equal(Object.hasOwn(props, 'setView'), false);
  assert.equal(Object.hasOwn(props, 'routeAfterReplyPublish'), false);
});
