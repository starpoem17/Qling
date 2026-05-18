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

export type WriteWorryScreenProps = {
  readonly draft: WriteDraftContract;
  readonly onBack: () => void;
  readonly onDraftChange: (value: string) => void;
  readonly onPublish: () => void;
};

export type WriteWorryFormProps = WriteWorryScreenProps & {
  readonly kind: 'write-worry';
  readonly category?: WorryCategory;
  readonly onCategoryChange?: (value: WorryCategory) => void;
};

export type WriteWorrySuccessScreenProps = {
  readonly onConfirm: () => void;
};

export type OriginalWorrySummaryProps = {
  readonly deliveryId: string;
  readonly worryId: string;
  readonly category: WorryCategory;
  readonly summaryText: string;
  readonly originalBodyText: string;
  readonly receivedAt?: DisplayDate;
};

export type WriteReplyFormProps = {
  readonly kind: 'write-reply';
  readonly originalWorry: OriginalWorrySummaryProps;
  readonly draft: WriteDraftContract;
  readonly isOriginalOverlayOpen: boolean;
  readonly onBack: () => void;
  readonly onDraftChange: (value: string) => void;
  readonly onOpenOriginal: () => void;
  readonly onCloseOriginal: () => void;
  readonly onPublish: (target: { readonly deliveryId: string; readonly worryId: string }) => void;
};

export type WriteReplySuccessScreenProps = {
  readonly onConfirm: () => void;
};

export type WriteFormScreenProps = WriteReplyFormProps;
