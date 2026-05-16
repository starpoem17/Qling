import { FieldValue, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import type {
  AccountDeletionCleanupPhase,
  AccountDeletionCleanupResult,
  AccountDeletionCleanupStep,
  UserAccountClock,
  UserAccountRepository,
} from './types';

type AccountDeletionCleanupPhaseFailure = {
  status: 'failed';
  phase: AccountDeletionCleanupPhase;
  step?: AccountDeletionCleanupStep;
  firebaseCode?: string;
};

export function createServerTimestampClock(): UserAccountClock {
  return {
    now: () => FieldValue.serverTimestamp(),
  };
}

export function createFirestoreUserAccountRepository(params: {
  db: Firestore;
}): UserAccountRepository {
  return {
    async deleteUserAccountState(input) {
      const completedPhases: AccountDeletionCleanupPhase[] = [];
      const runPhase = async <T>(phase: AccountDeletionCleanupPhase, action: () => Promise<T>) => {
        try {
          const result = await action();
          completedPhases.push(phase);
          return { status: 'success' as const, result };
        } catch (error) {
          return {
            status: 'failed' as const,
            phase,
            step: cleanupErrorStep(error),
            firebaseCode: firebaseErrorCode(error),
          };
        }
      };
      const runCleanupStep = async <T>(
        phase: AccountDeletionCleanupPhase,
        step: AccountDeletionCleanupStep,
        action: () => Promise<T>
      ) => {
        try {
          return {
            status: 'success' as const,
            result: await action(),
          };
        } catch (error) {
          return {
            status: 'failed' as const,
            phase,
            step,
            firebaseCode: firebaseErrorCode(error),
          };
        }
      };

      const userRef = params.db.collection('users').doc(input.uid);
      const loadedUser = await runPhase('load_user_profile', () => userRef.get());
      if (loadedUser.status === 'failed') return cleanupFailure(loadedUser);

      const userDoc = loadedUser.result;
      const normalizedNickname = userDoc.exists && typeof userDoc.data()?.normalizedNickname === 'string'
        ? userDoc.data()?.normalizedNickname as string
        : null;
      let reservationRef: DocumentReference | null = null;
      let reservationBelongsToUser = false;

      if (normalizedNickname) {
        reservationRef = params.db.collection('nicknameReservations').doc(normalizedNickname);
        const reservation = await runPhase('load_user_profile', () => reservationRef?.get() ?? Promise.resolve(null));
        if (reservation.status === 'failed') return cleanupFailure(reservation);
        reservationBelongsToUser = Boolean(
          reservation.result?.exists
          && reservation.result.data()?.uid === input.uid
        );
      }

      const tokenRefs = await runPhase('delete_fcm_tokens', async () => {
        return cleanupUserSubcollection({
          db: params.db,
          userRef,
          collectionName: 'fcmTokens',
          phase: 'delete_fcm_tokens',
          listDocsStep: 'list_token_docs',
          commitDeletesStep: 'commit_token_deletes',
          verifyDeletesStep: 'verify_token_deletes',
          verificationCode: 'verification/token-documents-exist',
          runCleanupStep,
        });
      });
      if (tokenRefs.status === 'failed') return cleanupFailure(tokenRefs);

      const deliveryReadStateRefs = await runPhase('delete_delivery_read_states', async () => {
        return cleanupUserSubcollection({
          db: params.db,
          userRef,
          collectionName: 'deliveryReadStates',
          phase: 'delete_delivery_read_states',
          listDocsStep: 'list_delivery_read_state_docs',
          commitDeletesStep: 'commit_delivery_read_state_deletes',
          verifyDeletesStep: 'verify_delivery_read_state_deletes',
          verificationCode: 'verification/delivery-read-state-documents-exist',
          runCleanupStep,
        });
      });
      if (deliveryReadStateRefs.status === 'failed') return cleanupFailure(deliveryReadStateRefs);

      const replyReadStateRefs = await runPhase('delete_reply_read_states', async () => {
        return cleanupUserSubcollection({
          db: params.db,
          userRef,
          collectionName: 'replyReadStates',
          phase: 'delete_reply_read_states',
          listDocsStep: 'list_reply_read_state_docs',
          commitDeletesStep: 'commit_reply_read_state_deletes',
          verifyDeletesStep: 'verify_reply_read_state_deletes',
          verificationCode: 'verification/reply-read-state-documents-exist',
          runCleanupStep,
        });
      });
      if (replyReadStateRefs.status === 'failed') return cleanupFailure(replyReadStateRefs);

      const deletedNicknameReservation = await runPhase('delete_nickname_reservation', async () => {
        if (!reservationRef || !reservationBelongsToUser) return false;
        await commitDeletes(params.db, [reservationRef]);
        return true;
      });
      if (deletedNicknameReservation.status === 'failed') return cleanupFailure(deletedNicknameReservation);

      const deletedUser = await runPhase('delete_user_document', () => commitDeletes(params.db, [userRef]));
      if (deletedUser.status === 'failed') return cleanupFailure(deletedUser);

      const verifiedUser = await runPhase('verify_user_document_deleted', async () => {
        const postDeleteUser = await userRef.get();
        if (postDeleteUser.exists) {
          throw Object.assign(new Error('user document still exists'), { code: 'verification/user-document-exists' });
        }
      });
      if (verifiedUser.status === 'failed') return cleanupFailure(verifiedUser);

      const verifiedReservation = await runPhase('verify_nickname_reservation_deleted', async () => {
        if (!reservationRef || !reservationBelongsToUser) return;
        const postDeleteReservation = await reservationRef.get();
        if (postDeleteReservation.exists) {
          throw Object.assign(new Error('nickname reservation still exists'), { code: 'verification/nickname-reservation-exists' });
        }
      });
      if (verifiedReservation.status === 'failed') return cleanupFailure(verifiedReservation);

      return {
        status: 'success' as const,
        deletedTokenCount: tokenRefs.result.length,
        deletedReadStateCount: deliveryReadStateRefs.result.length + replyReadStateRefs.result.length,
        deletedNicknameReservation: deletedNicknameReservation.result,
        completedPhases,
      };
    },
  };
}

function cleanupFailure(input: {
  phase: AccountDeletionCleanupPhase;
  step?: AccountDeletionCleanupStep;
  firebaseCode?: string;
}): AccountDeletionCleanupResult {
  return {
    status: 'failed',
    phase: input.phase,
    ...(input.step ? { step: input.step } : {}),
    firebaseCode: input.firebaseCode,
  };
}

function cleanupStepError(input: AccountDeletionCleanupPhaseFailure) {
  return Object.assign(new Error(`Account deletion cleanup failed during ${input.phase}`), {
    ...input,
    code: input.firebaseCode,
  });
}

function firebaseErrorCode(error: unknown) {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : undefined;
}

function cleanupErrorStep(error: unknown) {
  return typeof error === 'object'
    && error !== null
    && 'step' in error
    && typeof (error as { step?: unknown }).step === 'string'
    ? (error as { step: AccountDeletionCleanupStep }).step
    : undefined;
}

async function listUserSubcollectionIds(userRef: DocumentReference) {
  const refWithListCollections = userRef as DocumentReference & {
    listCollections?: () => Promise<Array<{ id: string }>>;
  };
  if (typeof refWithListCollections.listCollections !== 'function') {
    return ['fcmTokens'];
  }

  const collections = await refWithListCollections.listCollections();
  return collections.map(collection => collection.id);
}

async function cleanupUserSubcollection(params: {
  db: Firestore;
  userRef: DocumentReference;
  collectionName: 'fcmTokens' | 'deliveryReadStates' | 'replyReadStates';
  phase: AccountDeletionCleanupPhase;
  listDocsStep: AccountDeletionCleanupStep;
  commitDeletesStep: AccountDeletionCleanupStep;
  verifyDeletesStep: AccountDeletionCleanupStep;
  verificationCode: string;
  runCleanupStep: <T>(
    phase: AccountDeletionCleanupPhase,
    step: AccountDeletionCleanupStep,
    action: () => Promise<T>
  ) => Promise<
    | { status: 'success'; result: T }
    | AccountDeletionCleanupPhaseFailure
  >;
}) {
  const collectionCheck = await params.runCleanupStep(
    params.phase,
    'list_collections',
    () => listUserSubcollectionIds(params.userRef)
  );
  if (collectionCheck.status === 'failed') throw cleanupStepError(collectionCheck);
  if (!collectionCheck.result.includes(params.collectionName)) return [];

  const collection = await params.runCleanupStep(
    params.phase,
    'get_collection_ref',
    async () => params.userRef.collection(params.collectionName)
  );
  if (collection.status === 'failed') throw cleanupStepError(collection);

  const refs = await params.runCleanupStep(
    params.phase,
    params.listDocsStep,
    async () => {
      const snapshot = await collection.result.get();
      return snapshot.docs.map(doc => doc.ref);
    }
  );
  if (refs.status === 'failed') throw cleanupStepError(refs);

  const committed = await params.runCleanupStep(
    params.phase,
    params.commitDeletesStep,
    () => commitDeletes(params.db, refs.result)
  );
  if (committed.status === 'failed') throw cleanupStepError(committed);

  const verified = await params.runCleanupStep(params.phase, params.verifyDeletesStep, async () => {
    const snapshot = await collection.result.get();
    if (!snapshot.empty && snapshot.docs.length > 0) {
      throw Object.assign(new Error(`${params.collectionName} documents still exist`), {
        code: params.verificationCode,
      });
    }
  });
  if (verified.status === 'failed') throw cleanupStepError(verified);

  return refs.result;
}

async function commitDeletes(db: Firestore, refs: DocumentReference[]) {
  if (refs.length === 0) return;

  for (let index = 0; index < refs.length; index += 450) {
    const batch = db.batch();
    for (const ref of refs.slice(index, index + 450)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}
