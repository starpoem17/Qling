import type { WorryCategory } from '@midnight-radio/domain';
import type { DisplayDate, ScreenAsyncState } from '../shared/contract';

export type ReceivedWorryFeedItem = {
  readonly deliveryId: string;
  readonly worryId: string;
  readonly category: WorryCategory;
  readonly previewText: string;
  readonly bodyText?: string;
  readonly receivedAt: DisplayDate;
  readonly isUnread: boolean;
};

export type ReceivedWorriesScreenProps = {
  readonly state: ScreenAsyncState;
  readonly items: readonly ReceivedWorryFeedItem[];
  readonly passingDeliveryIds: readonly string[];
  readonly onPass: (deliveryId: string) => void;
  readonly onOpen: (item: { readonly deliveryId: string; readonly worryId: string }) => void;
  readonly onOpenMyPage: () => void;
};
