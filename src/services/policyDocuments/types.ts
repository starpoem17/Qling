export const POLICY_EMPTY_STATE_MESSAGE = '정책 본문 준비 중입니다.' as const;

export type PolicyDocumentKind = 'privacy_policy' | 'operation_policy';

export type PolicyDocumentResult =
  | { readonly status: 'ready'; readonly body: string }
  | { readonly status: 'empty'; readonly message: typeof POLICY_EMPTY_STATE_MESSAGE };
