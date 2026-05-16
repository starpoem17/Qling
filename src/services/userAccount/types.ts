export type DeleteMyAccountResult = {
  status: 'deleted';
  deletedTokenCount: number;
  deletedReadStateCount: number;
  deletedNicknameReservation: boolean;
};

export type UserAccountClock = {
  now(): unknown;
};

export type UserAccountRepository = {
  deleteUserAccountState(params: { uid: string }): Promise<{
    deletedTokenCount: number;
    deletedReadStateCount: number;
    deletedNicknameReservation: boolean;
  }>;
};
