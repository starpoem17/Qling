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
};

export function MyAnswersContainer(props: MyAnswersContainerProps) {
  const { myGivenReplies, isLoadingMyGivenReplies } = useMyGivenReplies({ user: props.user });
  const items = myGivenReplies.map(reply => mapMyGivenReplyToListItem(reply));

  return (
    <MyAnswersScreen
      state={isLoadingMyGivenReplies
        ? { status: 'loading', label: '내가 쓴 답변을 불러오는 중입니다.' }
        : items.length === 0
          ? { status: 'empty', message: '아직 내가 보낸 위로가 없어요.' }
          : { status: 'ready' }}
      items={items}
      onBack={() => props.setView(backRouteForRoute('my_answers'))}
    />
  );
}
