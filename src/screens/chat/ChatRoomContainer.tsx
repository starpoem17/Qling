import { useEffect, useState, useRef } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, collection, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ChatRoomScreen, type ChatMessage } from './ChatRoomScreen';
import type { AppRouteViewState } from '../../services/appShell/prdNavigationPolicy';

export function ChatRoomContainer({
  user,
  chatId,
  setView,
}: {
  readonly user: FirebaseUser | null;
  readonly chatId: string;
  readonly setView: (view: AppRouteViewState) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [opponent, setOpponent] = useState<{ nickname: string; profileColor: string; uid: string } | null>(null);
  const [worryInfo, setWorryInfo] = useState<{ category: string; title: string; createdAtStr: string } | null>(null);
  const [opponentUnreadCount, setOpponentUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const worryFetchedRef = useRef(false);

  useEffect(() => {
    if (!user || !chatId) return;

    user.getIdToken().then(token => {
      fetch(`/api/chats/${chatId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).catch(err => console.error('Failed to mark chat as read:', err));
    }).catch(err => console.error('Failed to get token:', err));

    // Listen to chat doc to get participants and worryId
    const unsubscribeChat = onSnapshot(
      doc(db, 'chats', chatId),
      async (chatSnap) => {
        if (!chatSnap.exists()) {
          setError('채팅방을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        const chatData = chatSnap.data();
        if (!chatData.participants || !chatData.participants.includes(user.uid)) {
          setError('이 채팅방에 접근할 권한이 없습니다.');
          setLoading(false);
          return;
        }

        const opponentUid = chatData.participants.find((uid: string) => uid !== user.uid);
        if (opponentUid && !opponent) {
          if (chatData.participantProfiles && chatData.participantProfiles[opponentUid]) {
            setOpponent({
              uid: opponentUid,
              nickname: chatData.participantProfiles[opponentUid].nickname || '익명',
              profileColor: chatData.participantProfiles[opponentUid].profileColor || '#FF8B3D',
            });
          } else {
            setOpponent({ uid: opponentUid, nickname: '알 수 없음', profileColor: '#cccccc' });
          }
        }

        if (opponentUid) {
           setOpponentUnreadCount(chatData.unreadCounts?.[opponentUid] || 0);
        }

        if (chatData.worryId && !worryFetchedRef.current) {
          worryFetchedRef.current = true;
          getDoc(doc(db, 'worries', chatData.worryId)).then(snap => {
            if (snap.exists()) {
              const wd = snap.data();
              const date = wd.createdAt ? wd.createdAt.toDate() : new Date();
              setWorryInfo({
                category: (wd.validCategories && wd.validCategories[0]) || '기타',
                title: wd.summaryText || '게시글 내용을 불러올 수 없습니다',
                createdAtStr: `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`,
              });
            }
          });
        }
      },
      (err) => {
        console.error('Chat sub error:', err);
        setError('채팅방 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    );

    // Listen to messages
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snap) => {
        const newMessages: ChatMessage[] = snap.docs.map(docSnap => {
          const data = docSnap.data();
          const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
          const isAm = createdAt.getHours() < 12;
          const hours = createdAt.getHours() % 12 || 12;
          const minutes = createdAt.getMinutes().toString().padStart(2, '0');

          return {
            messageId: docSnap.id,
            content: data.content,
            isMine: data.senderUid === user.uid,
            createdAtStr: `${isAm ? '오전' : '오후'} ${hours}:${minutes}`,
          };
        });
        setMessages(newMessages);
        setLoading(false);

        // If the latest message is from the opponent, mark as read so they see '읽음' in real-time
        if (snap.docs.length > 0) {
          const lastData = snap.docs[snap.docs.length - 1].data();
          if (lastData.senderUid !== user.uid) {
            user.getIdToken().then(token => {
              fetch(`/api/chats/${chatId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(e => console.error('Failed to update read status in real-time', e));
            });
          }
        }
      },
      (err) => {
        console.error('Messages sub error:', err);
        setError('메시지를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [user, chatId, opponent]);

  const handleSendMessage = async (content: string) => {
    if (!user || !content.trim()) return { success: false, error: 'empty_message' };
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      
      if (!res.ok || data.status === 'rejected') {
        return { success: false, error: data.reason || data.error?.message || '메시지 전송에 실패했습니다.' };
      }
      
      return { success: true };
    } catch (err) {
      console.error('Send message error:', err);
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    }
  };

  const handleLeaveChat = async () => {
    if (!user || !chatId) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/chats/${chatId}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('채팅방을 나갔습니다.');
      setView({ route: 'chat' });
    } catch (err) {
      console.error('Failed to leave chat:', err);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <ChatRoomScreen
      loading={loading}
      error={error}
      messages={messages}
      opponent={opponent}
      opponentUnreadCount={opponentUnreadCount}
      worryInfo={worryInfo}
      onBack={() => setView({ route: 'chat' })}
      onSendMessage={handleSendMessage}
      onLeaveChat={handleLeaveChat}
    />
  );
}
