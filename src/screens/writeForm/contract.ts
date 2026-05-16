import type { WorryCategory } from '@midnight-radio/domain';
import type {
  DisplayDate,
  ScreenModerationState,
  ScreenValidationState,
  SubmitDisabledReason,
} from '../shared/contract';

export type WriteDraftContract = {
  readonly value: string;
  readonly characterCount: number;
  readonly maxLength: number;
  readonly validation: ScreenValidationState;
  readonly moderation: ScreenModerationState;
  readonly errorMessage?: string;
  readonly isProcessing: boolean;
  readonly submitDisabledReason?: SubmitDisabledReason;
};

export type WriteWorryFormProps = {
  readonly kind: 'write-worry';
  readonly draft: WriteDraftContract;
  readonly category?: WorryCategory;
  readonly onDraftChange: (value: string) => void;
  readonly onCategoryChange?: (value: WorryCategory) => void;
  readonly onPublish: () => void;
};

export type OriginalWorrySummaryProps = {
  readonly deliveryId: string;
  readonly worryId: string;
  readonly category: WorryCategory;
  readonly bodyText: string;
  readonly receivedAt?: DisplayDate;
};

export type WriteReplyFormProps = {
  readonly kind: 'write-reply';
  readonly originalWorry: OriginalWorrySummaryProps;
  readonly draft: WriteDraftContract;
  readonly onDraftChange: (value: string) => void;
  readonly onPublish: (target: { readonly deliveryId: string; readonly worryId: string }) => void;
};

export type WriteFormScreenProps = WriteWorryFormProps | WriteReplyFormProps;
