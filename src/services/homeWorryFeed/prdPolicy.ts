import type {
  HomeWorryFeedLetter,
  HomeWorryFeedTimestamp,
  PrdAnswerFeedItem,
} from './types';
import type { WorryFeedSnapshot } from './worrySnapshot';
import { normalizeWorryCategories } from '@midnight-radio/domain';

export interface PrdDeliveryDoc {
  id: string;
  worryId?: string;
  authorUid?: string;
  recipientUid?: string;
  status?: string;
  answeredAt?: unknown;
  passedAt?: unknown;
  hiddenAt?: unknown;
  worrySnapshot?: WorryFeedSnapshot | null;
}

export interface PrdWorryDoc {
  id: string;
  content?: string;
  summaryText?: unknown;
  matchingCategories?: unknown;
  validCategories?: unknown;
  createdAt?: HomeWorryFeedTimestamp | null;
  status?: string;
  hiddenAt?: unknown;
  deletedAt?: unknown;
}

function legacySummary(content: string): string {
  const chars = Array.from(content);
  return chars.length > 50 ? `${chars.slice(0, 50).join('')}...` : content;
}

function summaryTextForWorry(worry: PrdWorryDoc): string {
  return typeof worry.summaryText === 'string' && worry.summaryText.trim()
    ? worry.summaryText
    : legacySummary(worry.content ?? '');
}

export interface DeliveryReadStateDoc {
  deliveryId?: string;
  readAt?: unknown;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export function isHiddenDelivery(delivery: Pick<PrdDeliveryDoc, 'status' | 'hiddenAt'>): boolean {
  return delivery.status === 'hidden' || Boolean(delivery.hiddenAt);
}

export function isHiddenWorry(worry: Pick<PrdWorryDoc, 'status' | 'hiddenAt'>): boolean {
  return worry.status === 'hidden'
    || worry.status === 'deleted'
    || Boolean(worry.hiddenAt)
    || Boolean((worry as Pick<PrdWorryDoc, 'deletedAt'>).deletedAt);
}

export function selectVisibleAnswerFeedItems(params: {
  deliveries: PrdDeliveryDoc[];
  worriesById: Map<string, PrdWorryDoc>;
  readStatesByDeliveryId?: Map<string, DeliveryReadStateDoc>;
  profileUid: string;
}): PrdAnswerFeedItem[] {
  return params.deliveries.flatMap(delivery => {
    if (delivery.recipientUid !== params.profileUid) return [];
    if (delivery.status !== 'active') return [];
    if (delivery.answeredAt || delivery.passedAt || isHiddenDelivery(delivery)) return [];
    if (!delivery.worryId || !delivery.authorUid || !delivery.recipientUid) return [];

    const worry = params.worriesById.get(delivery.worryId);
    if (!worry || typeof worry.content !== 'string') return [];
    if (isHiddenWorry(worry)) return [];

    const matchingCategories = normalizeWorryCategories(stringArray(worry.matchingCategories), { fallback: false });
    const validCategories = normalizeWorryCategories(stringArray(worry.validCategories), { fallback: false });

    return [{
      id: delivery.id,
      deliveryId: delivery.id,
      worryId: delivery.worryId,
      authorUid: delivery.authorUid,
      recipientUid: delivery.recipientUid,
      originalContent: worry.content,
      refinedContent: worry.content,
      summaryText: summaryTextForWorry(worry),
      categories: matchingCategories.length > 0 ? matchingCategories : validCategories,
      createdAt: worry.createdAt ?? null,
      status: 'active' as const,
      source: 'prd_delivery' as const,
      hasUnread: !params.readStatesByDeliveryId?.has(delivery.id),
    }];
  }).sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
}

function timestampMillis(value: HomeWorryFeedTimestamp | null | undefined): number {
  if (value?.toMillis) return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (typeof value?._seconds === 'number') return value._seconds * 1000;
  return 0;
}

export const selectActivePrdAnswerFeedItems = selectVisibleAnswerFeedItems;

export function adaptPrdAnswerFeedItemToHomeWorryFeedLetter(
  item: PrdAnswerFeedItem
): HomeWorryFeedLetter {
  return {
    id: item.deliveryId,
    senderId: item.authorUid,
    receiverId: item.recipientUid,
    originalContent: item.originalContent,
    refinedContent: item.refinedContent,
    summaryText: item.summaryText,
    categories: item.categories,
    category: item.categories[0],
    createdAt: item.createdAt,
    source: item.source,
    deliveryId: item.deliveryId,
    worryId: item.worryId,
    authorUid: item.authorUid,
    recipientUid: item.recipientUid,
    status: item.status,
    hasUnread: item.hasUnread,
  };
}
