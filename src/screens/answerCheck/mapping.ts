import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import { formatDisplayDate } from '../shared/displayDate';
import type { MyWorryListItem, ReplyReadModelItem } from '../../services/myWorries';
import type { AnswerCheckReplyProps, AnswerCheckWorryProps } from './contract';

export function mapWorryToAnswerCheckProps(params: {
  readonly worry: MyWorryListItem;
  readonly now?: Date;
}): AnswerCheckWorryProps {
  return {
    worryId: params.worry.id,
    bodyText: params.worry.content,
    categoryLabel: firstUserFacingCategory(params.worry.categories),
    createdAtLabel: formatDisplayDate(params.worry.createdAt, { now: params.now }).label,
  };
}

export function mapReplyToAnswerCheckProps(params: {
  readonly reply: ReplyReadModelItem;
  readonly hiddenReplyIds?: ReadonlySet<string>;
  readonly processingReplyIds?: ReadonlySet<string>;
  readonly now?: Date;
}): AnswerCheckReplyProps | null {
  if (params.hiddenReplyIds?.has(params.reply.id)) return null;
  return {
    replyId: params.reply.id,
    bodyText: params.reply.content,
    createdAtLabel: formatDisplayDate(params.reply.createdAt, { now: params.now }).label,
    feedbackState: params.reply.feedback === 'helpful'
      ? 'liked'
      : params.reply.feedback === 'not_helpful'
        ? 'disliked'
        : 'none',
    canLike: params.reply.feedback !== 'not_helpful',
    canDislike: params.reply.feedback !== 'helpful',
    canComment: params.reply.feedback !== 'not_helpful',
    isFeedbackProcessing: params.processingReplyIds?.has(params.reply.id) ?? false,
    isCommentProcessing: params.processingReplyIds?.has(params.reply.id) ?? false,
  };
}

export function mapRepliesToAnswerCheckProps(params: {
  readonly replies: readonly ReplyReadModelItem[];
  readonly hiddenReplyIds?: ReadonlySet<string>;
  readonly processingReplyIds?: ReadonlySet<string>;
  readonly now?: Date;
}): AnswerCheckReplyProps[] {
  return params.replies.flatMap(reply => {
    const mapped = mapReplyToAnswerCheckProps({
      reply,
      hiddenReplyIds: params.hiddenReplyIds,
      processingReplyIds: params.processingReplyIds,
      now: params.now,
    });
    return mapped ? [mapped] : [];
  });
}

function firstUserFacingCategory(categories: readonly string[]): string {
  return categories.find((category): category is (typeof WORRY_CATEGORIES)[number] => (
    (WORRY_CATEGORIES as readonly string[]).includes(category)
  )) ?? '잡담';
}
