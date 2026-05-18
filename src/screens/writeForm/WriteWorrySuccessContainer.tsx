import type { Dispatch, SetStateAction } from 'react';
import {
  routeAfterWorrySuccessConfirmation,
  type AppRouteViewState,
} from '../../services/appShell/prdNavigationPolicy';
import { WriteWorrySuccessScreen } from './WriteWorrySuccessScreen';

export type WriteWorrySuccessContainerProps = {
  readonly setView: Dispatch<SetStateAction<AppRouteViewState>>;
};

export function WriteWorrySuccessContainer(props: WriteWorrySuccessContainerProps) {
  return (
    <WriteWorrySuccessScreen
      onConfirm={() => {
        props.setView(routeAfterWorrySuccessConfirmation());
        window.scrollTo(0, 0);
      }}
    />
  );
}
