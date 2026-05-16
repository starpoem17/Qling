import type {
  AccountDeletionCleanupPhase,
  DeleteMyAccountResult,
  UserAccountClock,
  UserAccountRepository,
} from './types';

export class AccountDeletionCleanupError extends Error {
  constructor(
    readonly phase: AccountDeletionCleanupPhase,
    readonly firebaseCode: string | undefined
  ) {
    super(`Account deletion cleanup failed during ${phase}`);
    this.name = 'AccountDeletionCleanupError';
  }
}

export async function deleteMyAccount(params: {
  uid: string;
  repository: UserAccountRepository;
  clock: UserAccountClock;
}): Promise<DeleteMyAccountResult> {
  void params.clock;
  const cleanup = await params.repository.deleteUserAccountState({ uid: params.uid });
  if (cleanup.status === 'failed') {
    throw new AccountDeletionCleanupError(cleanup.phase, cleanup.firebaseCode);
  }
  return {
    status: 'deleted',
    deletedTokenCount: cleanup.deletedTokenCount,
    deletedReadStateCount: cleanup.deletedReadStateCount,
    deletedNicknameReservation: cleanup.deletedNicknameReservation,
    completedPhases: cleanup.completedPhases,
  };
}
