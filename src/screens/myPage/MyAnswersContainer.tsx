import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { useMyGivenReplies, type ReplyReadModelItem } from '../../services/myWorries';
import {
  backRouteForRoute,
  routeToMyAnswerDetail,
  type AppRouteViewState,
} from '../../services/appShell/prdNavigationPolicy';
import { MyAnswersScreen } from './MyAnswersScreen';
import { mapMyGivenReplyToListItem } from './mapping';

export type MyAnswersContainerProps = {
  readonly user: User | null;
  readonly setSelectedReply: Dispatch<SetStateAction<ReplyReadModelItem | null>>;
  readonly setView: (view: AppRouteViewState) => void;
  readonly setFilterAlert: (message: string) => void;
};

export function MyAnswersContainer(props: MyAnswersContainerProps) {
  const { myGivenReplies, isLoadingMyGivenReplies } = useMyGivenReplies({ user: props.user });
  const [chatCreationReplyId, setChatCreationReplyId] = useState<string | null>(null);
  const items = myGivenReplies.map(reply => mapMyGivenReplyToListItem(reply));

  return (
    <MyAnswersScreen
      state={isLoadingMyGivenReplies
        ? { status: 'loading', label: '내가 쓴 답변을 불러오는 중입니다.' }
        : items.length === 0
          ? { status: 'empty', message: '' }
          : { status: 'ready' }}
      items={items}
      chatCreationReplyId={chatCreationReplyId}
      onBack={() => props.setView(backRouteForRoute('my_answers'))}
      onOpenDetail={item => {
        const selectedReply = myGivenReplies.find(reply => reply.id === item.replyId) ?? null;
        props.setSelectedReply(selectedReply);
        props.setView(routeToMyAnswerDetail({ replyId: item.replyId }));
      }}
      onStartChat={async item => {
        if (!item.worryId || chatCreationReplyId) return;

        setChatCreationReplyId(item.replyId);
        try {
          const token = await props.user?.getIdToken();
          const res = await fetch('/api/chats/create', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ worryId: item.worryId, replyId: item.replyId }),
          });
          const data = await res.json();
          if (res.ok && data.chatId) {
            props.setFilterAlert('');
            props.setView({ route: 'chat_room', chatId: data.chatId });
            return;
          }
          props.setFilterAlert(data.error?.message || '채팅방 생성에 실패했습니다.');
        } catch (error) {
          console.error(error);
          props.setFilterAlert('네트워크 오류가 발생했습니다.');
        } finally {
          setChatCreationReplyId(null);
        }
      }}
    />
  );
}
