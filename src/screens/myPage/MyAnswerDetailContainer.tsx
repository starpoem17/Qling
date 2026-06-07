import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import type { ReplyReadModelItem } from '../../services/myWorries';
import type { AppRouteViewState } from '../../services/appShell/prdNavigationPolicy';
import { ReplyDetailContainer } from '../replyDetail/ReplyDetailContainer';

export type MyAnswerDetailContainerProps = {
  readonly user: User | null;
  readonly route: AppRouteViewState;
  readonly selectedReply: ReplyReadModelItem | null;
  readonly setSelectedReply: Dispatch<SetStateAction<ReplyReadModelItem | null>>;
  readonly setView: (view: AppRouteViewState) => void;
  readonly setFilterAlert: (message: string) => void;
};

export function MyAnswerDetailContainer(props: MyAnswerDetailContainerProps) {
  return (
    <ReplyDetailContainer
      mode="my-answer"
      user={props.user}
      route={props.route}
      selectedReply={props.selectedReply}
      setSelectedReply={props.setSelectedReply}
      setView={props.setView}
      setFilterAlert={props.setFilterAlert}
    />
  );
}
