import type { User } from 'firebase/auth';
import { useMyGivenReplies } from '../../services/myWorries';
import {
  backRouteForRoute,
  type AppRouteViewState,
} from '../../services/appShell/prdNavigationPolicy';
import { MyAnswersScreen } from './MyAnswersScreen';
import { mapMyGivenReplyToListItem } from './mapping';

export type MyAnswersContainerProps = {
  readonly user: User | null;
  readonly setView: (view: AppRouteViewState) => void;
  readonly setFilterAlert: (message: string) => void;
};

export function MyAnswersContainer(props: MyAnswersContainerProps) {
  const { myGivenReplies, isLoadingMyGivenReplies } = useMyGivenReplies({ user: props.user });
  const items = myGivenReplies.map(reply => mapMyGivenReplyToListItem(reply));

  return (
    <MyAnswersScreen
      state={isLoadingMyGivenReplies
        ? { status: 'loading', label: '내가 쓴 답변을 불러오는 중입니다.' }
        : items.length === 0
          ? { status: 'empty', message: '' }
          : { status: 'ready' }}
      items={items}
      onBack={() => props.setView(backRouteForRoute('my_answers'))}
      onStartChat={async item => {
        if (!item.worryId) return;

        props.setFilterAlert('채팅방을 생성하고 있습니다...');
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
        }
      }}
    />
  );
}
