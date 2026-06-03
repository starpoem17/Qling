import { DEFAULT_WORRY_CATEGORY, normalizeWorryCategories, type WorryCategory } from '@midnight-radio/domain';
import type { HomeWorryFeedLetter } from '../../services/homeWorryFeed';
import type { DisplayDate } from '../shared/contract';
import { formatDisplayDate, type DisplayDateOptions } from '../shared/displayDate';
import type { ReceivedWorryFeedItem } from './contract';

function categoryForFeedItem(worry: HomeWorryFeedLetter): WorryCategory {
  return normalizeWorryCategories([
    ...(worry.categories ?? []),
    worry.category,
  ])[0] ?? DEFAULT_WORRY_CATEGORY;
}

function displayDateFromTimestamp(createdAt: HomeWorryFeedLetter['createdAt'], options?: DisplayDateOptions): DisplayDate {
  return formatDisplayDate(createdAt, options);
}

export function mapHomeWorryFeedLetterToReceivedWorryFeedItem(
  worry: HomeWorryFeedLetter,
  options?: DisplayDateOptions,
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
    previewText: worry.summaryText || worry.refinedContent,
    bodyText: worry.summaryText || worry.refinedContent,
    receivedAt: displayDateFromTimestamp(worry.createdAt, options),
    isUnread: worry.hasUnread === true,
  };
}
