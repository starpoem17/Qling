import type { WorryCategory } from '@midnight-radio/domain';
import type { FieldValidationMessages, ScreenAsyncState } from '../shared/contract';

export const HELPED_COUNT_LABEL = '받은 하트' as const;

export type MyPageProfileSummaryProps = {
  readonly nickname: string;
  readonly helpedCount: number;
  readonly helpedCountLabel: typeof HELPED_COUNT_LABEL;
  readonly profileMotif: {
    readonly kind: 'visual-only';
    readonly label: string;
  };
};

export const MY_PAGE_POLICY_SETTING_ITEMS = ['privacy_policy'] as const;

export const MY_PAGE_SETTING_ITEMS = [
  'push_notifications',
  'privacy_policy',
  'logout',
  'delete_account',
] as const;

export type MyPageSettingItem = (typeof MY_PAGE_SETTING_ITEMS)[number];
export type MyPagePolicySettingItem = (typeof MY_PAGE_POLICY_SETTING_ITEMS)[number];

export const PUSH_PERMISSION_STATUSES = [
  'default',
  'granted',
  'denied',
  'unsupported',
  'registered',
  'error',
] as const;

export type PushPermissionStatus = (typeof PUSH_PERMISSION_STATUSES)[number];

export type PushSettingsAccessProps = {
  readonly status: PushPermissionStatus;
  readonly enabled: boolean;
  readonly message?: string;
  readonly onToggle: (enabled: boolean) => void | Promise<void>;
};

export type ConfirmationProps = {
  readonly isOpen: boolean;
  readonly isProcessing: boolean;
  readonly errorMessage?: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export type PolicyScreenProps = {
  readonly policy: MyPagePolicySettingItem;
  readonly title: string;
  readonly body?: string;
  readonly state: ScreenAsyncState;
};

export type EditInterestsProps = {
  readonly categoryOptions: readonly WorryCategory[];
  readonly selectedInterests: readonly WorryCategory[];
  readonly validationMessages: FieldValidationMessages<'interests'>;
  readonly isProcessing: boolean;
  readonly onBack: () => void;
  readonly onInterestToggle: (value: WorryCategory) => void;
  readonly onSubmit: () => void;
};

export type MyPageScreenProps = {
  readonly profile: MyPageProfileSummaryProps;
  readonly answerPreviewItems: readonly MyAnswerListItemProps[];
  readonly settings: readonly MyPageSettingItem[];
  readonly pushSettings: PushSettingsAccessProps;
  readonly logoutConfirmation: ConfirmationProps;
  readonly accountDeletionConfirmation: ConfirmationProps;
  readonly onEditInterests: () => void;
  readonly onOpenMyAnswers: () => void;
  readonly onSettingSelect: (item: MyPageSettingItem) => void;
};

export type MyAnswerListItemProps = {
  readonly replyId: string;
  readonly deliveryId?: string;
  readonly worryId?: string;
  readonly previewText: string;
  readonly originalWorryPreview: string;
  readonly categoryLabel?: string;
  readonly dateLabel?: string;
  readonly feedbackLabel?: string;
  readonly feedbackComment?: string;
  readonly hasReceivedHeart: boolean;
  readonly isUnread?: boolean;
  readonly accessibilityLabel: string;
};

export type MyAnswersScreenProps = {
  readonly state: ScreenAsyncState;
  readonly items: readonly MyAnswerListItemProps[];
  readonly onBack: () => void;
};

export type MyWorryListItemProps = {
  readonly worryId: string;
  readonly summaryText: string;
  readonly categoryLabel: string;
  readonly createdAtLabel?: string;
  readonly replyCountLabel: string;
  readonly hasUnreadReplies: boolean;
  readonly accessibilityLabel: string;
};

export type MyWorriesScreenProps = {
  readonly state: ScreenAsyncState;
  readonly items: readonly MyWorryListItemProps[];
  readonly onWriteWorry: () => void;
  readonly onOpenMyPage: () => void;
  readonly onSelectWorryForAnswers: (item: MyWorryListItemProps) => void;
};
