import { POLICY_EMPTY_STATE_MESSAGE, type PolicyDocumentKind, type PolicyDocumentResult } from './types';

export async function loadPolicyDocumentViaApi(kind: PolicyDocumentKind): Promise<PolicyDocumentResult> {
  const response = await fetch(`/api/policies/${kind}`);
  const body = await response.json().catch(() => null);
  if (response.ok) return body as PolicyDocumentResult;
  return {
    status: 'empty',
    message: body?.error?.message ?? POLICY_EMPTY_STATE_MESSAGE,
  };
}
