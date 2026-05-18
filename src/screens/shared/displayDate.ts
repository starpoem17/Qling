import type { DisplayDate } from './contract';

export type DisplayDateInput =
  | Date
  | number
  | { readonly toMillis?: () => number }
  | null
  | undefined;

export type DisplayDateOptions = {
  readonly now?: Date | number;
  readonly missingLabel?: string;
};

function millisFromInput(value: DisplayDateInput): number | undefined {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  const millis = value?.toMillis?.();
  return typeof millis === 'number' ? millis : undefined;
}

function isSameLocalDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(value: DisplayDateInput, options: DisplayDateOptions = {}): DisplayDate {
  const millis = millisFromInput(value);
  if (typeof millis !== 'number' || Number.isNaN(millis)) {
    return { label: options.missingLabel ?? '수신됨' };
  }

  const date = new Date(millis);
  const nowMillis = options.now instanceof Date ? options.now.getTime() : options.now ?? Date.now();
  const now = new Date(nowMillis);

  if (!isSameLocalDate(date, now)) {
    return { label: formatLocalDate(date), isoValue: date.toISOString() };
  }

  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
  if (elapsedMinutes < 1) {
    return { label: '방금 전', isoValue: date.toISOString() };
  }
  if (elapsedMinutes < 60) {
    return { label: `${elapsedMinutes}분 전`, isoValue: date.toISOString() };
  }

  return { label: `${Math.floor(elapsedMinutes / 60)}시간 전`, isoValue: date.toISOString() };
}
