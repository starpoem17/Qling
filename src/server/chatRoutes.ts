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
          await activeChat.ref.update({ participantProfiles });
          res.status(200).json({ status: 'success', chatId: activeChat.id });
          return;
        }

        const authorSnap = await db.collection('users').doc(replyData.authorUid).get();
        const replierSnap = await db.collection('users').doc(replyData.replierUid).get();
        
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

          const recipientUid = chatData.participants.find((p: string) => p !== uid);
          if (!recipientUid) {
            throw new Error('OPPONENT_LEFT');
          }

          const updates: any = {
            lastMessageAt: FieldValue.serverTimestamp(),
            lastMessageText: content
          };
          
          updates[`unreadCounts.${recipientUid}`] = FieldValue.increment(1);

          transaction.update(chatRef, updates);
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
