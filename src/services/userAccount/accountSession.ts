export type AccountSessionOperationResult =
  | { readonly status: 'completed' }
  | { readonly status: 'failed'; readonly reason: string };

export async function confirmLogoutWithCleanup(params: {
  readonly cleanupLocalPushState: () => Promise<void>;
  readonly signOut: () => Promise<void>;
}): Promise<AccountSessionOperationResult> {
  try {
    await params.cleanupLocalPushState();
    await params.signOut();
    return { status: 'completed' };
  } catch (error) {
    return {
      status: 'failed',
      reason: error instanceof Error ? error.message : '로그아웃 처리 중 문제가 발생했습니다.',
    };
  }
}

export async function confirmAccountDeletionWithCleanup(params: {
  readonly deleteAccount: () => Promise<{ readonly status: 'deleted' } | { readonly status: 'failed'; readonly reason: string }>;
  readonly cleanupLocalPushState: () => Promise<void>;
  readonly signOut: () => Promise<void>;
}): Promise<AccountSessionOperationResult> {
  const deletion = await params.deleteAccount();
  if (deletion.status === 'failed') {
    return {
      status: 'failed',
      reason: deletion.reason,
    };
  }

  await params.cleanupLocalPushState();
  await params.signOut();
  return { status: 'completed' };
}
