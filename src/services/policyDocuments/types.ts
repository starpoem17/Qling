export const POLICY_EMPTY_STATE_MESSAGE = '정책을 준비 중입니다.' as const;

export type PolicyDocumentKind = 'privacy_policy';

export type PolicyDocumentResult =
  | { readonly status: 'ready'; readonly body: string }
  | { readonly status: 'empty'; readonly message: typeof POLICY_EMPTY_STATE_MESSAGE };
