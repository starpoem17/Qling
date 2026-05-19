export interface HomeWorryFeedProfile {
  uid: string;
}

export interface HomeWorryFeedTimestamp {
  toMillis?: () => number;
  seconds?: number;
  _seconds?: number;
}

export interface HomeWorryFeedLetter {
  id: string;
  senderId: string;
  receiverId: string;
  originalContent: string;
  refinedContent: string;
  categories?: string[];
  category?: string;
  createdAt?: HomeWorryFeedTimestamp | null;
  source?: 'prd_delivery';
  deliveryId?: string;
  worryId?: string;
  authorUid?: string;
  recipientUid?: string;
  status?: 'active' | 'answered' | 'passed' | 'hidden';
  hasUnread?: boolean;
}

export interface PrdAnswerFeedItem {
  id: string;
  deliveryId: string;
  worryId: string;
  authorUid: string;
  recipientUid: string;
  originalContent: string;
  refinedContent: string;
  categories: string[];
  createdAt: HomeWorryFeedTimestamp | null;
  status: 'active';
  source: 'prd_delivery';
  hasUnread: boolean;
}
