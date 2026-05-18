export type DeleteMyAccountResult = {
  status: 'deleted';
  deletedTokenCount: number;
  deletedReadStateCount: number;
  deletedNicknameReservation: boolean;
  completedPhases: AccountDeletionCleanupPhase[];
};

export type AccountDeletionCleanupPhase =
  | 'load_user_profile'
  | 'delete_fcm_tokens'
  | 'delete_delivery_read_states'
  | 'delete_reply_read_states'
  | 'delete_nickname_reservation'
  | 'delete_user_document'
  | 'verify_user_document_deleted'
  | 'verify_nickname_reservation_deleted';

export type AccountDeletionCleanupStep =
  | 'list_collections'
  | 'get_collection_ref'
  | 'list_token_docs'
  | 'commit_token_deletes'
  | 'verify_token_deletes'
  | 'list_delivery_read_state_docs'
  | 'commit_delivery_read_state_deletes'
  | 'verify_delivery_read_state_deletes'
  | 'list_reply_read_state_docs'
  | 'commit_reply_read_state_deletes'
  | 'verify_reply_read_state_deletes';

export type AccountDeletionCleanupSuccess = {
  status: 'success';
  deletedTokenCount: number;
  deletedReadStateCount: number;
  deletedNicknameReservation: boolean;
  completedPhases: AccountDeletionCleanupPhase[];
};

export type AccountDeletionCleanupFailure = {
  status: 'failed';
  phase: AccountDeletionCleanupPhase;
  step?: AccountDeletionCleanupStep;
  firebaseCode?: string;
};

export type AccountDeletionCleanupResult =
  | AccountDeletionCleanupSuccess
  | AccountDeletionCleanupFailure;

export type UserAccountClock = {
  now(): unknown;
};

export type UserAccountRepository = {
  deleteUserAccountState(params: { uid: string; deletedAt: unknown }): Promise<AccountDeletionCleanupResult>;
};
