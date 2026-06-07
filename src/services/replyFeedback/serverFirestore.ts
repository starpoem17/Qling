import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { ReplyFeedbackRepository } from './serverFeedback';
import type { ReplyFeedbackDoc, ReplyFeedbackType } from './types';
import type { ConcernAnalysis } from '../matching/server/concernAnalysis';
import {
  buildConcernExperienceSignal,
  createExperienceSignalId,
  enqueueExperienceSignal,
} from '../matching/server/experienceSignals';
import {
  applyConcernExperienceSignal,
  promoteExperienceProfileStatus,
} from '../matching/server/profileSignals';
import { enqueueExperienceProfileSummaryJob } from '../matching/server/profileSummaryJobs';
import { resolveProfileSummaryJobReason } from '../matching/server/profileSummaryPolicy';

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function buildError(code: string) {
  return new Error(code);
}

function dataOrThrow(snapshot: FirebaseFirestore.DocumentSnapshot, code: string) {
  const data = snapshot.data();
  if (!snapshot.exists || !data) throw buildError(code);
  return data;
}

export function createReplyFeedbackRepository(params: { db: Firestore }): ReplyFeedbackRepository {
  const { db } = params;

  return {
    createModerationLogId() {
      return db.collection('moderationLogs').doc().id;
    },

    async saveRejectedCommentModeration(input) {
      await db.collection('moderationLogs')
        .doc(input.moderationLogId)
        .set(withoutUndefined(input.moderationLog));
      return { moderationLogId: input.moderationLogId };
    },

    async saveFeedback(input) {
      return db.runTransaction(async transaction => {
        const replyRef = db.collection('replies').doc(input.replyId);
        const feedbackRef = db.collection('feedbacks').doc(input.replyId);
        const replyDoc = await transaction.get(replyRef);
        const reply = dataOrThrow(replyDoc, 'reply_missing');

        const worryId = typeof reply.worryId === 'string' ? reply.worryId : null;
        const deliveryId = typeof reply.deliveryId === 'string' ? reply.deliveryId : null;
        const replierUid = typeof reply.replierUid === 'string' && reply.replierUid.trim()
          ? reply.replierUid
          : null;

        if (!worryId || !deliveryId || !replierUid) throw buildError('invalid_reply');
        if (reply.status === 'hidden' || reply.hiddenAt) throw buildError('invalid_reply');

        const worryRef = db.collection('worries').doc(worryId);
        const worryDoc = await transaction.get(worryRef);
        const worry = dataOrThrow(worryDoc, 'worry_missing');
        if (worry.status === 'hidden' || worry.hiddenAt) throw buildError('invalid_reply');

        if (worry.authorUid !== input.publisherUid) throw buildError('not_worry_publisher');
        if (reply.authorUid !== input.publisherUid) throw buildError('reply_worry_mismatch');
        if (input.publisherUid === replierUid) throw buildError('publisher_reply_forbidden');

        const feedbackDoc = await transaction.get(feedbackRef);
        const userRef = db.collection('users').doc(replierUid);
        const userDoc = await transaction.get(userRef);
        let existingFeedback: ReplyFeedbackDoc | null = null;
        if (feedbackDoc.exists) {
          existingFeedback = feedbackDoc.data() as ReplyFeedbackDoc;
          const result = resolveExistingFeedback(existingFeedback, input.type, input.comment);
          if (result === 'conflict') throw buildError('feedback_conflict');
          if (result === 'unchanged') {
            return {
              feedbackId: input.replyId,
              helpedCountApplied: existingFeedback.helpedCountApplied === true,
              replyLikedPush: null,
            };
          }
        }

        const timestamp = FieldValue.serverTimestamp();
        if (input.moderationLog) {
          transaction.set(
            db.collection('moderationLogs').doc(input.commentModerationLogId as string),
            withoutUndefined(input.moderationLog)
          );
        }

        if (feedbackDoc.exists) {
          transaction.update(feedbackRef, {
            comment: input.comment,
            commentVisibility: visibilityFor(input.type, input.comment),
            commentModerationLogId: input.commentModerationLogId,
            updatedAt: timestamp,
          });
          return {
            feedbackId: input.replyId,
            helpedCountApplied: existingFeedback?.helpedCountApplied === true,
            replyLikedPush: null,
          };
        }

        const helpedCountApplied = input.type === 'like' && isHelpedCountEligible(reply);
        const feedback: ReplyFeedbackDoc = {
          replyId: input.replyId,
          worryId,
          deliveryId,
          publisherUid: input.publisherUid,
          replierUid,
          type: input.type,
          comment: input.comment,
          commentVisibility: visibilityFor(input.type, input.comment),
          commentModerationLogId: input.commentModerationLogId,
          ...(reply.sourceWorrySnapshot ? { sourceWorrySnapshot: reply.sourceWorrySnapshot } : {}),
          helpedCountApplied,
          isForAiReply: reply.isAiGenerated === true,
          isForExampleReply: reply.isExampleReply === true,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        transaction.set(feedbackRef, feedback);
        if (input.type === 'like') {
          transaction.update(replyRef, {
            feedbackType: 'like',
            likedAt: timestamp,
            updatedAt: timestamp,
          });
        } else {
          transaction.update(replyRef, {
            publisherVisible: false,
            updatedAt: timestamp,
          });
        }

        if (helpedCountApplied) {
          const user = userDoc.data();
          const currentHelpedCount = typeof user?.helpedCount === 'number' ? user.helpedCount : 0;
          const nextHelpedCount = currentHelpedCount + 1;
          const nextProfile = applyConcernExperienceSignal({
            currentProfile: user?.experienceProfile,
            concern: worry.llmAnalysis as Partial<ConcernAnalysis> | undefined,
            weight: 2,
            positiveSignal: 'like_received',
          });
          const summaryReason = resolveProfileSummaryJobReason({
            profile: nextProfile,
            helpedCount: nextHelpedCount,
            now: new Date(),
          });
          transaction.set(userRef, {
            helpedCount: FieldValue.increment(1),
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
                source: 'like_received',
                dedupeKey: input.replyId,
              }),
              uid: replierUid,
              source: 'like_received',
              concern: worry.llmAnalysis as Partial<ConcernAnalysis> | undefined,
              weight: 2,
              replyId: input.replyId,
              worryId,
              deliveryId,
              feedbackId: input.replyId,
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

        return {
          feedbackId: input.replyId,
          helpedCountApplied,
          replyLikedPush: input.type === 'like'
            ? {
              feedbackId: input.replyId,
              replyId: input.replyId,
              replierUid,
            }
            : null,
        };
      });
    },
  };
}

function visibilityFor(type: ReplyFeedbackType, comment: string | null) {
  if (!comment) return 'none';
  return type === 'like' ? 'replier' : 'admin_only';
}

function isHelpedCountEligible(reply: FirebaseFirestore.DocumentData) {
  return reply.isAiGenerated === false
    && typeof reply.isExampleReply === 'boolean'
    && typeof reply.replierUid === 'string'
    && reply.replierUid.trim().length > 0;
}

function resolveExistingFeedback(
  existing: ReplyFeedbackDoc,
  type: ReplyFeedbackType,
  comment: string | null
): 'unchanged' | 'update_like_comment' | 'conflict' {
  if (existing.type !== type) return 'conflict';

  if (type === 'dislike') {
    if (existing.comment === null && comment === null) return 'unchanged';
    if (existing.comment === null && comment !== null) return 'update_like_comment';
    if (existing.comment !== null && comment === null) return 'unchanged';
    if (existing.comment === comment) return 'unchanged';
    return 'conflict';
  }

  if (existing.comment === null && comment === null) return 'unchanged';
  if (existing.comment === null && comment !== null) return 'update_like_comment';
  if (existing.comment !== null && comment === null) return 'unchanged';
  if (existing.comment === comment) return 'unchanged';
  return 'conflict';
}
