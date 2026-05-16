import type { WorryCategory } from '@midnight-radio/domain';

export type ScreenValidationState =
  | { readonly status: 'valid'; readonly message?: string }
  | { readonly status: 'invalid'; readonly message: string };

export type ScreenModerationState =
  | { readonly status: 'idle' }
  | { readonly status: 'checking' }
  | { readonly status: 'approved' }
  | { readonly status: 'rejected'; readonly reason: string; readonly helpMessage?: string }
  | { readonly status: 'failed'; readonly message: string };

export type ScreenAsyncState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly label: string }
  | { readonly status: 'error'; readonly message: string; readonly canRetry: boolean }
  | { readonly status: 'empty'; readonly message: string }
  | { readonly status: 'ready' };

export type DisplayDate = {
  readonly label: string;
  readonly isoValue?: string;
};

export type CategoryOption = {
  readonly value: WorryCategory;
  readonly label: WorryCategory;
};

export type FieldValidationMessages<TField extends string> = Partial<Record<TField, string>>;

export type SubmitDisabledReason =
  | 'empty'
  | 'invalid'
  | 'too-long'
  | 'moderation-pending'
  | 'processing'
  | 'missing-required-field'
  | 'unavailable';

export type ProcessingState = {
  readonly isProcessing: boolean;
  readonly disabled: boolean;
  readonly disabledReason?: SubmitDisabledReason;
};
