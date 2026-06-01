import {
  WORRY_MODERATION_MODEL,
  WORRY_MODERATION_PROVIDER,
} from './moderation';
import { serverTimestamp } from './firestoreRepository';
import type {
  SummaryFailureLogWriteModel,
  WorrySummaryProvider,
} from './types';

const SUMMARY_MAX_LENGTH = 20;
const LOG_RESPONSE_MAX_LENGTH = 1000;

export type WorrySummaryResult =
  | {
      summaryText: string;
      summaryStatus: 'original' | 'llm_generated';
      summaryGeneratedBy: 'none' | 'llm';
      failureLog?: undefined;
    }
  | {
      summaryText: string;
      summaryStatus: 'fallback_truncated';
      summaryGeneratedBy: 'none';
      failureLog: SummaryFailureLogWriteModel;
    };

function textLength(value: string): number {
  return Array.from(value).length;
}

function fallbackSummary(content: string): string {
  return `${Array.from(content).slice(0, SUMMARY_MAX_LENGTH).join('')}...`;
}

function responseText(value: unknown): string | null {
  if (typeof value === 'string') return value.slice(0, LOG_RESPONSE_MAX_LENGTH);
  if (value === null || value === undefined) return null;

  try {
    return JSON.stringify(value).slice(0, LOG_RESPONSE_MAX_LENGTH);
  } catch {
    return String(value).slice(0, LOG_RESPONSE_MAX_LENGTH);
  }
}

function normalizeSummary(raw: unknown): string | null {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
  }

  if (raw && typeof raw === 'object') {
    const summaryText = (raw as { summaryText?: unknown }).summaryText;
    if (typeof summaryText === 'string') {
      const trimmed = summaryText.trim();
      return trimmed ? trimmed : null;
    }
  }

  return null;
}

function buildFailureLog(params: {
  id: string;
  worryId: string;
  attemptCount: number;
  failureReason: string;
  firstResponse: unknown | null;
  retryResponse: unknown | null;
}): SummaryFailureLogWriteModel {
  return {
    id: params.id,
    worryId: params.worryId,
    status: 'failed',
    attemptCount: params.attemptCount,
    failureReason: params.failureReason,
    firstResponseText: responseText(params.firstResponse),
    retryResponseText: responseText(params.retryResponse),
    provider: WORRY_MODERATION_PROVIDER,
    model: WORRY_MODERATION_MODEL,
    createdAt: serverTimestamp(),
  };
}

export async function createWorrySummary(params: {
  content: string;
  worryId: string;
  failureLogId: string;
  provider?: WorrySummaryProvider;
}): Promise<WorrySummaryResult> {
  if (textLength(params.content) <= SUMMARY_MAX_LENGTH) {
    return {
      summaryText: params.content,
      summaryStatus: 'original',
      summaryGeneratedBy: 'none',
    };
  }

  if (!params.provider) {
    return {
      summaryText: fallbackSummary(params.content),
      summaryStatus: 'fallback_truncated',
      summaryGeneratedBy: 'none',
      failureLog: buildFailureLog({
        id: params.failureLogId,
        worryId: params.worryId,
        attemptCount: 0,
        failureReason: 'summary_provider_missing',
        firstResponse: null,
        retryResponse: null,
      }),
    };
  }

  let firstResponse: unknown | null = null;
  let retryResponse: unknown | null = null;
  let attemptCount = 0;

  try {
    attemptCount += 1;
    firstResponse = await params.provider(params.content);
    const firstSummary = normalizeSummary(firstResponse);
    if (firstSummary && textLength(firstSummary) <= SUMMARY_MAX_LENGTH) {
      return {
        summaryText: firstSummary,
        summaryStatus: 'llm_generated',
        summaryGeneratedBy: 'llm',
      };
    }

    attemptCount += 1;
    retryResponse = await params.provider(params.content, true);
    const retrySummary = normalizeSummary(retryResponse);
    if (retrySummary && textLength(retrySummary) <= SUMMARY_MAX_LENGTH) {
      return {
        summaryText: retrySummary,
        summaryStatus: 'llm_generated',
        summaryGeneratedBy: 'llm',
      };
    }

    return {
      summaryText: fallbackSummary(params.content),
      summaryStatus: 'fallback_truncated',
      summaryGeneratedBy: 'none',
      failureLog: buildFailureLog({
        id: params.failureLogId,
        worryId: params.worryId,
        attemptCount: 2,
        failureReason: 'summary_too_long_or_invalid',
        firstResponse,
        retryResponse,
      }),
    };
  } catch (error) {
    return {
      summaryText: fallbackSummary(params.content),
      summaryStatus: 'fallback_truncated',
      summaryGeneratedBy: 'none',
      failureLog: buildFailureLog({
        id: params.failureLogId,
        worryId: params.worryId,
        attemptCount,
        failureReason: error instanceof Error ? error.message : String(error),
        firstResponse,
        retryResponse,
      }),
    };
  }
}
