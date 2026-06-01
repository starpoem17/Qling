import { useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ChatScreen, type ChatListItem } from './ChatScreen';
import type { AppRouteViewState } from '../../services/appShell/prdNavigationPolicy';

export function ChatListContainer({
  user,
  setView,
}: {
  readonly user: FirebaseUser | null;
  readonly setView: (view: AppRouteViewState) => void;
}) {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const chatItems: ChatListItem[] = [];
        
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          if (data.status !== 'active') continue;

          const opponentUid = data.participants.find((p: string) => p !== user.uid);
          let opponentName = '알 수 없음';
          let opponentColor = '#cccccc';

          if (opponentUid && data.participantProfiles && data.participantProfiles[opponentUid]) {
            opponentName = data.participantProfiles[opponentUid].nickname || '익명';
            opponentColor = data.participantProfiles[opponentUid].profileColor || '#FF8B3D';
          }

          const unreadCount = data.unreadCounts?.[user.uid] || 0;
          const lastDate = data.lastMessageAt ? data.lastMessageAt.toDate() : (data.createdAt ? data.createdAt.toDate() : new Date());

          let dateLabel = '';
          const now = new Date();
          const isSameDay = lastDate.getDate() === now.getDate() && lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear();
          if (isSameDay) {
            dateLabel = lastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
            dateLabel = `${lastDate.getMonth() + 1}/${lastDate.getDate()}`;
          }

          chatItems.push({
            chatId: docSnap.id,
            opponentName,
            opponentColor,
            lastMessage: data.lastMessageText || '대화가 시작되었습니다.',
            dateLabel,
            unreadCount,
            _sortDate: lastDate.getTime(),
          } as ChatListItem & { _sortDate: number });
        }
        
        chatItems.sort((a, b) => (b as any)._sortDate - (a as any)._sortDate);
        setChats(chatItems);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load chat list:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <ChatScreen
      loading={loading}
      chats={chats}
      onChatClick={(chatId) => setView({ route: 'chat_room', chatId })}
    />
  );
}
