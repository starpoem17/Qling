import type {
  DeleteMyAccountResult,
  UserAccountClock,
  UserAccountRepository,
} from './types';

export async function deleteMyAccount(params: {
  uid: string;
  repository: UserAccountRepository;
  clock: UserAccountClock;
}): Promise<DeleteMyAccountResult> {
  void params.clock;
  const cleanup = await params.repository.deleteUserAccountState({ uid: params.uid });
  return {
    status: 'deleted',
    ...cleanup,
  };
}
