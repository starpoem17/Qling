import { normalizeWorryCategories } from '@midnight-radio/domain';
import type { HomeWorryFeedTimestamp } from './types';

export interface WorryFeedSnapshot {
  content: string;
  summaryText: string;
  matchingCategories: string[];
  validCategories: string[];
  createdAt: HomeWorryFeedTimestamp | null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return null;
}

function legacySummary(content: string): string {
  const chars = Array.from(content);
  return chars.length > 50 ? `${chars.slice(0, 50).join('')}...` : content;
}

function field(data: object, key: string): unknown {
  return (data as Record<string, unknown>)[key];
}

function timestampOrNull(value: unknown): HomeWorryFeedTimestamp | null {
  if (!value || typeof value !== 'object') return null;
  return value as HomeWorryFeedTimestamp;
}

export function buildWorryFeedSnapshot(data: object | undefined | null): WorryFeedSnapshot | null {
  if (!data) return null;

  const content = firstNonEmptyString(field(data, 'content'), field(data, 'refinedContent'), field(data, 'summaryText'));
  if (!content) return null;

  const matchingCategories = normalizeWorryCategories([
    ...stringArray(field(data, 'matchingCategories')),
    ...stringArray(field(data, 'categories')),
  ], { fallback: false });
  const validCategories = normalizeWorryCategories([
    ...stringArray(field(data, 'validCategories')),
    ...stringArray(field(data, 'categories')),
  ], { fallback: false });

  return {
    content,
    summaryText: firstNonEmptyString(field(data, 'summaryText'), field(data, 'content'), field(data, 'refinedContent')) ?? legacySummary(content),
    matchingCategories,
    validCategories,
    createdAt: timestampOrNull(field(data, 'createdAt')),
  };
}

export function worryDocFromFeedSnapshot(params: {
  worryId: string | undefined;
  snapshot: unknown;
}): {
  id: string;
  content: string;
  summaryText: string;
  matchingCategories: string[];
  validCategories: string[];
  createdAt: HomeWorryFeedTimestamp | null;
  status: 'active';
} | null {
  if (typeof params.worryId !== 'string' || !params.worryId) return null;
  if (!params.snapshot || typeof params.snapshot !== 'object') return null;
  const snapshot = params.snapshot as Partial<WorryFeedSnapshot>;
  if (typeof snapshot.content !== 'string' || !snapshot.content.trim()) return null;
  if (typeof snapshot.summaryText !== 'string' || !snapshot.summaryText.trim()) return null;

  return {
    id: params.worryId,
    content: snapshot.content,
    summaryText: snapshot.summaryText,
    matchingCategories: normalizeWorryCategories(stringArray(snapshot.matchingCategories), { fallback: false }),
    validCategories: normalizeWorryCategories(stringArray(snapshot.validCategories), { fallback: false }),
    createdAt: timestampOrNull(snapshot.createdAt),
    status: 'active',
  };
}
