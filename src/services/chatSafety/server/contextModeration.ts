import { FieldValue, type Firestore } from 'firebase-admin/firestore';

export const CHAT_CONTEXT_MODERATION_MESSAGE_INTERVAL = 10;
const CHAT_CONTEXT_MODERATION_MESSAGE_LIMIT = 30;
const CHAT_CONTEXT_MODERATION_MAX_ATTEMPTS = 3;

export type ChatContextModerationStatus = 'safe' | 'warn' | 'block';

export type ChatContextModerationProvider = (transcript: string) => Promise<unknown>;

export type ChatContextModerationResult =
  | { status: 'safe'; reason: string }
  | { status: 'warn'; reason: string }
  | { status: 'block'; reason: string };

export interface ChatContextModerationJobResult {
  jobId: string;
  chatId: string;
  status: 'completed' | 'failed' | 'queued' | 'skipped';
  reason?: string;
}

export interface RunChatContextModerationJobsResult {
  status: 'completed';
  checkedCount: number;
  completedCount: number;
  failedCount: number;
  requeuedCount: number;
  skippedCount: number;
  results: ChatContextModerationJobResult[];
}

export function shouldRunChatContextModeration(params: {
  readonly messageCount: number;
  readonly lastModeratedMessageCount?: unknown;
}): boolean {
  const lastModerated = typeof params.lastModeratedMessageCount === 'number'
    ? params.lastModeratedMessageCount
    : 0;
  return params.messageCount > 0
    && params.messageCount % CHAT_CONTEXT_MODERATION_MESSAGE_INTERVAL === 0
    && lastModerated < params.messageCount;
}

export function buildChatContextModerationInstruction(): string {
  return `You are a safety reviewer for a Korean anonymous 1:1 worry-sharing chat.
Review the whole conversation context, not isolated keywords.

Return JSON only with this exact shape:
{ "status": "safe" | "warn" | "block", "reason": "short Korean reason" }

Decision policy:
- Use "safe" for normal advice, empathy, food preferences, app/tool recommendations, and harmless casual talk.
- Do NOT block homographs or benign words by themselves. For example, "고소한 맛" means savory/nutty taste and is safe.
- Do NOT block a single app/service recommendation by itself, such as "메이튜 쓰세요" or "다오홍슈", unless the conversation is clearly spam, scam, repeated promotion, or external-contact grooming.
- Use "warn" when the conversation is concerning but not clearly unsafe.
- Use "block" only when the conversation is clearly moving into abuse, threats, hate, sexual coercion, personal contact exchange, external platform grooming, self-harm encouragement, crime/violence, scam, or strongly reinforces dangerous/negative thinking.
- Never include markdown or extra keys.`;
}

export function buildChatContextTranscript(messages: ReadonlyArray<{
  readonly senderUid: string;
  readonly content: string;
}>): string {
  return messages
    .map((message, index) => `${index + 1}. ${message.senderUid}: ${message.content}`)
    .join('\n');
}

export function enqueueChatContextModerationJob(params: {
  readonly db: Firestore;
  readonly transaction: FirebaseFirestore.Transaction;
  readonly chatId: string;
  readonly messageCount: number;
  readonly now: unknown;
}): string {
  const jobId = `${params.chatId}_${params.messageCount}`;
  const jobRef = params.db.collection('chatContextModerationJobs').doc(jobId);
  params.transaction.set(jobRef, {
    chatId: params.chatId,
    messageCount: params.messageCount,
    status: 'queued',
    attempts: 0,
    lastError: null,
    createdAt: params.now,
    updatedAt: params.now,
  }, { merge: true });
  return jobId;
}

export async function runChatContextModerationJobs(params: {
  readonly db: Firestore;
  readonly provider: ChatContextModerationProvider;
  readonly limit?: number;
}): Promise<RunChatContextModerationJobsResult> {
  const limit = Math.max(1, Math.min(params.limit ?? 20, 50));
  const snap = await params.db.collection('chatContextModerationJobs')
    .where('status', '==', 'queued')
    .limit(limit)
    .get();

  const results: ChatContextModerationJobResult[] = [];
  for (const doc of snap.docs) {
    results.push(await processChatContextModerationJob({
      db: params.db,
      provider: params.provider,
      jobId: doc.id,
    }));
  }

  return {
    status: 'completed',
    checkedCount: results.length,
    completedCount: results.filter(result => result.status === 'completed').length,
    failedCount: results.filter(result => result.status === 'failed').length,
    requeuedCount: results.filter(result => result.status === 'queued').length,
    skippedCount: results.filter(result => result.status === 'skipped').length,
    results,
  };
}

async function processChatContextModerationJob(params: {
  readonly db: Firestore;
  readonly provider: ChatContextModerationProvider;
  readonly jobId: string;
}): Promise<ChatContextModerationJobResult> {
  const claimed = await claimChatContextModerationJob(params);
  if (claimed.status !== 'claimed') return claimed.result;

  try {
    await runChatContextModeration({
      db: params.db,
      provider: params.provider,
      chatId: claimed.chatId,
      messageCount: claimed.messageCount,
    });
    await params.db.collection('chatContextModerationJobs').doc(params.jobId).set({
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastError: null,
    }, { merge: true });
    return {
      jobId: params.jobId,
      chatId: claimed.chatId,
      status: 'completed',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const nextStatus = claimed.nextAttemptCount >= CHAT_CONTEXT_MODERATION_MAX_ATTEMPTS ? 'failed' : 'queued';
    await params.db.collection('chatContextModerationJobs').doc(params.jobId).set({
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
      lastError: message,
    }, { merge: true });
    return {
      jobId: params.jobId,
      chatId: claimed.chatId,
      status: nextStatus,
      reason: message,
    };
  }
}

async function claimChatContextModerationJob(params: {
  readonly db: Firestore;
  readonly jobId: string;
}): Promise<
  | { status: 'claimed'; chatId: string; messageCount: number; nextAttemptCount: number }
  | { status: 'not_claimed'; result: ChatContextModerationJobResult }
> {
  return params.db.runTransaction(async transaction => {
    const jobRef = params.db.collection('chatContextModerationJobs').doc(params.jobId);
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      return {
        status: 'not_claimed' as const,
        result: { jobId: params.jobId, chatId: '', status: 'skipped' as const, reason: 'job_missing' },
      };
    }

    const job = jobDoc.data() ?? {};
    const chatId = typeof job.chatId === 'string' ? job.chatId : '';
    const messageCount = typeof job.messageCount === 'number' ? job.messageCount : 0;
    if (job.status !== 'queued' || !chatId || messageCount <= 0) {
      return {
        status: 'not_claimed' as const,
        result: { jobId: params.jobId, chatId, status: 'skipped' as const, reason: 'job_not_queued' },
      };
    }

    const attempts = typeof job.attempts === 'number' ? job.attempts : 0;
    const nextAttemptCount = attempts + 1;
    transaction.set(jobRef, {
      status: 'processing',
      attempts: nextAttemptCount,
      updatedAt: FieldValue.serverTimestamp(),
      lastError: null,
    }, { merge: true });

    return {
      status: 'claimed' as const,
      chatId,
      messageCount,
      nextAttemptCount,
    };
  });
}

export function normalizeChatContextModeration(raw: unknown): ChatContextModerationResult | { status: 'invalid' } {
  if (!raw || typeof raw !== 'object') return { status: 'invalid' };
  const result = raw as { status?: unknown; reason?: unknown };
  if (result.status !== 'safe' && result.status !== 'warn' && result.status !== 'block') {
    return { status: 'invalid' };
  }
  return {
    status: result.status,
    reason: typeof result.reason === 'string' && result.reason.trim()
      ? result.reason.trim()
      : defaultReasonForStatus(result.status),
  };
}

export async function runChatContextModeration(params: {
  readonly db: Firestore;
  readonly chatId: string;
  readonly messageCount: number;
  readonly provider: ChatContextModerationProvider;
}): Promise<void> {
  const chatRef = params.db.collection('chats').doc(params.chatId);
  const chatDoc = await chatRef.get();
  if (!chatDoc.exists) return;

  const chatData = chatDoc.data() ?? {};
  if (chatData.status !== 'active') return;
  if (!shouldRunChatContextModeration({
    messageCount: params.messageCount,
    lastModeratedMessageCount: chatData.lastContextModeratedMessageCount,
  })) return;

  const messagesSnap = await chatRef
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .limitToLast(CHAT_CONTEXT_MODERATION_MESSAGE_LIMIT)
    .get();

  const messages = messagesSnap.docs
    .map(doc => doc.data())
    .filter((message): message is { senderUid: string; content: string } => (
      typeof message.senderUid === 'string' && typeof message.content === 'string'
    ));
  if (messages.length === 0) return;

  const transcript = buildChatContextTranscript(messages);
  const moderation = normalizeChatContextModeration(await params.provider(transcript));
  const moderationLogRef = params.db.collection('moderationLogs').doc();
  const logBase = {
    targetType: 'chat_context',
    targetId: params.chatId,
    originalContent: transcript,
    messageCount: params.messageCount,
    provider: 'chat_context',
    model: 'configured-provider',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (moderation.status === 'invalid') {
    await moderationLogRef.set({
      ...logBase,
      status: 'provider_invalid',
      reason: 'Invalid chat context moderation result',
    });
    throw new Error('invalid_chat_context_moderation_result');
  }

  await moderationLogRef.set({
    ...logBase,
    status: moderation.status,
    reason: moderation.reason,
  });

  const update: Record<string, unknown> = {
    lastContextModeratedMessageCount: params.messageCount,
    lastContextModerationStatus: moderation.status,
    lastContextModerationReason: moderation.reason,
    lastContextModerationLogId: moderationLogRef.id,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (moderation.status === 'block') {
    update.status = 'moderation_blocked';
    update.moderationBlockedAt = FieldValue.serverTimestamp();
    update.moderationBlockedReason = moderation.reason;
    update.moderationBlockedLogId = moderationLogRef.id;
    update.lastMessageText = '안전 기준에 따라 종료된 대화방입니다.';
  }

  await chatRef.update(update);
}

function defaultReasonForStatus(status: ChatContextModerationStatus): string {
  if (status === 'block') return '안전 기준에 맞지 않는 대화 흐름이 감지되었습니다.';
  if (status === 'warn') return '주의가 필요한 대화 흐름이 감지되었습니다.';
  return '안전한 대화로 판단되었습니다.';
}
