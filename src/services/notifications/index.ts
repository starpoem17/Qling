import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { Messaging } from 'firebase-admin/messaging';

export type PushLogStatus =
  | 'sent'
  | 'failed'
  | 'skipped_no_token'
  | 'invalid_token_deleted'
  | 'skipped_deleted_user';

type PrdNotificationKind = 'new_worry' | 'new_reply' | 'reply_liked';
type SourceType = 'worry' | 'delivery' | 'reply' | 'feedback';

const INVALID_PUSH_TOKEN_ERROR_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

function summarizeToken(token: string) {
  return token.length <= 18
    ? token
    : `${token.slice(0, 12)}...${token.slice(-6)}`;
}

function errorCode(error: unknown): string | null {
  if (error instanceof Error && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isInvalidPushTokenError(error: unknown) {
  const code = errorCode(error);
  return code !== null && INVALID_PUSH_TOKEN_ERROR_CODES.has(code);
}

function readSummaryText(data: FirebaseFirestore.DocumentData | undefined): string | null {
  const summaryText = data?.summaryText;
  if (typeof summaryText !== 'string') return null;

  const trimmed = summaryText.trim();
  return trimmed ? trimmed : null;
}

function readSnapshotSummaryText(data: FirebaseFirestore.DocumentData | undefined, fieldName: 'worrySnapshot' | 'sourceWorrySnapshot'): string | null {
  const snapshot = data?.[fieldName];
  return snapshot && typeof snapshot === 'object'
    ? readSummaryText(snapshot as FirebaseFirestore.DocumentData)
    : null;
}

async function getWorrySummaryText(params: {
  db: Firestore;
  sourceId: string;
  sourceType: SourceType;
}): Promise<string | null> {
  let worryId: string | null = null;

  if (params.sourceType === 'worry') {
    worryId = params.sourceId;
  } else if (params.sourceType === 'delivery') {
    const delivery = await params.db.collection('deliveries').doc(params.sourceId).get();
    const data = delivery.data();
    const snapshotSummary = readSnapshotSummaryText(data, 'worrySnapshot');
    if (snapshotSummary) return snapshotSummary;
    worryId = typeof data?.worryId === 'string' ? data.worryId : null;
  } else if (params.sourceType === 'reply') {
    const reply = await params.db.collection('replies').doc(params.sourceId).get();
    const data = reply.data();
    const snapshotSummary = readSnapshotSummaryText(data, 'sourceWorrySnapshot');
    if (snapshotSummary) return snapshotSummary;
    worryId = typeof data?.worryId === 'string' ? data.worryId : null;
  } else if (params.sourceType === 'feedback') {
    const feedback = await params.db.collection('feedbacks').doc(params.sourceId).get();
    const feedbackData = feedback.data();
    const feedbackSnapshotSummary = readSnapshotSummaryText(feedbackData, 'sourceWorrySnapshot');
    if (feedbackSnapshotSummary) return feedbackSnapshotSummary;

    worryId = typeof feedbackData?.worryId === 'string' ? feedbackData.worryId : null;

    if (!worryId) {
      const replyId = typeof feedbackData?.replyId === 'string' ? feedbackData.replyId : params.sourceId;
      const reply = await params.db.collection('replies').doc(replyId).get();
      const replyData = reply.data();
      const snapshotSummary = readSnapshotSummaryText(replyData, 'sourceWorrySnapshot');
      if (snapshotSummary) return snapshotSummary;
      worryId = typeof replyData?.worryId === 'string' ? replyData.worryId : null;
    }
  }

  if (!worryId) return null;

  const worry = await params.db.collection('worries').doc(worryId).get();
  return readSummaryText(worry.data());
}

async function getNotificationBody(params: {
  db: Firestore;
  sourceId: string;
  sourceType: SourceType;
  fallbackBody: string;
}): Promise<string> {
  try {
    return await getWorrySummaryText(params) ?? params.fallbackBody;
  } catch {
    return params.fallbackBody;
  }
}

async function writePushLog(params: {
  db: Firestore;
  kind: PrdNotificationKind;
  targetUid: string;
  sourceId: string;
  sourceType: SourceType;
  sourceReason?: string;
  status: PushLogStatus;
  tokenDocId: string | null;
  tokenSummary: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}): Promise<string | null> {
  const ref = await params.db.collection('pushLogs').add({
    kind: params.kind,
    targetUid: params.targetUid,
    sourceId: params.sourceId,
    sourceType: params.sourceType,
    ...(params.sourceReason ? { sourceReason: params.sourceReason } : {}),
    status: params.status,
    tokenDocId: params.tokenDocId,
    tokenSummary: params.tokenSummary,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
    createdAt: FieldValue.serverTimestamp(),
  });
  return typeof ref?.id === 'string' ? ref.id : null;
}

async function sendPrdNotificationAfterCommit(params: {
  db: Firestore;
  messaging: Messaging | null;
  kind: PrdNotificationKind;
  targetUid: string;
  sourceId: string;
  sourceType: SourceType;
  sourceReason?: string;
  title: string;
  body: string;
}): Promise<{ status: PushLogStatus; logIds: string[]; warnings: string[] }> {
  const logIds: string[] = [];
  const warnings: string[] = [];
  const statuses: PushLogStatus[] = [];

  const writeLog = async (log: Omit<Parameters<typeof writePushLog>[0], 'db' | 'kind' | 'targetUid' | 'sourceId' | 'sourceType' | 'sourceReason'>) => {
    statuses.push(log.status);
    const id = await writePushLog({
      db: params.db,
      kind: params.kind,
      targetUid: params.targetUid,
      sourceId: params.sourceId,
      sourceType: params.sourceType,
      sourceReason: params.sourceReason,
      ...log,
    });
    if (id) logIds.push(id);
  };

  try {
    const userRef = params.db.collection('users').doc(params.targetUid);
    const userDoc = await userRef.get();
    if (userDoc.exists && userDoc.data()?.deleted === true) {
      await writeLog({
        status: 'skipped_deleted_user',
        tokenDocId: null,
        tokenSummary: null,
        errorCode: null,
        errorMessage: null,
      });
      return { status: 'skipped_deleted_user', logIds, warnings };
    }

    const tokenSnap = await userRef.collection('fcmTokens').get();
    if (tokenSnap.empty) {
      await writeLog({
        status: 'skipped_no_token',
        tokenDocId: null,
        tokenSummary: null,
        errorCode: null,
        errorMessage: null,
      });
      return { status: 'skipped_no_token', logIds, warnings };
    }

    for (const tokenDoc of tokenSnap.docs) {
      const token = typeof tokenDoc.data().token === 'string'
        ? tokenDoc.data().token
        : decodeURIComponent(tokenDoc.id);
      const tokenSummary = token ? summarizeToken(token) : null;

      if (!params.messaging) {
        warnings.push('messaging_unavailable');
        await writeLog({
          status: 'failed',
          tokenDocId: tokenDoc.id,
          tokenSummary,
          errorCode: 'messaging_unavailable',
          errorMessage: 'Firebase messaging is not initialized.',
        });
        continue;
      }

      try {
        await params.messaging.send({
          token,
          data: {
            title: params.title,
            body: params.body,
            url: '/',
            kind: params.kind,
            sourceId: params.sourceId,
            sourceType: params.sourceType,
            ...(params.sourceReason ? { sourceReason: params.sourceReason } : {}),
          },
          android: {
            priority: 'high',
          },
          webpush: {
            headers: { Urgency: 'high' },
          },
        });

        await writeLog({
          status: 'sent',
          tokenDocId: tokenDoc.id,
          tokenSummary,
          errorCode: null,
          errorMessage: null,
        });
      } catch (error) {
        if (isInvalidPushTokenError(error)) {
          await tokenDoc.ref.delete();
          await writeLog({
            status: 'invalid_token_deleted',
            tokenDocId: tokenDoc.id,
            tokenSummary,
            errorCode: errorCode(error),
            errorMessage: errorMessage(error),
          });
          continue;
        }

        warnings.push(`${params.kind}_push_failed`);
        await writeLog({
          status: 'failed',
          tokenDocId: tokenDoc.id,
          tokenSummary,
          errorCode: errorCode(error),
          errorMessage: errorMessage(error),
        });
      }
    }
  } catch (error) {
    warnings.push(`${params.kind}_push_logging_failed`);
    console.error('[Notifications] Push attempt failed after commit.', {
      kind: params.kind,
      targetUid: params.targetUid,
      sourceId: params.sourceId,
      error,
    });
  }

  return {
    status: statuses.includes('sent') ? 'sent' : (statuses[0] ?? 'failed'),
    logIds,
    warnings,
  };
}

export async function sendNewWorryNotificationAfterCommit(params: {
  db: Firestore;
  messaging: Messaging | null;
  targetUid: string;
  sourceId: string;
  sourceType: 'worry' | 'delivery';
  sourceReason?: 'pass_replacement';
}) {
  const body = await getNotificationBody({
    db: params.db,
    sourceId: params.sourceId,
    sourceType: params.sourceType,
    fallbackBody: '새로운 고민이 도착했습니다.',
  });

  return sendPrdNotificationAfterCommit({
    ...params,
    kind: 'new_worry',
    title: '새로운 고민이 도착했어요',
    body,
  });
}

export async function sendNewReplyNotificationAfterCommit(params: {
  db: Firestore;
  messaging: Messaging | null;
  targetUid: string;
  sourceId: string;
  sourceType?: 'reply';
}) {
  const sourceType = params.sourceType ?? 'reply';
  const body = await getNotificationBody({
    db: params.db,
    sourceId: params.sourceId,
    sourceType,
    fallbackBody: '보낸 고민에 답장이 도착했습니다.',
  });

  return sendPrdNotificationAfterCommit({
    ...params,
    kind: 'new_reply',
    sourceType,
    title: '내 고민에 답장이 도착했어요',
    body,
  });
}

export async function sendReplyLikedNotificationAfterCommit(params: {
  db: Firestore;
  messaging: Messaging | null;
  targetUid: string;
  sourceId: string;
  sourceType: 'reply' | 'feedback';
}) {
  const body = await getNotificationBody({
    db: params.db,
    sourceId: params.sourceId,
    sourceType: params.sourceType,
    fallbackBody: '내 답장이 위로가 되었다는 답신이 왔어요.',
  });

  return sendPrdNotificationAfterCommit({
    ...params,
    kind: 'reply_liked',
    title: '내 답변이 도움이 되었어요',
    body,
  });
}

export async function deleteAllPushTokensForUser(params: {
  db: Firestore;
  uid: string;
}): Promise<{ deletedCount: number }> {
  const tokenSnap = await params.db.collection('users').doc(params.uid).collection('fcmTokens').get();
  await Promise.all(tokenSnap.docs.map(tokenDoc => tokenDoc.ref.delete()));
  return { deletedCount: tokenSnap.docs.length };
}
