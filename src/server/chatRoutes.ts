import type express from 'express';
import type { Auth } from 'firebase-admin/auth';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { Messaging } from 'firebase-admin/messaging';
import { createRequireActiveFirebaseAuth, type ActiveAuthenticatedRequest } from './auth';

export type ChatModerationProvider = (content: string) => Promise<{ status: 'approved' } | { status: 'rejected'; reason: string }>;

export function registerChatRoutes(app: express.Express, deps: {
  db: Firestore | null;
  messaging: Messaging | null;
  auth: Auth;
  moderationProvider: ChatModerationProvider;
}): void {
  if (!deps.db) {
    app.post('/api/chats/create', (_req, res) => res.status(500).json({ error: 'firebase_unavailable' }));
    app.post('/api/chats/:chatId/messages', (_req, res) => res.status(500).json({ error: 'firebase_unavailable' }));
    return;
  }

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
        if (replyData.feedback !== 'helpful') {
          res.status(403).json({ error: { code: 'forbidden', message: 'Only liked replies can start a chat.' } });
          return;
        }

        // Only author or replier can create/access the chat
        if (uid !== replyData.authorUid && uid !== replyData.replierUid) {
          res.status(403).json({ error: { code: 'forbidden', message: 'Not authorized for this reply.' } });
          return;
        }

        const chatId = replyId;
        const chatRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();

        if (!chatDoc.exists) {
          await chatRef.set({
            replyId: replyId,
            worryId: replyData.worryId,
            authorUid: replyData.authorUid,
            replierUid: replyData.replierUid,
            participants: [replyData.authorUid, replyData.replierUid],
            createdAt: FieldValue.serverTimestamp(),
            lastMessageAt: null,
            lastMessageText: '',
            status: 'active'
          });
        }

        res.status(200).json({ status: 'success', chatId });
      } catch (error) {
        console.error('Failed to create chat:', error);
        res.status(500).json({ error: { code: 'internal_error', message: 'Failed to create chat.' } });
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

        const db = deps.db as Firestore;
        const chatRef = db.collection('chats').doc(chatId);
        
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

          // AI Moderation
          const moderationResult = await deps.moderationProvider(content);
          if (moderationResult.status === 'rejected') {
            res.status(200).json(moderationResult);
            // End transaction early, but transaction requires promise resolution, so we throw a special error
            throw new Error('MODERATION_REJECTED:' + moderationResult.reason);
          }

          const messageRef = chatRef.collection('messages').doc();
          transaction.set(messageRef, {
            senderUid: uid,
            content,
            createdAt: FieldValue.serverTimestamp(),
          });

          transaction.update(chatRef, {
            lastMessageAt: FieldValue.serverTimestamp(),
            lastMessageText: content
          });
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
          if (err.message.startsWith('MODERATION_REJECTED:')) {
            // Already handled
            return;
          }
          if (err.message === 'NOT_FOUND') {
            res.status(404).json({ error: { code: 'not_found', message: 'Chat not found' } });
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
}
