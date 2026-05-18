export type AnswerFeedbackState = 'none' | 'liked' | 'disliked';

export type AnswerCheckScreenState =
  | { readonly status: 'loading'; readonly label: string }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready' };

export type AnswerCheckWorryProps = {
  readonly worryId: string;
  readonly bodyText: string;
  readonly categoryLabel: string;
  readonly createdAtLabel: string;
};

export type AnswerCheckReplyProps = {
  readonly replyId: string;
  readonly bodyText: string;
  readonly createdAtLabel?: string;
  readonly feedbackState: AnswerFeedbackState;
  readonly canLike: boolean;
  readonly canDislike: boolean;
  readonly canComment: boolean;
  readonly isFeedbackProcessing: boolean;
  readonly isCommentProcessing: boolean;
};

export type AnswerCheckCommentDialogProps = {
  readonly replyId: string;
  readonly feedbackState: Extract<AnswerFeedbackState, 'liked' | 'disliked'>;
  readonly draft: string;
  readonly maxLength: number;
  readonly validationMessage?: string;
  readonly moderationMessage?: string;
};

export type AnswerCheckScreenProps = {
  readonly state: AnswerCheckScreenState;
  readonly worry: AnswerCheckWorryProps | null;
  readonly replies: readonly AnswerCheckReplyProps[];
  readonly commentDialog: AnswerCheckCommentDialogProps | null;
  readonly onBack: () => void;
  readonly onLike: (replyId: string) => void;
  readonly onDislike: (replyId: string) => void;
  readonly onOpenComment: (replyId: string) => void;
  readonly onCommentChange: (value: string) => void;
  readonly onCommentSubmit: () => void;
  readonly onCommentClose: () => void;
};
