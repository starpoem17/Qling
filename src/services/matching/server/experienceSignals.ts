import type { Firestore } from 'firebase-admin/firestore';
import type { ConcernAnalysis } from './concernAnalysis';
import type {
  ExperienceAnswerStyleTag,
  ExperienceSituationTag,
  ExperienceTopicTag,
} from './ontology';
import {
  normalizeDesiredResponseTags,
  normalizeSituationTags,
  normalizeTopicTags,
} from './ontology';

export type ExperienceSignalSource = 'reply_created' | 'like_received' | 'moderation_fail';

export interface ExperienceSignalWriteModel {
  id: string;
  uid: string;
  source: ExperienceSignalSource;
  weight: number;
  topicTags: ExperienceTopicTag[];
  situationTags: ExperienceSituationTag[];
  answerStyleTags: ExperienceAnswerStyleTag[];
  safetyPenaltyDelta: number;
  replyId?: string;
  worryId?: string;
  deliveryId?: string;
  feedbackId?: string;
  moderationLogId?: string;
  createdAt: unknown;
  signalDate: unknown;
}

export function buildConcernExperienceSignal(params: {
  id: string;
  uid: string;
  source: 'reply_created' | 'like_received';
  concern: Partial<ConcernAnalysis> | undefined;
  weight: number;
  replyId?: string;
  worryId?: string;
  deliveryId?: string;
  feedbackId?: string;
  now: unknown;
}): ExperienceSignalWriteModel {
  return withoutUndefined({
    id: params.id,
    uid: params.uid,
    source: params.source,
    weight: params.weight,
    topicTags: normalizeTopicTags(params.concern?.topicTags),
    situationTags: normalizeSituationTags(params.concern?.situationTags),
    answerStyleTags: normalizeDesiredResponseTags(params.concern?.desiredResponse),
    safetyPenaltyDelta: 0,
    replyId: params.replyId,
    worryId: params.worryId,
    deliveryId: params.deliveryId,
    feedbackId: params.feedbackId,
    createdAt: params.now,
    signalDate: params.now,
  });
}

export function buildModerationFailExperienceSignal(params: {
  id: string;
  uid: string;
  moderationLogId: string;
  deliveryId?: string;
  now: unknown;
}): ExperienceSignalWriteModel {
  return withoutUndefined({
    id: params.id,
    uid: params.uid,
    source: 'moderation_fail' as const,
    weight: 0,
    topicTags: [],
    situationTags: [],
    answerStyleTags: [],
    safetyPenaltyDelta: 1,
    moderationLogId: params.moderationLogId,
    deliveryId: params.deliveryId,
    createdAt: params.now,
    signalDate: params.now,
  });
}

export function enqueueExperienceSignal(params: {
  db: Firestore;
  transaction: FirebaseFirestore.Transaction;
  signal: ExperienceSignalWriteModel;
}): void {
  params.transaction.set(
    params.db.collection('experienceSignals').doc(params.signal.id),
    withoutId(params.signal)
  );
}

export function createExperienceSignalId(params: {
  uid: string;
  source: ExperienceSignalSource;
  dedupeKey: string;
}): string {
  return `${params.uid}_${params.source}_${params.dedupeKey}`;
}

function withoutId<T extends { id: string }>(value: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = value;
  return rest;
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}
