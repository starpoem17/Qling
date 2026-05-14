import type { User } from 'firebase/auth';
import type { PrdAnswerFeedItem } from './types';

export type ClientPrdAnswerFeedResult =
  | { status: 'ok'; items: PrdAnswerFeedItem[] }
  | { status: 'failed'; reason: string; code?: string };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function toPrdAnswerFeedItem(value: unknown): PrdAnswerFeedItem | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;

  if (
    typeof item.id !== 'string'
    || typeof item.deliveryId !== 'string'
    || typeof item.worryId !== 'string'
    || typeof item.authorUid !== 'string'
    || typeof item.recipientUid !== 'string'
    || typeof item.originalContent !== 'string'
    || typeof item.refinedContent !== 'string'
    || !isStringArray(item.categories)
    || item.status !== 'active'
    || item.source !== 'prd_delivery'
    || typeof item.hasUnread !== 'boolean'
  ) {
    return null;
  }

  return {
    id: item.id,
    deliveryId: item.deliveryId,
    worryId: item.worryId,
    authorUid: item.authorUid,
    recipientUid: item.recipientUid,
    originalContent: item.originalContent,
    refinedContent: item.refinedContent,
    categories: item.categories,
    createdAt: item.createdAt && typeof item.createdAt === 'object'
      ? item.createdAt as PrdAnswerFeedItem['createdAt']
      : null,
    status: 'active',
    source: 'prd_delivery',
    hasUnread: item.hasUnread,
  };
}

export async function fetchPrdAnswerFeedViaApi(params: {
  user: User;
  fetchImpl?: typeof fetch;
}): Promise<ClientPrdAnswerFeedResult> {
  const fetchImpl = params.fetchImpl ?? fetch;
  const idToken = await params.user.getIdToken();

  const response = await fetchImpl('/api/me/answer-feed', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      status: 'failed',
      code: body?.error?.code,
      reason: body?.error?.message ?? '답변 피드를 불러오지 못했습니다.',
    };
  }

  if (!Array.isArray(body?.items)) {
    return { status: 'failed', reason: '답변 피드 응답을 해석할 수 없습니다.' };
  }

  const items = body.items.map(toPrdAnswerFeedItem);
  if (items.some(item => item === null)) {
    return { status: 'failed', reason: '답변 피드 응답을 해석할 수 없습니다.' };
  }

  return {
    status: 'ok',
    items: items as PrdAnswerFeedItem[],
  };
}
