import type { Dispatch, SetStateAction } from 'react';
import {
  routeAfterReplySuccessConfirmation,
  type AppRouteViewState,
} from '../../services/appShell/prdNavigationPolicy';
import { WriteReplySuccessScreen } from './WriteReplySuccessScreen';

export type WriteReplySuccessContainerProps = {
  readonly deliveryId?: string;
  readonly setView: Dispatch<SetStateAction<AppRouteViewState>>;
  readonly onConfirmAnsweredDelivery: (deliveryId: string) => void;
};

export function WriteReplySuccessContainer(props: WriteReplySuccessContainerProps) {
  return (
    <WriteReplySuccessScreen
      onConfirm={() => {
        if (props.deliveryId) props.onConfirmAnsweredDelivery(props.deliveryId);
        props.setView(routeAfterReplySuccessConfirmation());
        if (typeof window !== 'undefined') window.scrollTo(0, 0);
      }}
    />
  );
}
