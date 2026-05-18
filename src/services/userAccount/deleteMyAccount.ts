import type {
  AccountDeletionCleanupPhase,
  AccountDeletionCleanupStep,
  DeleteMyAccountResult,
  UserAccountClock,
  UserAccountRepository,
} from './types';

export class AccountDeletionCleanupError extends Error {
  constructor(
    readonly phase: AccountDeletionCleanupPhase,
    readonly firebaseCode: string | undefined,
    readonly step?: AccountDeletionCleanupStep
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
  const cleanup = await params.repository.deleteUserAccountState({
    uid: params.uid,
    deletedAt: params.clock.now(),
  });
  if (cleanup.status === 'failed') {
    throw new AccountDeletionCleanupError(cleanup.phase, cleanup.firebaseCode, cleanup.step);
  }
  return {
    status: 'deleted',
    deletedTokenCount: cleanup.deletedTokenCount,
    deletedReadStateCount: cleanup.deletedReadStateCount,
    deletedNicknameReservation: cleanup.deletedNicknameReservation,
    completedPhases: cleanup.completedPhases,
  };
}
