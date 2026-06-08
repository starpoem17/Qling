import {
  FieldValue,
  type Firestore,
  type Transaction,
} from 'firebase-admin/firestore';
import { normalizeWorryCategories } from '@midnight-radio/domain';
import { ACTIVE_DELIVERY_LIMIT, normalizeHumanCandidate } from '../matching/server/recipientPolicy';
import { buildWorryFeedSnapshot, type WorryFeedSnapshot } from '../homeWorryFeed/worrySnapshot';
import type {
  InitialWorryBackfillCandidate,
  InitialWorryBackfillRepository,
} from './initialWorryBackfill';
import {
  refillWorryInboxForUser,
  WORRY_INBOX_REFILL_TARGET_ACTIVE_COUNT,
} from './initialWorryBackfill';

const DEFAULT_HUMAN_DELIVERY_LIMIT = 15;

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function withoutId<T extends { id: string }>(model: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = model;
  return rest;
}

function hasOverlap(left: readonly string[], right: readonly string[]): boolean {
  const rightSet = new Set(right);
  return left.some(item => rightSet.has(item));
}

function isVisibleActiveWorry(data: FirebaseFirestore.DocumentData | undefined): boolean {
  return data?.status === 'active'
    && data?.isExample !== true
    && data?.hiddenAt === undefined
    && data?.deletedAt === undefined;
}

async function queryIsEmpty(
  transaction: Transaction,
  query: FirebaseFirestore.Query
): Promise<boolean> {
  const snap = await transaction.get(query);
  return snap.empty || snap.docs.length === 0;
}

function isVisibleRealActiveDelivery(data: FirebaseFirestore.DocumentData): boolean {
  return data.status === 'active'
    && data.isExample !== true
    && !data.answeredAt
    && !data.passedAt
    && !data.hiddenAt;
}

function activeDeliveryWorryId(data: FirebaseFirestore.DocumentData): string | null {
  return typeof data.worryId === 'string' && data.worryId.trim().length > 0
    ? data.worryId
    : null;
}

function candidateFromDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): InitialWorryBackfillCandidate | null {
  const data = doc.data();
  if (!isVisibleActiveWorry(data) || typeof data.authorUid !== 'string') return null;
  const matchingCategories = normalizeWorryCategories([
    ...stringArray(data.matchingCategories),
    ...stringArray(data.validCategories),
  ], { fallback: false });
  if (matchingCategories.length === 0) return null;
  return {
    id: doc.id,
    authorUid: data.authorUid,
    matchingCategories,
    createdAt: data.createdAt,
  };
}

export function createInitialWorryBackfillFirestoreRepository(params: {
  readonly db: Firestore;
}): InitialWorryBackfillRepository {
  const { db } = params;

  return {
    async fetchCandidateWorries({ limit }) {
      const snap = await db.collection('worries')
        .where('status', '==', 'active')
        .limit(Math.max(1, Math.min(limit, 500)))
        .get();
      return snap.docs
        .map(candidateFromDoc)
        .filter((candidate): candidate is InitialWorryBackfillCandidate => Boolean(candidate));
    },

    async commitInitialDeliveriesForNewUser({ uid, gender, interests, candidates, targetCount, targetActiveDeliveryCount, reason }) {
      return db.runTransaction(async transaction => {
        const now = FieldValue.serverTimestamp();
        const userRef = db.collection('users').doc(uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          return { status: 'completed' as const, createdCount: 0, deliveryIds: [], worryIds: [] };
        }

        const user = normalizeHumanCandidate({ uid, ...userDoc.data() });
        if (user.deleted === true || user.status === 'deleted' || user.inactive === true || user.disabled === true) {
          return { status: 'completed' as const, createdCount: 0, deliveryIds: [], worryIds: [] };
        }

        const activeDeliveriesQuery = db.collection('deliveries')
          .where('recipientUid', '==', uid)
          .where('status', '==', 'active');
        const activeDeliveriesSnap = await transaction.get(activeDeliveriesQuery);
        const actualActiveDeliveryCount = activeDeliveriesSnap.docs
          .filter(doc => isVisibleRealActiveDelivery(doc.data()))
          .length;
        const remainingUserCapacity = Math.max(0, ACTIVE_DELIVERY_LIMIT - actualActiveDeliveryCount);
        const targetActiveShortfall = typeof targetActiveDeliveryCount === 'number'
          ? Math.max(0, targetActiveDeliveryCount - actualActiveDeliveryCount)
          : targetCount;
        const maxCreateCount = Math.min(targetCount, remainingUserCapacity, targetActiveShortfall);
        if (maxCreateCount <= 0) {
          return { status: 'completed' as const, createdCount: 0, deliveryIds: [], worryIds: [] };
        }

        const selected: Array<{
          worryId: string;
          authorUid: string;
          matchingCategories: string[];
          deliveryId: string;
          batchId: string;
          slotIndex: number;
          worrySnapshot?: WorryFeedSnapshot;
        }> = [];

        for (const candidate of candidates) {
          if (selected.length >= maxCreateCount) break;
          if (candidate.authorUid === uid) continue;

          const worryRef = db.collection('worries').doc(candidate.id);
          const deliveryRef = db.collection('deliveries').doc(`${candidate.id}_${uid}`);
          const previousDeliveryQuery = db.collection('deliveries')
            .where('worryId', '==', candidate.id)
            .where('recipientUid', '==', uid)
            .limit(1);
          const previousReplyQuery = db.collection('replies')
            .where('worryId', '==', candidate.id)
            .where('replierUid', '==', uid)
            .limit(1);

          const [worryDoc, deliveryDoc] = await Promise.all([
            transaction.get(worryRef),
            transaction.get(deliveryRef),
          ]);
          if (!worryDoc.exists || deliveryDoc.exists) continue;
          if (!await queryIsEmpty(transaction, previousDeliveryQuery)) continue;
          if (!await queryIsEmpty(transaction, previousReplyQuery)) continue;

          const worry = worryDoc.data();
          if (!isVisibleActiveWorry(worry) || worry?.authorUid === uid || typeof worry?.authorUid !== 'string') continue;
          const matchingCategories = normalizeWorryCategories([
            ...stringArray(worry.matchingCategories),
            ...stringArray(worry.validCategories),
          ], { fallback: false });
          if (!hasOverlap(interests, matchingCategories)) continue;

          const humanDeliveryLimit = typeof worry.humanDeliveryLimit === 'number'
            ? Math.min(worry.humanDeliveryLimit, DEFAULT_HUMAN_DELIVERY_LIMIT)
            : DEFAULT_HUMAN_DELIVERY_LIMIT;
          const humanDeliveryCount = typeof worry.humanDeliveryCount === 'number' ? worry.humanDeliveryCount : 0;
          if (humanDeliveryCount >= humanDeliveryLimit) continue;
          const worrySnapshot = buildWorryFeedSnapshot(worry) ?? undefined;

          selected.push({
            worryId: candidate.id,
            authorUid: worry.authorUid,
            matchingCategories,
            deliveryId: `${candidate.id}_${uid}`,
            batchId: `${candidate.id}_welcome_${uid}`,
            slotIndex: selected.length,
            ...(worrySnapshot ? { worrySnapshot } : {}),
          });
        }

        for (const item of selected) {
          const batch = {
            id: item.batchId,
            worryId: item.worryId,
            batchRound: 0,
            createdAt: now,
            targetCount: 1,
            createdCount: 1,
            matchedCount: 1,
            randomCount: 0,
            reason,
            recipientUid: uid,
          };
          const delivery: { id: string; [key: string]: unknown } = {
            id: item.deliveryId,
            worryId: item.worryId,
            recipientUid: uid,
            authorUid: item.authorUid,
            status: 'active',
            answeredAt: null,
            passedAt: null,
            batchId: item.batchId,
            batchRound: 0,
            slotIndex: item.slotIndex,
            selectionType: 'matched',
            matchOverlapCount: item.matchingCategories.filter(category => new Set<string>(interests).has(category)).length,
            matchCategoriesSnapshot: item.matchingCategories,
            recipientInterestsSnapshot: [...interests],
            recipientGenderSnapshot: gender,
            recipientHelpedCountSnapshot: user.helpedCount,
            authorGenderSnapshot: '',
            isAiRecipient: false,
            createdByOnboardingBackfill: reason === 'new_user_onboarding',
            createdByInboxRefill: reason === 'inbox_refill',
            createdAt: now,
            updatedAt: now,
            answerableUntil: null,
          };
          if (item.worrySnapshot) {
            delivery.worrySnapshot = item.worrySnapshot;
          }

          transaction.set(db.collection('deliveryBatches').doc(item.batchId), withoutId(batch));
          transaction.set(db.collection('deliveries').doc(item.deliveryId), withoutId(delivery));
          transaction.update(db.collection('worries').doc(item.worryId), {
            humanDeliveryCount: FieldValue.increment(1),
            lastDeliveryCreatedAt: now,
            updatedAt: now,
          });
        }

        if (selected.length > 0) {
          transaction.set(userRef, {
            activeDeliveryCount: actualActiveDeliveryCount + selected.length,
            updatedAt: now,
          }, { merge: true });
        }

        return {
          status: 'completed' as const,
          createdCount: selected.length,
          deliveryIds: selected.map(item => item.deliveryId),
          worryIds: selected.map(item => item.worryId),
        };
      });
    },
  };
}

export async function refillWorryInboxForFirestoreUser(params: {
  readonly db: Firestore;
  readonly uid: string;
  readonly targetActiveDeliveryCount?: number;
}) {
  const userDoc = await params.db.collection('users').doc(params.uid).get();
  const user = userDoc.data();
  const gender = typeof user?.gender === 'string' ? user.gender : '';
  const interests = Array.isArray(user?.interests)
    ? normalizeWorryCategories(user.interests)
    : [];

  if (!userDoc.exists || !gender || interests.length === 0) {
    return {
      status: 'completed' as const,
      createdCount: 0,
      deliveryIds: [],
      worryIds: [],
    };
  }

  return refillWorryInboxForUser({
    uid: params.uid,
    gender,
    interests,
    repository: createInitialWorryBackfillFirestoreRepository({ db: params.db }),
    targetActiveDeliveryCount: params.targetActiveDeliveryCount ?? WORRY_INBOX_REFILL_TARGET_ACTIVE_COUNT,
  });
}

async function hideUnmatchedActiveDeliveriesForInterestUpdate(params: {
  readonly db: Firestore;
  readonly uid: string;
}): Promise<{
  readonly hiddenDeliveryCount: number;
  readonly hiddenDeliveryIds: readonly string[];
}> {
  return params.db.runTransaction(async transaction => {
    const now = FieldValue.serverTimestamp();
    const userRef = params.db.collection('users').doc(params.uid);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      return { hiddenDeliveryCount: 0, hiddenDeliveryIds: [] };
    }

    const userInterests = normalizeWorryCategories(stringArray(userDoc.data()?.interests), { fallback: false });
    if (userInterests.length === 0) {
      return { hiddenDeliveryCount: 0, hiddenDeliveryIds: [] };
    }

    const activeDeliveriesQuery = params.db.collection('deliveries')
      .where('recipientUid', '==', params.uid)
      .where('status', '==', 'active');
    const activeDeliveriesSnap = await transaction.get(activeDeliveriesQuery);
    const visibleRealDeliveries = activeDeliveriesSnap.docs
      .filter(doc => isVisibleRealActiveDelivery(doc.data()));

    const hiddenDeliveryDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    let remainingActiveDeliveryCount = 0;

    for (const deliveryDoc of visibleRealDeliveries) {
      const delivery = deliveryDoc.data();
      const worryId = activeDeliveryWorryId(delivery);
      if (!worryId) {
        hiddenDeliveryDocs.push(deliveryDoc);
        continue;
      }

      const worryDoc = await transaction.get(params.db.collection('worries').doc(worryId));
      const worry = worryDoc.data();
      const worryCategories = normalizeWorryCategories([
        ...stringArray(worry?.matchingCategories),
        ...stringArray(worry?.validCategories),
      ], { fallback: false });

      if (!worryDoc.exists || !isVisibleActiveWorry(worry) || !hasOverlap(userInterests, worryCategories)) {
        hiddenDeliveryDocs.push(deliveryDoc);
        continue;
      }

      remainingActiveDeliveryCount += 1;
    }

    for (const deliveryDoc of hiddenDeliveryDocs) {
      transaction.update(deliveryDoc.ref, {
        hiddenAt: now,
        hiddenReason: 'interest_update',
        hiddenBy: 'system',
        updatedAt: now,
      });
    }

    transaction.set(userRef, {
      activeDeliveryCount: remainingActiveDeliveryCount,
      updatedAt: now,
    }, { merge: true });

    return {
      hiddenDeliveryCount: hiddenDeliveryDocs.length,
      hiddenDeliveryIds: hiddenDeliveryDocs.map(doc => doc.id),
    };
  });
}

export async function refreshWorryInboxForInterestsUpdateForFirestoreUser(params: {
  readonly db: Firestore;
  readonly uid: string;
  readonly targetActiveDeliveryCount?: number;
}) {
  const hidden = await hideUnmatchedActiveDeliveriesForInterestUpdate({
    db: params.db,
    uid: params.uid,
  });
  const refill = await refillWorryInboxForFirestoreUser({
    db: params.db,
    uid: params.uid,
    targetActiveDeliveryCount: params.targetActiveDeliveryCount ?? WORRY_INBOX_REFILL_TARGET_ACTIVE_COUNT,
  });

  return {
    status: 'completed' as const,
    hiddenDeliveryCount: hidden.hiddenDeliveryCount,
    hiddenDeliveryIds: hidden.hiddenDeliveryIds,
    refillDeliveryCount: refill.createdCount,
    refillDeliveryIds: refill.deliveryIds,
  };
}
