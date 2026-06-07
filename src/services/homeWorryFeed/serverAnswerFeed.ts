import type { Firestore } from 'firebase-admin/firestore';
import {
  selectActivePrdAnswerFeedItems,
  type DeliveryReadStateDoc,
  type PrdDeliveryDoc,
  type PrdWorryDoc,
} from './prdPolicy';
import type { PrdAnswerFeedItem } from './types';
import { worryDocFromFeedSnapshot } from './worrySnapshot';

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

  const snapshotWorries: PrdWorryDoc[] = deliveries.flatMap(delivery => {
    const worry = worryDocFromFeedSnapshot({
      worryId: delivery.worryId,
      snapshot: delivery.worrySnapshot,
    });
    return worry ? [worry] : [];
  });
  const snapshotWorryIds = new Set(snapshotWorries.map(worry => worry.id));
  const legacyWorryIds = [...new Set(deliveries
    .map(delivery => delivery.worryId)
    .filter((worryId): worryId is string => typeof worryId === 'string' && !snapshotWorryIds.has(worryId)))];
  const activeDeliveryIds = deliveries.map(delivery => delivery.id);
  const readStateRefs = activeDeliveryIds.map(deliveryId => (
    params.db.collection('users').doc(params.uid).collection('deliveryReadStates').doc(deliveryId)
  ));
  const [worryDocs, readStateDocs] = await Promise.all([
    Promise.all(legacyWorryIds.map(async worryId => {
      const worrySnap = await params.db.collection('worries').doc(worryId).get();
      return worrySnap.exists
        ? { id: worrySnap.id, ...worrySnap.data() } as PrdWorryDoc
        : null;
    })),
    Promise.all(readStateRefs.map(readStateRef => readStateRef.get())),
  ]);

  const worriesById = new Map(
    [...snapshotWorries, ...worryDocs]
      .filter((worry): worry is PrdWorryDoc => worry !== null)
      .map(worry => [worry.id, worry])
  );
  const readStatesByDeliveryId = new Map(
    readStateDocs.filter(readStateDoc => readStateDoc.exists).map(readStateDoc => [
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
