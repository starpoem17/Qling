import { useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ChatScreen, type ChatListItem } from './ChatScreen';
import type { AppRouteViewState } from '../../services/appShell/prdNavigationPolicy';

export function ChatListContainer({
  user,
  setView,
  setFilterAlert,
}: {
  readonly user: FirebaseUser | null;
  readonly setView: (view: AppRouteViewState) => void;
  readonly setFilterAlert: (message: string) => void;
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
      async (snap) => {
        const chatItems: ChatListItem[] = [];
        
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          const isModerationBlocked = data.status === 'moderation_blocked';
          if (data.status !== 'active' && !isModerationBlocked) continue;
          if (isModerationBlocked && data.moderationBlockedNoticeSeenBy?.[user.uid] === true) continue;

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
            const isAm = lastDate.getHours() < 12;
            const hours = lastDate.getHours() % 12 || 12;
            const minutes = lastDate.getMinutes().toString().padStart(2, '0');
            dateLabel = `${isAm ? '오전' : '오후'} ${hours}:${minutes}`;
          } else if (lastDate.getDate() === now.getDate() - 1 && lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear()) {
            dateLabel = '어제';
          } else {
            dateLabel = `${lastDate.getMonth() + 1}월 ${lastDate.getDate()}일`;
          }

          // Fetch worry details safely (will populate later if not available immediately)
          chatItems.push({
            chatId: docSnap.id,
            opponentUid: opponentUid || '',
            opponentName,
            opponentColor,
            lastMessage: isModerationBlocked
              ? '안전 기준에 따라 종료된 대화방입니다.'
              : data.lastMessageText || '대화가 시작되었습니다.',
            dateLabel,
            unreadCount: isModerationBlocked ? 0 : unreadCount,
            moderationBlocked: isModerationBlocked,
            worryId: data.worryId,
            worryCategory: '기타', // default
            worryTitle: '불러오는 중...', // default
            _sortDate: lastDate.getTime(),
          } as ChatListItem & { _sortDate: number, worryId: string });
        }
        
        // Fetch worry data
        await Promise.all(chatItems.map(async (item: any) => {
          if (item.worryId) {
            try {
              const worrySnap = await getDoc(doc(db, 'worries', item.worryId));
              if (worrySnap.exists()) {
                const wData = worrySnap.data();
                item.worryCategory = (wData.validCategories && wData.validCategories[0]) || '기타';
                item.worryTitle = wData.summaryText || '게시글 내용을 불러올 수 없습니다';
              }
            } catch (e) {
               console.error('Failed to fetch worry:', e);
               item.worryTitle = '게시글을 불러올 수 없습니다';
            }
          }
        }));

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

  const handleLeaveChat = async (chatId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/chats/${chatId}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setFilterAlert('채팅방을 나갔습니다.');
    } catch (err) {
      console.error('Failed to leave chat:', err);
      setFilterAlert('오류가 발생했습니다.');
    }
  };

  return (
    <ChatScreen
      loading={loading}
      chats={chats}
      onChatClick={(chatId) => setView({ route: 'chat_room', chatId })}
      onProfileClick={() => setView('마이페이지')}
      onNotificationOff={() => setFilterAlert('알림이 꺼졌습니다.')}
      onLeaveChat={handleLeaveChat}
      onReportUser={(chatId, targetUid, targetNickname) => setView({ route: 'report_user', targetUid, targetNickname, chatId, fromRoute: 'chat' })}
    />
  );
}
