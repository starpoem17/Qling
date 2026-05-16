import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { POLICY_EMPTY_STATE_MESSAGE, type PolicyDocumentKind, type PolicyDocumentResult } from './types';

const POLICY_FILE_BY_KIND: Record<PolicyDocumentKind, string> = {
  privacy_policy: 'docs/privacy_policy.md',
  operation_policy: 'docs/operation_policy.md',
};

export function loadPolicyDocument(params: {
  readonly kind: PolicyDocumentKind;
  readonly rootDir?: string;
}): PolicyDocumentResult {
  const rootDir = params.rootDir ?? process.cwd();
  const filePath = resolve(rootDir, POLICY_FILE_BY_KIND[params.kind]);

  if (!existsSync(filePath)) {
    return { status: 'empty', message: POLICY_EMPTY_STATE_MESSAGE };
  }

  const body = readFileSync(filePath, 'utf8').trim();
  if (!body) {
    return { status: 'empty', message: POLICY_EMPTY_STATE_MESSAGE };
  }

  return { status: 'ready', body };
}
