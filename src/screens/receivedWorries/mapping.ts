import { WORRY_CATEGORIES, type WorryCategory } from '@midnight-radio/domain';
import type { HomeWorryFeedLetter } from '../../services/homeWorryFeed';
import { formatLocalDisplayDate } from '../shared/displayDate';
import type { ReceivedWorryFeedItem } from './contract';

function isWorryCategory(value: string | undefined): value is WorryCategory {
  return typeof value === 'string' && (WORRY_CATEGORIES as readonly string[]).includes(value);
}

function categoryForFeedItem(worry: HomeWorryFeedLetter): WorryCategory {
  const category = worry.category ?? worry.categories?.[0];
  return isWorryCategory(category) ? category : WORRY_CATEGORIES[0];
}

export function mapHomeWorryFeedLetterToReceivedWorryFeedItem(
  worry: HomeWorryFeedLetter
): ReceivedWorryFeedItem | null {
  if (worry.status && worry.status !== 'active') {
    return null;
  }
  if (!worry.deliveryId || !worry.worryId) {
    return null;
  }

  return {
    deliveryId: worry.deliveryId,
    worryId: worry.worryId,
    category: categoryForFeedItem(worry),
    previewText: worry.refinedContent,
    bodyText: worry.refinedContent,
    receivedAt: formatLocalDisplayDate(worry.createdAt, { fallbackLabel: '수신됨' }),
    isUnread: worry.hasUnread === true,
  };
}
