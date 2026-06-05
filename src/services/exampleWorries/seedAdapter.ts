import { normalizeWorryCategories } from '@midnight-radio/domain';
import type { ExampleWorrySeed } from './types';

function cleanCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return normalizeWorryCategories(value);
}

function cleanSummaryStatus(value: unknown): ExampleWorrySeed['summaryStatus'] | null {
  return value === 'original' || value === 'llm_generated' ? value : null;
}

function cleanSummaryGeneratedBy(value: unknown): ExampleWorrySeed['summaryGeneratedBy'] | null {
  return value === 'none' || value === 'llm' ? value : null;
}

export function adaptExampleWorrySeed(
  id: string,
  data: FirebaseFirestore.DocumentData | undefined
): ExampleWorrySeed | null {
  if (!data) return null;
  if (typeof data.content !== 'string' || data.content.trim().length === 0) return null;
  if (typeof data.summaryText !== 'string' || data.summaryText.trim().length === 0) return null;
  const summaryStatus = cleanSummaryStatus(data.summaryStatus);
  if (!summaryStatus) return null;
  const summaryGeneratedBy = cleanSummaryGeneratedBy(data.summaryGeneratedBy);
  if (!summaryGeneratedBy) return null;
  if (data.status !== 'active' && data.status !== 'inactive') return null;
  const categories = cleanCategories(data.categories);
  if (categories.length === 0) return null;

  return {
    id,
    content: data.content.trim(),
    summaryText: data.summaryText.trim(),
    summaryStatus,
    summaryGeneratedBy,
    categories,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function adaptActiveExampleWorrySeed(
  id: string,
  data: FirebaseFirestore.DocumentData | undefined
): ExampleWorrySeed | null {
  const seed = adaptExampleWorrySeed(id, data);
  return seed?.status === 'active' ? seed : null;
}
