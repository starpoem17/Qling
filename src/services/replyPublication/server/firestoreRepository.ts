import {
  FieldValue,
  type Firestore,
} from 'firebase-admin/firestore';
import type {
  ReplyModerationLogWriteModel,
  ReplyPublicationRepository,
  ReplyWriteModel,
} from './types';
import { buildExampleFeedbackJob } from '../../exampleWorries';
import type { ConcernAnalysis } from '../../matching/server/concernAnalysis';
import {
  buildConcernExperienceSignal,
  buildModerationFailExperienceSignal,
  createExperienceSignalId,
  enqueueExperienceSignal,
} from '../../matching/server/experienceSignals';
import {
  applyConcernExperienceSignal,
  applyExperienceSafetyPenalty,
  promoteExperienceProfileStatus,
} from '../../matching/server/profileSignals';
import {
  buildExperienceProfileSummaryJob,
  enqueueExperienceProfileSummaryJob,
} from '../../matching/server/profileSummaryJobs';
import { resolveProfileSummaryJobReason } from '../../matching/server/profileSummaryPolicy';
import { buildWorryFeedSnapshot } from '../../homeWorryFeed/worrySnapshot';

function withoutId<T extends { id: string }>(model: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = model;
  return rest;
}

function buildError(code: string) {
  return new Error(code);
}

function snapshotData(snapshot: FirebaseFirestore.DocumentSnapshot): FirebaseFirestore.DocumentData {
  const data = snapshot.data();
  if (!data) throw buildError('missing_snapshot_data');
  return data;
}

export function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

export function createReplyPublicationRepository(params: {
  db: Firestore;
}): ReplyPublicationRepository {
  const { db } = params;

  return {
    createIds() {
      return {
        moderationLogId: db.collection('moderationLogs').doc().id,
      };
    },

    async commitRejectedReplyModeration({ moderationLog }) {
      const deliveryDoc = await db.collection('deliveries').doc(moderationLog.targetId).get();
      const delivery = deliveryDoc.data();
      const log = {
        ...moderationLog,
        targetType: delivery?.isExample === true ? 'example_reply' as const : moderationLog.targetType,
      };
      await db.collection('moderationLogs').doc(moderationLog.id).set(withoutId(log));
      if (log.targetType === 'reply') {
        const userDoc = await db.collection('users').doc(moderationLog.uid).get();
        const user = userDoc.data();
        const timestamp = serverTimestamp();
        const nextProfile = applyExperienceSafetyPenalty({
          currentProfile: user?.experienceProfile,
          amount: 1,
        });
        await db.collection('users').doc(moderationLog.uid).set({
          profileStatus: promoteExperienceProfileStatus(user?.profileStatus),
          experienceProfile: nextProfile,
          experienceProfileDecayPending: true,
          experienceProfileLastSignalAt: timestamp,
          updatedAt: timestamp,
        }, { merge: true });
        const signalId = createExperienceSignalId({
          uid: moderationLog.uid,
          source: 'moderation_fail',
          dedupeKey: moderationLog.id,
        });
        await db.collection('experienceSignals').doc(signalId).set(withoutId(buildModerationFailExperienceSignal({
          id: signalId,
          uid: moderationLog.uid,
          moderationLogId: moderationLog.id,
          deliveryId: moderationLog.targetId,
          now: timestamp,
        })));
        const jobRef = db.collection('experienceProfileSummaryJobs').doc();
        await jobRef.set(withoutId(buildExperienceProfileSummaryJob({
          id: jobRef.id,
          uid: moderationLog.uid,
          reason: 'moderation_event',
          now: timestamp,
        })));
      }
      return { moderationLogId: moderationLog.id };
    },

    async commitApprovedReplyPublication({ deliveryId, replierUid, content, moderationLog }) {
      return db.runTransaction(async transaction => {
        const deliveryRef = db.collection('deliveries').doc(deliveryId);
        const replyRef = db.collection('replies').doc(deliveryId);
        const deliveryDoc = await transaction.get(deliveryRef);
        const replyDoc = await transaction.get(replyRef);

        if (!deliveryDoc.exists) {
          throw buildError('delivery_missing');
        }

        const delivery = snapshotData(deliveryDoc);
        if (delivery.recipientUid !== replierUid) {
          throw buildError('not_delivery_recipient');
        }

        const worryId = typeof delivery.worryId === 'string' ? delivery.worryId : null;
        const authorUid = typeof delivery.authorUid === 'string' ? delivery.authorUid : null;
        if (!worryId || !authorUid) {
          throw buildError('delivery_missing');
        }

        const worryRef = db.collection('worries').doc(worryId);
        const worryDoc = await transaction.get(worryRef);
        const userRef = db.collection('users').doc(replierUid);
        const userDoc = await transaction.get(userRef);

        if (!worryDoc.exists) {
          throw buildError('worry_missing');
        }
        const worry = snapshotData(worryDoc);
        if (worry.status === 'hidden' || worry.hiddenAt) {
          throw buildError('worry_hidden');
        }

        if (replyDoc.exists) {
          const reply = snapshotData(replyDoc) as ReplyWriteModel;
          if (
            reply.deliveryId === deliveryId
            && reply.replierUid === replierUid
            && reply.content === content
          ) {
            return { status: 'idempotent' as const, replyId: deliveryId, reply };
          }

          throw buildError('duplicate_reply');
        }

        if (delivery.status === 'hidden' || delivery.hiddenAt) {
          throw buildError('delivery_hidden');
        }

        if (delivery.status !== 'active' || delivery.answeredAt) {
          throw buildError('delivery_not_active');
        }

        const timestamp = serverTimestamp();
        const isExampleReply = delivery.isExample === true || worry.isExample === true;
        const sourceWorrySnapshot = buildWorryFeedSnapshot(worry) ?? undefined;
        const reply: ReplyWriteModel = {
          id: deliveryId,
          deliveryId,
          worryId,
          authorUid,
          replierUid,
          content,
          status: 'active',
          publisherVisible: true,
          ...(sourceWorrySnapshot ? { sourceWorrySnapshot } : {}),
          moderationLogId: moderationLog.id,
          createdAt: timestamp,
          updatedAt: timestamp,
          isAiGenerated: false,
          isExampleReply,
        };

        transaction.set(db.collection('moderationLogs').doc(moderationLog.id), withoutId({
          ...moderationLog,
          targetType: isExampleReply ? 'example_reply' : moderationLog.targetType,
        }));
        transaction.set(replyRef, withoutId(reply));
        transaction.update(deliveryRef, {
          status: 'answered',
          answeredAt: timestamp,
          updatedAt: timestamp,
        });
        if (isExampleReply) {
          const job = buildExampleFeedbackJob({
            replyId: deliveryId,
            targetUid: replierUid,
            submittedAt: new Date(),
            now: timestamp,
          });
          transaction.set(db.collection('exampleFeedbackJobs').doc(job.id), withoutId(job), { merge: true });
        } else {
          transaction.update(worryRef, {
            humanReplyCount: FieldValue.increment(1),
            hasHumanReply: true,
            lastHumanReplyAt: timestamp,
            updatedAt: timestamp,
          });

          const activeDeliveryCount = typeof userDoc.data()?.activeDeliveryCount === 'number'
            ? userDoc.data()?.activeDeliveryCount
            : 0;
          const user = userDoc.data();
          const concern = worry.llmAnalysis as Partial<ConcernAnalysis> | undefined;
          const nextProfile = applyConcernExperienceSignal({
            currentProfile: user?.experienceProfile,
            concern,
            weight: 0.5,
            positiveSignal: 'reply_created',
          });
          const summaryReason = resolveProfileSummaryJobReason({
            profile: nextProfile,
            helpedCount: typeof user?.helpedCount === 'number' ? user.helpedCount : 0,
            now: new Date(),
          });
          transaction.set(userRef, {
            activeDeliveryCount: Math.max(0, activeDeliveryCount - 1),
            profileStatus: promoteExperienceProfileStatus(user?.profileStatus),
            experienceProfile: summaryReason ? { ...nextProfile, profileSummaryPendingReason: summaryReason } : nextProfile,
            experienceProfileDecayPending: true,
            experienceProfileLastSignalAt: timestamp,
          }, { merge: true });
          enqueueExperienceSignal({
            db,
            transaction,
            signal: buildConcernExperienceSignal({
              id: createExperienceSignalId({
                uid: replierUid,
                source: 'reply_created',
                dedupeKey: deliveryId,
              }),
              uid: replierUid,
              source: 'reply_created',
              concern,
              weight: 0.5,
              replyId: deliveryId,
              worryId,
              deliveryId,
              now: timestamp,
            }),
          });
          if (summaryReason) {
            enqueueExperienceProfileSummaryJob({
              db,
              transaction,
              uid: replierUid,
              reason: summaryReason,
              now: timestamp,
            });
          }
        }

        return { status: 'created' as const, replyId: deliveryId, reply };
      });
    },
  };
}
