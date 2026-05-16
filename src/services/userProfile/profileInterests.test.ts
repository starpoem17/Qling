import test from 'node:test';
import assert from 'node:assert/strict';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import { updateMyInterests, validateEditableInterests } from './profileInterests';

test('validates editable interests using domain categories including 워라밸', () => {
  const validation = validateEditableInterests(['워라밸', WORRY_CATEGORIES[0], 'invalid']);

  assert.equal(validation.valid, true);
  if (validation.valid) {
    assert.deepEqual(validation.interests, ['워라밸', WORRY_CATEGORIES[0]]);
  }
});

test('rejects empty editable interests', () => {
  const validation = validateEditableInterests(['invalid']);

  assert.deepEqual(validation, {
    valid: false,
    error: 'required',
    message: '관심 분야를 1개 이상 선택해주세요.',
  });
});

test('updateMyInterests persists only interests through repository seam', async () => {
  const calls: unknown[] = [];
  const result = await updateMyInterests({
    uid: 'user-1',
    interests: ['워라밸'],
    repository: {
      async updateInterests(params) {
        calls.push(params);
        return { status: 'updated', interests: params.interests };
      },
    },
  });

  assert.deepEqual(calls, [{ uid: 'user-1', interests: ['워라밸'] }]);
  assert.deepEqual(result, { status: 'updated', interests: ['워라밸'] });
  assert.equal(JSON.stringify(calls).includes('gender'), false);
  assert.equal(JSON.stringify(calls).includes('nickname'), false);
  assert.equal(JSON.stringify(calls).includes('age'), false);
});

test('updateMyInterests rejects invalid input before repository mutation', async () => {
  let called = false;
  const result = await updateMyInterests({
    uid: 'user-1',
    interests: [],
    repository: {
      async updateInterests() {
        called = true;
        throw new Error('should not persist');
      },
    },
  });

  assert.equal(called, false);
  assert.equal(result.status, 'invalid');
});
