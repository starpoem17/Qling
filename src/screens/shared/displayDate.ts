import type { DisplayDate } from './contract';

type TimestampLike = {
  readonly toMillis?: () => number;
};

export type DisplayDateInput = TimestampLike | Date | number | string | null | undefined;

export type DisplayDateOptions = {
  readonly now?: Date | number;
  readonly fallbackLabel?: string;
  readonly timeZone?: string;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

function millisFromInput(input: DisplayDateInput): number | undefined {
  if (typeof input === 'number') return Number.isFinite(input) ? input : undefined;
  if (typeof input === 'string') {
    const parsed = Date.parse(input);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (input instanceof Date) {
    const millis = input.getTime();
    return Number.isNaN(millis) ? undefined : millis;
  }
  const millis = input?.toMillis?.();
  return typeof millis === 'number' && Number.isFinite(millis) ? millis : undefined;
}

function localDateKey(date: Date, timeZone?: string): string {
  if (!timeZone) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const valueByType = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${valueByType.year}-${valueByType.month}-${valueByType.day}`;
}

export function formatLocalDisplayDate(
  input: DisplayDateInput,
  options: DisplayDateOptions = {},
): DisplayDate {
  const millis = millisFromInput(input);
  if (millis === undefined) {
    return { label: options.fallbackLabel ?? '' };
  }

  const now = typeof options.now === 'number' ? new Date(options.now) : options.now ?? new Date();
  const nowMillis = now.getTime();
  const elapsed = Math.max(0, nowMillis - millis);
  const date = new Date(millis);
  const dateKey = localDateKey(date, options.timeZone);
  const nowDateKey = localDateKey(now, options.timeZone);

  if (dateKey !== nowDateKey) {
    return { label: dateKey, isoValue: date.toISOString() };
  }

  if (elapsed < MINUTE_MS) {
    return { label: '방금 전', isoValue: date.toISOString() };
  }

  if (elapsed < HOUR_MS) {
    return { label: `${Math.floor(elapsed / MINUTE_MS)}분 전`, isoValue: date.toISOString() };
  }

  return { label: `${Math.floor(elapsed / HOUR_MS)}시간 전`, isoValue: date.toISOString() };
}
