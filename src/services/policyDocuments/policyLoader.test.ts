import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadPolicyDocument } from './policyLoader';

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), 'qling-policy-'));
  mkdirSync(join(root, 'docs'));
  return root;
}

test('policy loader returns production-safe empty state when source is missing', () => {
  assert.deepEqual(loadPolicyDocument({ kind: 'privacy_policy', rootDir: tempRoot() }), {
    status: 'empty',
    message: '정책을 준비 중입니다.',
  });
});

test('policy loader returns production-safe empty state when source is blank', () => {
  const root = tempRoot();
  writeFileSync(join(root, 'docs/privacy_policy.md'), '  \n');

  assert.deepEqual(loadPolicyDocument({ kind: 'privacy_policy', rootDir: root }), {
    status: 'empty',
    message: '정책을 준비 중입니다.',
  });
});

test('policy loader reads privacy policy body without fake fallback copy', () => {
  const root = tempRoot();
  writeFileSync(join(root, 'docs/privacy_policy.md'), '# 개인정보처리방침\n\nActual source.');

  assert.deepEqual(loadPolicyDocument({ kind: 'privacy_policy', rootDir: root }), {
    status: 'ready',
    body: '# 개인정보처리방침\n\nActual source.',
  });
});
