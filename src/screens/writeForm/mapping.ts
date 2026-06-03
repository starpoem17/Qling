import { DEFAULT_WORRY_CATEGORY, normalizeWorryCategories, type WorryCategory } from '@midnight-radio/domain';
import type { ContentValidationResult } from '../../services/validation/content';
import type { HomeWorryFeedTimestamp } from '../../services/homeWorryFeed/types';
import type { SelectedReceivedWorry } from '../receivedWorries/ReceivedWorriesContainer';
import type { DisplayDate, ScreenModerationState, SubmitDisabledReason } from '../shared/contract';
import { formatDisplayDate, type DisplayDateOptions } from '../shared/displayDate';
import type { OriginalWorrySummaryProps, WriteDraftContract } from './contract';

export function buildWriteDraftContract(params: {
  readonly value: string;
  readonly maxLength: number;
  readonly validation: ContentValidationResult;
  readonly moderation: ScreenModerationState;
  readonly isProcessing: boolean;
}): WriteDraftContract {
  const submitDisabledReason = resolveSubmitDisabledReason({
    validation: params.validation,
    moderation: params.moderation,
    isProcessing: params.isProcessing,
  });

  return {
    value: params.value,
    characterCount: params.value.trim().length,
    maxLength: params.maxLength,
    validation: params.validation.status === 'valid'
      ? { status: 'valid' }
      : { status: 'invalid', message: params.validation.message },
    moderation: params.moderation,
    errorMessage: params.moderation.status === 'failed' ? params.moderation.message : undefined,
    isProcessing: params.isProcessing,
    submitDisabledReason,
  };
}

export function mapSelectedWorryToOriginalWorrySummary(
  worry: SelectedReceivedWorry,
  options?: DisplayDateOptions,
): OriginalWorrySummaryProps | null {
  if (!worry.deliveryId || !worry.worryId) return null;
  const originalBodyText = worry.originalContent || worry.refinedContent;

  return {
    deliveryId: worry.deliveryId,
    worryId: worry.worryId,
    category: firstValidCategory(worry.categories, worry.category),
    summaryText: worry.summaryText || buildLegacySummary(originalBodyText),
    originalBodyText,
    receivedAt: displayDateFromTimestamp(worry.createdAt, options),
  };
}

export function buildLegacySummary(originalBodyText: string): string {
  return `${Array.from(originalBodyText).slice(0, 20).join('')}...`;
}

function displayDateFromTimestamp(createdAt: HomeWorryFeedTimestamp | null | undefined, options?: DisplayDateOptions): DisplayDate {
  return formatDisplayDate(createdAt, options);
}

function resolveSubmitDisabledReason(params: {
  readonly validation: ContentValidationResult;
  readonly moderation: ScreenModerationState;
  readonly isProcessing: boolean;
}): SubmitDisabledReason | undefined {
  if (params.isProcessing) return 'processing';
  if (params.moderation.status === 'checking') return 'moderation-pending';
  if (params.validation.status === 'valid') return undefined;
  if (params.validation.code === 'empty') return 'empty';
  if (params.validation.code === 'too_long') return 'too-long';
  return 'invalid';
}

function firstValidCategory(categories: readonly string[] | undefined, fallbackCategory: string | undefined): WorryCategory {
  return normalizeWorryCategories([
    ...(categories ?? []),
    fallbackCategory,
  ])[0] ?? DEFAULT_WORRY_CATEGORY;
}
