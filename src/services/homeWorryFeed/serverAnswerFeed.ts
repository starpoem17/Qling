import type { Firestore } from 'firebase-admin/firestore';
import {
  selectActivePrdAnswerFeedItems,
  type DeliveryReadStateDoc,
  type PrdDeliveryDoc,
  type PrdWorryDoc,
} from './prdPolicy';
import type { PrdAnswerFeedItem } from './types';

export async function getPrdAnswerFeed(params: {
  db: Firestore;
  uid: string;
}): Promise<PrdAnswerFeedItem[]> {
  const deliveriesSnap = await params.db.collection('deliveries')
    .where('recipientUid', '==', params.uid)
    .where('status', '==', 'active')
    .get();

  const deliveries = deliveriesSnap.docs.map(deliveryDoc => ({
    id: deliveryDoc.id,
    ...deliveryDoc.data(),
  } as PrdDeliveryDoc)).filter(delivery => (
    delivery.status === 'active'
    && !delivery.answeredAt
    && !delivery.passedAt
    && !delivery.hiddenAt
  ));

  const worryIds = [...new Set(deliveries.map(delivery => delivery.worryId).filter(Boolean))] as string[];
  const [worryDocs, readStatesSnap] = await Promise.all([
    Promise.all(worryIds.map(async worryId => {
      const worrySnap = await params.db.collection('worries').doc(worryId).get();
      return worrySnap.exists
        ? { id: worrySnap.id, ...worrySnap.data() } as PrdWorryDoc
        : null;
    })),
    params.db.collection('users').doc(params.uid).collection('deliveryReadStates').get(),
  ]);

  const worriesById = new Map(
    worryDocs
      .filter((worry): worry is PrdWorryDoc => worry !== null)
      .map(worry => [worry.id, worry])
  );
  const readStatesByDeliveryId = new Map(
    readStatesSnap.docs.map(readStateDoc => [
      readStateDoc.id,
      {
        deliveryId: readStateDoc.id,
        ...readStateDoc.data(),
      } as DeliveryReadStateDoc,
    ])
  );

  return selectActivePrdAnswerFeedItems({
    deliveries,
    worriesById,
    readStatesByDeliveryId,
    profileUid: params.uid,
  });
}
