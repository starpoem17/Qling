import type { ScreenAsyncState } from '../shared/contract';
import type { ReceivedWorryFeedItem } from './contract';

export type ReceivedWorriesFeedStatus = 'idle' | 'loading' | 'ready' | 'error';

export function stateForReceivedWorries(params: {
  readonly feedStatus: ReceivedWorriesFeedStatus;
  readonly feedError: string | null;
  readonly items: readonly ReceivedWorryFeedItem[];
}): ScreenAsyncState {
  if (params.feedStatus === 'loading') {
    return { status: 'loading', label: '답변할 고민을 불러오는 중이에요.' };
  }

  if (params.feedStatus === 'error') {
    return {
      status: 'error',
      message: params.feedError ?? '답변 피드를 불러오지 못했습니다.',
      canRetry: true,
    };
  }

  if (params.items.length === 0) {
    return { status: 'empty', message: '지금은 도착한 고민이 없어요.' };
  }

  return { status: 'ready' };
}

export function shouldMarkReceivedWorryRead(params: {
  readonly hasUser: boolean;
  readonly source?: 'prd_delivery';
}): boolean {
  return params.hasUser && params.source === 'prd_delivery';
}

export function canStartPassMutation(params: {
  readonly deliveryId: string;
  readonly passingDeliveryIds: ReadonlySet<string>;
}): boolean {
  return !params.passingDeliveryIds.has(params.deliveryId);
}
