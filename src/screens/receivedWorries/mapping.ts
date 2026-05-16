import { WORRY_CATEGORIES, type WorryCategory } from '@midnight-radio/domain';
import type { HomeWorryFeedLetter } from '../../services/homeWorryFeed';
import type { DisplayDate } from '../shared/contract';
import type { ReceivedWorryFeedItem } from './contract';

function isWorryCategory(value: string | undefined): value is WorryCategory {
  return typeof value === 'string' && (WORRY_CATEGORIES as readonly string[]).includes(value);
}

function categoryForFeedItem(worry: HomeWorryFeedLetter): WorryCategory {
  const category = worry.category ?? worry.categories?.[0];
  return isWorryCategory(category) ? category : WORRY_CATEGORIES[0];
}

function displayDateFromTimestamp(createdAt: HomeWorryFeedLetter['createdAt']): DisplayDate {
  const millis = createdAt?.toMillis?.();
  if (typeof millis !== 'number' || Number.isNaN(millis)) {
    return { label: '수신됨' };
  }

  return {
    label: new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(millis)),
    isoValue: new Date(millis).toISOString(),
  };
}

export function mapHomeWorryFeedLetterToReceivedWorryFeedItem(
  worry: HomeWorryFeedLetter
): ReceivedWorryFeedItem | null {
  if (!worry.deliveryId || !worry.worryId) {
    return null;
  }

  return {
    deliveryId: worry.deliveryId,
    worryId: worry.worryId,
    category: categoryForFeedItem(worry),
    previewText: worry.refinedContent,
    bodyText: worry.refinedContent,
    receivedAt: displayDateFromTimestamp(worry.createdAt),
    isUnread: worry.hasUnread === true,
  };
}
