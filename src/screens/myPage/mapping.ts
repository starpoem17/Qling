import { WORRY_CATEGORIES, type WorryCategory } from '@midnight-radio/domain';
import type {
  MyAnswerListItemProps,
  MyPageProfileSummaryProps,
  MyWorryListItemProps,
  PushPermissionStatus,
} from './contract';
import { HELPED_COUNT_LABEL } from './contract';
import type { MyWorryListItem, ReplyReadModelItem } from '../../services/myWorries';
import { formatDisplayDate, type DisplayDateOptions } from '../shared/displayDate';

export type MyPageProfileInput = {
  readonly nickname?: string;
  readonly interests?: readonly string[];
  readonly age?: number;
  readonly helpedCount?: number;
};

export function mapProfileToMyPageSummary(profile: MyPageProfileInput | null): MyPageProfileSummaryProps {
  return {
    nickname: profile?.nickname?.trim() || '나',
    interests: (profile?.interests ?? []) as readonly WorryCategory[],
    ageLabel: typeof profile?.age === 'number' ? `${profile.age}세` : undefined,
    helpedCount: Math.max(0, profile?.helpedCount ?? 0),
    helpedCountLabel: HELPED_COUNT_LABEL,
    profileMotif: {
      kind: 'visual-only',
      label: 'Profile motif',
    },
  };
}

export function mapPushStatus(params: {
  readonly permission?: NotificationPermission | 'unsupported';
  readonly registrationStatus?: string;
}): { status: PushPermissionStatus; message?: string } {
  if (params.permission === 'unsupported') return { status: 'unsupported', message: '이 브라우저는 알림을 지원하지 않습니다.' };
  if (params.registrationStatus === 'registered') return { status: 'registered', message: '알림 등록이 완료되었습니다.' };
  if (params.registrationStatus === 'error') return { status: 'error', message: '알림 등록에 실패했습니다.' };
  if (params.permission === 'granted') return { status: 'granted', message: '알림 권한이 허용되었습니다.' };
  if (params.permission === 'denied') return { status: 'denied', message: '브라우저 설정에서 알림 권한을 허용해 주세요.' };
  return { status: 'default', message: '알림 권한 설정이 필요합니다.' };
}

function dateLabel(value: { toMillis?: () => number } | null | undefined, options?: DisplayDateOptions): string | undefined {
  if (!value?.toMillis) return undefined;
  return formatDisplayDate(value, options).label;
}

export function mapMyGivenReplyToListItem(reply: ReplyReadModelItem, selectedReplyId?: string, options?: DisplayDateOptions): MyAnswerListItemProps {
  const feedbackLabel = reply.feedback === 'helpful' ? '받은 하트' : reply.feedback === 'not_helpful' ? '확인됨' : undefined;
  const isSelected = reply.id === selectedReplyId;
  const originalWorryPreview = reply.replyToContent ?? reply.originalContent;

  return {
    replyId: reply.id,
    deliveryId: reply.deliveryId,
    worryId: reply.worryId,
    previewText: reply.refinedContent,
    originalWorryPreview,
    dateLabel: dateLabel(reply.createdAt, options),
    feedbackLabel,
    hasReceivedHeart: reply.feedback === 'helpful',
    isUnread: reply.hasUnread,
    isSelected,
    accessibilityLabel: [
      '내가 쓴 답변',
      originalWorryPreview ? `원래 고민 ${originalWorryPreview}` : undefined,
      feedbackLabel ? `피드백 ${feedbackLabel}` : '피드백 없음',
      isSelected ? '현재 선택됨' : '선택되지 않음',
    ].filter(Boolean).join(', '),
  };
}

export function mapMyWorryToListItem(params: {
  readonly worry: MyWorryListItem;
  readonly options?: DisplayDateOptions;
}): MyWorryListItemProps {
  const replyCount = params.worry.humanReplyCount ?? 0;
  const categoryLabel = firstUserFacingCategory(params.worry.categories);
  const summaryText = fallbackSummary(params.worry.content);
  const createdAtLabel = dateLabel(params.worry.createdAt, params.options);
  const replyCountLabel = replyCountLabelForCount(replyCount);

  return {
    worryId: params.worry.id,
    summaryText,
    categoryLabel,
    createdAtLabel,
    replyCountLabel,
    hasUnreadReplies: params.worry.hasUnreadReplies,
    accessibilityLabel: [
      '답변 확인으로 이동',
      `카테고리 ${categoryLabel}`,
      createdAtLabel ? `작성일 ${createdAtLabel}` : undefined,
      replyCountLabel,
      params.worry.hasUnreadReplies ? '읽지 않은 답장 있음' : '읽지 않은 답장 없음',
    ].filter(Boolean).join(', '),
  };
}

export function replyCountLabelForCount(replyCount: number): string {
  return replyCount <= 0 ? '아직 답변이 없어요.' : `${replyCount}명이 답변했어요`;
}

function firstUserFacingCategory(categories: readonly string[]): WorryCategory {
  const firstValid = categories.find((category): category is WorryCategory => WORRY_CATEGORIES.includes(category as WorryCategory));
  return firstValid ?? '잡담';
}

function fallbackSummary(content: string): string {
  return `${Array.from(content).slice(0, 20).join('')}...`;
}
