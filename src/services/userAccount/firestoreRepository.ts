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
      const runTokenStep = async <T>(step: AccountDeletionCleanupStep, action: () => Promise<T>) => {
        try {
          return {
            status: 'success' as const,
            result: await action(),
          };
        } catch (error) {
          return {
            status: 'failed' as const,
            phase: 'delete_fcm_tokens' as const,
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
        const collectionCheck = await runTokenStep('list_collections', () => listUserSubcollectionIds(userRef));
        if (collectionCheck.status === 'failed') throw cleanupStepError(collectionCheck);
        if (!collectionCheck.result.includes('fcmTokens')) return [];

        const tokenCollection = await runTokenStep('get_collection_ref', async () => userRef.collection('fcmTokens'));
        if (tokenCollection.status === 'failed') throw cleanupStepError(tokenCollection);

        const refs = await runTokenStep('list_token_docs', () => tokenCollection.result.listDocuments());
        if (refs.status === 'failed') throw cleanupStepError(refs);

        const committed = await runTokenStep('commit_token_deletes', () => commitDeletes(params.db, refs.result));
        if (committed.status === 'failed') throw cleanupStepError(committed);

        const verified = await runTokenStep('verify_token_deletes', async () => {
          const remainingRefs = await tokenCollection.result.listDocuments();
          if (remainingRefs.length > 0) {
            throw Object.assign(new Error('token documents still exist'), { code: 'verification/token-documents-exist' });
          }
        });
        if (verified.status === 'failed') throw cleanupStepError(verified);

        return refs.result;
      });
      if (tokenRefs.status === 'failed') return cleanupFailure(tokenRefs);

      const deliveryReadStateRefs = await runPhase('delete_delivery_read_states', async () => {
        const refs = await listCollectionDocumentRefs(userRef, 'deliveryReadStates');
        await commitDeletes(params.db, refs);
        return refs;
      });
      if (deliveryReadStateRefs.status === 'failed') return cleanupFailure(deliveryReadStateRefs);

      const replyReadStateRefs = await runPhase('delete_reply_read_states', async () => {
        const refs = await listCollectionDocumentRefs(userRef, 'replyReadStates');
        await commitDeletes(params.db, refs);
        return refs;
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

async function listCollectionDocumentRefs(
  userRef: DocumentReference,
  collectionName: 'fcmTokens' | 'deliveryReadStates' | 'replyReadStates'
) {
  return userRef.collection(collectionName).listDocuments();
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
