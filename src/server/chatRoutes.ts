import type express from 'express';
import type { Auth } from 'firebase-admin/auth';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { Messaging } from 'firebase-admin/messaging';
import { createRequireActiveFirebaseAuth, type ActiveAuthenticatedRequest } from './auth';
import {
  enqueueChatContextModerationJob,
  shouldRunChatContextModeration,
} from '../services/chatSafety/server/contextModeration';
import {
  evaluateChatMessageRuleSafety,
  type ChatRuleSafetyResult,
} from '../services/chatSafety/server/ruleBasedFilter';

export type ChatMessageSafetyPolicy = (content: string) => ChatRuleSafetyResult;

export type ChatAnswerAdoptionMetrics = {
  readonly adoptionRatePercent: number;
  readonly replyCount: number;
  readonly adoptedCount: number;
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
}

function buildChatWorrySnapshot(worryData: FirebaseFirestore.DocumentData | undefined) {
  return {
    category: stringArray(worryData?.validCategories)[0]
      ?? stringArray(worryData?.matchingCategories)[0]
      ?? '기타',
    summaryText: firstString(worryData?.summaryText, worryData?.refinedContent, worryData?.content)
      ?? '게시글 내용을 불러올 수 없습니다',
    content: firstString(worryData?.content, worryData?.refinedContent, worryData?.summaryText)
      ?? '게시글 내용을 불러올 수 없습니다',
    createdAt: worryData?.createdAt ?? null,
  };
}

export function registerChatRoutes(app: express.Express, deps: {
  db: Firestore | null;
  messaging: Messaging | null;
  auth: Auth;
  messageSafetyPolicy?: ChatMessageSafetyPolicy;
  contextModerationEnabled?: boolean;
}): void {
  if (!deps.db) {
    app.post('/api/chats/create', (_req, res) => res.status(500).json({ error: 'firebase_unavailable' }));
    app.post('/api/chats/:chatId/messages', (_req, res) => res.status(500).json({ error: 'firebase_unavailable' }));
    app.get('/api/chats/:chatId/answer-adoption', (_req, res) => res.status(500).json({ error: 'firebase_unavailable' }));
    app.post('/api/chats/:chatId/moderation-notice/read', (_req, res) => res.status(500).json({ error: 'firebase_unavailable' }));
    return;
  }
  const messageSafetyPolicy = deps.messageSafetyPolicy ?? evaluateChatMessageRuleSafety;

  // Create chat room
  app.post(
    '/api/chats/create',
    createRequireActiveFirebaseAuth({ auth: deps.auth, db: deps.db }),
    async (req, res) => {
      try {
        const authReq = req as ActiveAuthenticatedRequest;
        const uid = authReq.auth.uid;
        const { replyId } = req.body;

        if (typeof replyId !== 'string') {
          res.status(400).json({ error: { code: 'invalid_argument', message: 'replyId is required' } });
          return;
        }

        const db = deps.db as Firestore;
        const replyRef = db.collection('replies').doc(replyId);
        const replyDoc = await replyRef.get();

        if (!replyDoc.exists) {
          res.status(404).json({ error: { code: 'not_found', message: 'Reply not found' } });
          return;
        }

        const replyData = replyDoc.data()!;
        
        // Chat can only be created if feedback is helpful
        if (replyData.feedbackType !== 'like') {
          res.status(403).json({ error: { code: 'forbidden', message: 'Only liked replies can start a chat.' } });
          return;
        }

        // Only author or replier can create/access the chat
        if (uid !== replyData.authorUid && uid !== replyData.replierUid) {
          res.status(403).json({ error: { code: 'forbidden', message: 'Not authorized for this reply.' } });
          return;
        }

        const chatRef = db.collection('chats');
        
        // Check if there is an existing active chat for this reply where this user is a participant
        const existingChatsSnap = await chatRef
          .where('replyId', '==', replyId)
          .where('participants', 'array-contains', uid)
          .get();
        
        const activeChat = existingChatsSnap.docs.find(doc => doc.data().status === 'active');

        if (activeChat) {
          // If the user is already in an active chat for this reply, just return it
          // Update profiles just in case
          const authorSnap = await db.collection('users').doc(replyData.authorUid).get();
          const replierSnap = await db.collection('users').doc(replyData.replierUid).get();
          const worrySnap = typeof replyData.worryId === 'string'
            ? await db.collection('worries').doc(replyData.worryId).get()
            : null;
          const participantProfiles = {
            [replyData.authorUid]: {
              nickname: authorSnap.data()?.nickname || '익명',
              profileColor: authorSnap.data()?.profileColor || '#FF8B3D'
            },
            [replyData.replierUid]: {
              nickname: replierSnap.data()?.nickname || '익명',
              profileColor: replierSnap.data()?.profileColor || '#FF8B3D'
            }
          };
          await activeChat.ref.update({
            participantProfiles,
            ...(worrySnap?.exists ? { worrySnapshot: buildChatWorrySnapshot(worrySnap.data()) } : {}),
          });
          res.status(200).json({ status: 'success', chatId: activeChat.id });
          return;
        }

        const authorSnap = await db.collection('users').doc(replyData.authorUid).get();
        const replierSnap = await db.collection('users').doc(replyData.replierUid).get();
        const worrySnap = typeof replyData.worryId === 'string'
          ? await db.collection('worries').doc(replyData.worryId).get()
          : null;
        
        const participantProfiles = {
          [replyData.authorUid]: {
            nickname: authorSnap.data()?.nickname || '익명',
            profileColor: authorSnap.data()?.profileColor || '#FF8B3D'
          },
          [replyData.replierUid]: {
            nickname: replierSnap.data()?.nickname || '익명',
            profileColor: replierSnap.data()?.profileColor || '#FF8B3D'
          }
        };

        // Create a NEW chat room since there is no active one for this user
        const newChatRef = chatRef.doc(); // Auto-generated ID
        const chatId = newChatRef.id;

        await newChatRef.set({
          replyId: replyId,
          worryId: replyData.worryId,
          authorUid: replyData.authorUid,
          replierUid: replyData.replierUid,
          participants: [replyData.authorUid, replyData.replierUid],
          participantProfiles,
          worrySnapshot: buildChatWorrySnapshot(worrySnap?.data()),
          createdAt: FieldValue.serverTimestamp(),
          lastMessageAt: null,
          lastMessageText: '',
          status: 'active',
          unreadCounts: {
            [replyData.authorUid]: 0,
            [replyData.replierUid]: 0,
          }
        });

        res.status(200).json({ status: 'success', chatId });
      } catch (error) {
        console.error('Failed to create chat:', error);
        res.status(500).json({ error: { code: 'internal_error', message: 'Failed to create chat.' } });
      }
    }
  );

  app.get(
    '/api/chats/:chatId/answer-adoption',
    createRequireActiveFirebaseAuth({ auth: deps.auth, db: deps.db }),
    async (req, res) => {
      try {
        const authReq = req as ActiveAuthenticatedRequest;
        const uid = authReq.auth.uid;
        const { chatId } = req.params;
        const db = deps.db as Firestore;
        const chatDoc = await db.collection('chats').doc(chatId).get();

        if (!chatDoc.exists) {
          res.status(404).json({ error: { code: 'not_found', message: 'Chat not found' } });
          return;
        }

        const chatData = chatDoc.data() ?? {};
        const participants = Array.isArray(chatData.participants)
          ? chatData.participants.filter((participant): participant is string => typeof participant === 'string')
          : [];
        if (!participants.includes(uid)) {
          res.status(403).json({ error: { code: 'forbidden', message: 'Not authorized for this chat.' } });
          return;
        }

        const opponentUid = participants.find(participant => participant !== uid);
        if (!opponentUid) {
          res.status(200).json({ adoptionRatePercent: 0, replyCount: 0, adoptedCount: 0 });
          return;
        }

        res.status(200).json(await getChatAnswerAdoptionMetrics({ db, opponentUid }));
      } catch (error) {
        console.error('Failed to load chat answer adoption metrics:', error);
        res.status(500).json({ error: { code: 'answer_adoption_failed', message: '답변 채택률을 불러오지 못했습니다.' } });
      }
    }
  );

  // Send message
  app.post(
    '/api/chats/:chatId/messages',
    createRequireActiveFirebaseAuth({ auth: deps.auth, db: deps.db }),
    async (req, res) => {
      try {
        const authReq = req as ActiveAuthenticatedRequest;
        const uid = authReq.auth.uid;
        const { chatId } = req.params;
        const { content } = req.body;

        if (typeof content !== 'string' || content.trim().length === 0) {
          res.status(400).json({ error: { code: 'invalid_argument', message: 'Message content cannot be empty.' } });
          return;
        }

        const safetyResult = messageSafetyPolicy(content);
        if (safetyResult.status === 'rejected') {
          res.status(200).json(safetyResult);
          return;
        }

        const db = deps.db as Firestore;
        const chatRef = db.collection('chats').doc(chatId);
        let nextMessageCount = 0;
        let lastModeratedMessageCount: unknown = 0;
        
        await db.runTransaction(async (transaction) => {
          const chatDoc = await transaction.get(chatRef);
          if (!chatDoc.exists) {
            throw new Error('NOT_FOUND');
          }
          
          const chatData = chatDoc.data()!;
          if (!chatData.participants.includes(uid)) {
            throw new Error('FORBIDDEN');
          }

          if (chatData.status !== 'active') {
            throw new Error('CHAT_CLOSED');
          }

          const trimmedContent = content.trim();
          const messageRef = chatRef.collection('messages').doc();
          transaction.set(messageRef, {
            senderUid: uid,
            content: trimmedContent,
            createdAt: FieldValue.serverTimestamp(),
          });

          const recipientUid = chatData.participants.find((p: string) => p !== uid);
          if (!recipientUid) {
            throw new Error('OPPONENT_LEFT');
          }

          const currentMessageCount = typeof chatData.messageCount === 'number' ? chatData.messageCount : 0;
          nextMessageCount = currentMessageCount + 1;
          lastModeratedMessageCount = chatData.lastContextModeratedMessageCount;
          const updates: any = {
            lastMessageAt: FieldValue.serverTimestamp(),
            lastMessageText: trimmedContent,
            messageCount: nextMessageCount,
          };
          
          updates[`unreadCounts.${recipientUid}`] = FieldValue.increment(1);

          transaction.update(chatRef, updates);
          if (
            deps.contextModerationEnabled === true
            && shouldRunChatContextModeration({ messageCount: nextMessageCount, lastModeratedMessageCount })
          ) {
            enqueueChatContextModerationJob({
              db,
              transaction,
              chatId,
              messageCount: nextMessageCount,
              now: FieldValue.serverTimestamp(),
            });
          }
        }).then(() => {
          res.status(200).json({ status: 'published' });
          
          // Send push notification asynchronously
          // (Assuming we want to notify the other participant)
          chatRef.get().then(chatDoc => {
            const chatData = chatDoc.data();
            if (chatData && deps.messaging) {
              const recipientUid = chatData.participants.find((p: string) => p !== uid);
              if (recipientUid) {
                // To do full Push we would look up FCM tokens.
                // Qling's existing push notification logic is usually in separate services,
                // but this is a placeholder or basic implement.
              }
            }
          });
          
        }).catch(err => {
          if (err.message === 'NOT_FOUND') {
            res.status(404).json({ error: { code: 'not_found', message: 'Chat not found' } });
            return;
          }
          if (err.message === 'OPPONENT_LEFT') {
            res.status(403).json({ error: { code: 'chat_closed', message: '상대방이 채팅방을 나갔습니다.' } });
            return;
          }
          if (err.message === 'FORBIDDEN') {
            res.status(403).json({ error: { code: 'forbidden', message: 'Not authorized for this chat.' } });
            return;
          }
          if (err.message === 'CHAT_CLOSED') {
            res.status(403).json({ error: { code: 'chat_closed', message: 'This chat is closed.' } });
            return;
          }
          throw err;
        });

      } catch (error) {
        console.error('Failed to send message:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: { code: 'internal_error', message: 'Failed to send message.' } });
        }
      }
    }
  );

  // Mark chat as read
  app.post(
    '/api/chats/:chatId/read',
    createRequireActiveFirebaseAuth({ auth: deps.auth, db: deps.db }),
    async (req, res) => {
      try {
        const authReq = req as ActiveAuthenticatedRequest;
        const uid = authReq.auth.uid;
        const { chatId } = req.params;

        const db = deps.db as Firestore;
        const chatRef = db.collection('chats').doc(chatId);
        
        await db.runTransaction(async (transaction) => {
          const chatDoc = await transaction.get(chatRef);
          if (!chatDoc.exists) return;
          
          const chatData = chatDoc.data()!;
          if (!chatData.participants.includes(uid)) return;

          transaction.update(chatRef, {
            [`unreadCounts.${uid}`]: 0
          });
        });

        res.status(200).json({ status: 'success' });
      } catch (error) {
        console.error('Failed to mark chat as read:', error);
        res.status(500).json({ error: { code: 'internal_error', message: 'Failed to mark chat as read.' } });
      }
    }
  );

  app.post(
    '/api/chats/:chatId/moderation-notice/read',
    createRequireActiveFirebaseAuth({ auth: deps.auth, db: deps.db }),
    async (req, res) => {
      try {
        const authReq = req as ActiveAuthenticatedRequest;
        const uid = authReq.auth.uid;
        const { chatId } = req.params;

        const db = deps.db as Firestore;
        const chatRef = db.collection('chats').doc(chatId);

        await db.runTransaction(async (transaction) => {
          const chatDoc = await transaction.get(chatRef);
          if (!chatDoc.exists) return;

          const chatData = chatDoc.data()!;
          if (!chatData.participants.includes(uid)) return;
          if (chatData.status !== 'moderation_blocked') return;

          transaction.update(chatRef, {
            [`moderationBlockedNoticeSeenBy.${uid}`]: true,
          });
        });

        res.status(200).json({ status: 'success' });
      } catch (error) {
        console.error('Failed to mark moderation notice as read:', error);
        res.status(500).json({ error: { code: 'internal_error', message: 'Failed to mark moderation notice as read.' } });
      }
    }
  );

  // Leave chat
  app.post(
    '/api/chats/:chatId/leave',
    createRequireActiveFirebaseAuth({ auth: deps.auth, db: deps.db }),
    async (req, res) => {
      try {
        const authReq = req as ActiveAuthenticatedRequest;
        const uid = authReq.auth.uid;
        const { chatId } = req.params;

        const db = deps.db as Firestore;
        const chatRef = db.collection('chats').doc(chatId);
        
        await db.runTransaction(async (transaction) => {
          const chatDoc = await transaction.get(chatRef);
          if (!chatDoc.exists) return;
          
          const chatData = chatDoc.data()!;
          if (!chatData.participants.includes(uid)) return;

          // Remove the user from participants
          transaction.update(chatRef, {
            participants: FieldValue.arrayRemove(uid),
            // Optionally, mark chat closed if both leave or something, but arrayRemove is enough
            // because firestore rules will deny read to this user, hiding it.
            status: chatData.participants.length <= 1 ? 'closed' : chatData.status,
          });
        });

        res.status(200).json({ status: 'success' });
      } catch (error) {
        console.error('Failed to leave chat:', error);
        res.status(500).json({ error: { code: 'internal_error', message: 'Failed to leave chat.' } });
      }
    }
  );
}

async function getChatAnswerAdoptionMetrics(params: {
  readonly db: Firestore;
  readonly opponentUid: string;
}): Promise<ChatAnswerAdoptionMetrics> {
  const [repliesSnap, feedbacksSnap] = await Promise.all([
    params.db.collection('replies').where('replierUid', '==', params.opponentUid).get(),
    params.db.collection('feedbacks').where('replierUid', '==', params.opponentUid).where('type', '==', 'like').get(),
  ]);

  const activeHumanReplyIds = new Set<string>();
  for (const doc of repliesSnap.docs) {
    if (isActiveHumanReply(doc.data())) activeHumanReplyIds.add(doc.id);
  }

  let adoptedCount = 0;
  for (const doc of feedbacksSnap.docs) {
    const feedback = doc.data();
    const replyId = typeof feedback.replyId === 'string' ? feedback.replyId : doc.id;
    if (feedback.helpedCountApplied === true && activeHumanReplyIds.has(replyId)) {
      adoptedCount += 1;
    }
  }

  const replyCount = activeHumanReplyIds.size;
  return {
    adoptionRatePercent: replyCount === 0 ? 0 : Math.round((adoptedCount / replyCount) * 100),
    replyCount,
    adoptedCount,
  };
}

function isActiveHumanReply(reply: FirebaseFirestore.DocumentData): boolean {
  return reply.status === 'active'
    && !reply.hiddenAt
    && reply.isAiGenerated !== true;
}
