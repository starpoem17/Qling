import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import {
  useMyWorries,
  type MyWorryListItem,
  type ReplyReadModelItem,
} from '../../services/myWorries';
import {
  routeToWriteWorry,
  type AppRouteViewState,
} from '../../services/appShell/prdNavigationPolicy';
import { MyWorriesScreen } from './MyWorriesScreen';
import { mapMyWorryToListItem } from './mapping';
import type { MyWorryListItemProps } from './contract';
import { routeForMyWorryAnswerCheck, stateForMyWorries } from './MyWorriesContainerPolicy';

export type MyWorriesContainerProps = {
  readonly user: User | null;
  readonly setSelectedMyWorry: Dispatch<SetStateAction<MyWorryListItem | null>>;
  readonly setView: (view: AppRouteViewState) => void;
};

export type SelectedMyWorry = MyWorryListItem;
export type SelectedMyReply = ReplyReadModelItem;

export function MyWorriesContainer(props: MyWorriesContainerProps) {
  const { myWorries, isLoadingMyWorries, myWorriesError } = useMyWorries({ user: props.user });

  const selectWorry = (item: MyWorryListItemProps) => {
    const selection = routeForMyWorryAnswerCheck({ item, worries: myWorries });
    if (!selection) return;

    props.setSelectedMyWorry(selection.selectedWorry);
    props.setView(selection.route);
  };

  return (
    <MyWorriesScreen
      state={stateForMyWorries({
        isLoading: isLoadingMyWorries,
        error: myWorriesError,
        itemCount: myWorries.length,
      })}
      items={myWorries.map(worry => mapMyWorryToListItem({ worry }))}
      onWriteWorry={() => props.setView(routeToWriteWorry())}
      onOpenMyPage={() => props.setView('마이페이지')}
      onSelectWorryForAnswers={selectWorry}
    />
  );
}
