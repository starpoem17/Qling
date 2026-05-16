import { FieldValue, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import type { UserAccountClock, UserAccountRepository } from './types';

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
      const userRef = params.db.collection('users').doc(input.uid);
      const userDoc = await userRef.get();
      const normalizedNickname = userDoc.exists && typeof userDoc.data()?.normalizedNickname === 'string'
        ? userDoc.data()?.normalizedNickname as string
        : null;

      const [tokenRefs, deliveryReadStateRefs, replyReadStateRefs] = await Promise.all([
        listCollectionDocumentRefs(userRef, 'fcmTokens'),
        listCollectionDocumentRefs(userRef, 'deliveryReadStates'),
        listCollectionDocumentRefs(userRef, 'replyReadStates'),
      ]);
      const reservationRef = normalizedNickname
        ? params.db.collection('nicknameReservations').doc(normalizedNickname)
        : null;

      const refsToDelete = [
        ...tokenRefs,
        ...deliveryReadStateRefs,
        ...replyReadStateRefs,
        ...(reservationRef ? [reservationRef] : []),
        userRef,
      ];

      await commitDeletes(params.db, refsToDelete);

      return {
        deletedTokenCount: tokenRefs.length,
        deletedReadStateCount: deliveryReadStateRefs.length + replyReadStateRefs.length,
        deletedNicknameReservation: Boolean(reservationRef),
      };
    },
  };
}

async function listCollectionDocumentRefs(
  userRef: DocumentReference,
  collectionName: 'fcmTokens' | 'deliveryReadStates' | 'replyReadStates'
) {
  return userRef.collection(collectionName).listDocuments();
}

async function commitDeletes(db: Firestore, refs: DocumentReference[]) {
  for (let index = 0; index < refs.length; index += 450) {
    const batch = db.batch();
    for (const ref of refs.slice(index, index + 450)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}
