import { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { CONTENT_MAX_LENGTH, validateDraftContent } from '../../services/validation/content';
import { submitReplyFeedbackWithProductionAdapters } from '../../services/replyFeedback/production';
import {
  backRouteForRoute,
  type AppRouteState,
  type AppRouteViewState,
} from '../../services/appShell/prdNavigationPolicy';
import { useMyWorries, useRepliesForWorry } from '../../services/myWorries';
import { AnswerCheckScreen } from './AnswerCheckScreen';
import type { AnswerCheckCommentDialogProps } from './contract';
import { mapRepliesToAnswerCheckProps, mapWorryToAnswerCheckProps } from './mapping';

export type AnswerCheckContainerProps = {
  readonly user: User | null;
  readonly route: AppRouteState;
  readonly setView: (view: AppRouteViewState) => void;
  readonly setFilterAlert: (message: string) => void;
};

type CommentDialogState = Pick<AnswerCheckCommentDialogProps, 'replyId' | 'feedbackState'> & {
  readonly draft: string;
  readonly moderationMessage?: string;
};

export function AnswerCheckContainer(props: AnswerCheckContainerProps) {
  const worryId = props.route.route === 'answer_check' ? props.route.worryId : null;
  const { myWorries, isLoadingMyWorries, myWorriesError } = useMyWorries({ user: props.user });
  const { repliesForWorry, isLoadingRepliesForWorry, repliesForWorryError } = useRepliesForWorry({
    user: props.user,
    worryId,
  });
  const [hiddenReplyIds, setHiddenReplyIds] = useState<ReadonlySet<string>>(() => new Set());
  const [processingReplyIds, setProcessingReplyIds] = useState<ReadonlySet<string>>(() => new Set());
  const [localFeedbackByReplyId, setLocalFeedbackByReplyId] = useState(new Map<string, 'helpful' | 'not_helpful'>());
  const [commentDialog, setCommentDialog] = useState<CommentDialogState | null>(null);

  const worry = useMemo(
    () => myWorries.find(item => item.id === worryId) ?? null,
    [myWorries, worryId],
  );
  const replies = useMemo(
    () => repliesForWorry.map(reply => ({
      ...reply,
      feedback: localFeedbackByReplyId.get(reply.id) ?? reply.feedback,
    })),
    [localFeedbackByReplyId, repliesForWorry],
  );

  const submitFeedback = async (replyId: string, feedbackType: 'helpful' | 'not_helpful', comment?: string) => {
    const reply = replies.find(item => item.id === replyId);
    if (!reply) return null;
    setProcessingReplyIds(prev => new Set(prev).add(replyId));
    try {
      const result = await submitReplyFeedbackWithProductionAdapters({ reply, feedbackType, comment });
      if (result.status === 'rejected') {
        const message = result.helpMessage ? `${result.userMessage ?? result.reason}\n\n${result.helpMessage}` : result.userMessage ?? result.reason ?? '코멘트를 전송할 수 없습니다.';
        setCommentDialog(prev => prev && prev.replyId === replyId ? { ...prev, moderationMessage: message } : prev);
        props.setFilterAlert(message);
        return result;
      }
      setLocalFeedbackByReplyId(prev => new Map(prev).set(replyId, feedbackType));
      return result;
    } catch (error) {
      console.error(error);
      props.setFilterAlert('전송 실패');
      return null;
    } finally {
      setProcessingReplyIds(prev => {
        const next = new Set(prev);
        next.delete(replyId);
        return next;
      });
    }
  };

  const openComment = (replyId: string) => {
    const reply = replies.find(item => item.id === replyId);
    const feedback = localFeedbackByReplyId.get(replyId) ?? reply?.feedback;
    if (feedback !== 'helpful' && feedback !== 'not_helpful') return;
    setCommentDialog({
      replyId,
      feedbackState: feedback === 'helpful' ? 'liked' : 'disliked',
      draft: '',
    });
  };

  const closeComment = () => {
    setCommentDialog(prev => {
      if (prev?.feedbackState === 'disliked') {
        setHiddenReplyIds(current => new Set(current).add(prev.replyId));
      }
      return null;
    });
  };

  const validation = commentDialog
    ? validateDraftContent(commentDialog.draft, 'feedback_comment')
    : null;

  return (
    <AnswerCheckScreen
      state={myWorriesError || repliesForWorryError
        ? { status: 'error', message: myWorriesError ?? repliesForWorryError ?? '답변을 불러오지 못했습니다.' }
        : isLoadingMyWorries || isLoadingRepliesForWorry
          ? { status: 'loading', label: '답변을 불러오고 있습니다.' }
          : { status: 'ready' }}
      worry={worry ? mapWorryToAnswerCheckProps({ worry }) : null}
      replies={mapRepliesToAnswerCheckProps({ replies, hiddenReplyIds, processingReplyIds })}
      commentDialog={commentDialog ? {
        replyId: commentDialog.replyId,
        feedbackState: commentDialog.feedbackState,
        draft: commentDialog.draft,
        maxLength: CONTENT_MAX_LENGTH,
        validationMessage: validation?.status === 'validation_error' ? validation.message : undefined,
        moderationMessage: commentDialog.moderationMessage,
      } : null}
      onBack={() => props.setView(backRouteForRoute({ route: 'answer_check', worryId: worryId ?? '' }))}
      onLike={async replyId => {
        const result = await submitFeedback(replyId, 'helpful');
        if (result?.status === 'saved') openComment(replyId);
      }}
      onDislike={async replyId => {
        const result = await submitFeedback(replyId, 'not_helpful');
        if (result?.status === 'saved') openComment(replyId);
      }}
      onOpenComment={openComment}
      onCommentChange={value => setCommentDialog(prev => prev ? { ...prev, draft: value, moderationMessage: undefined } : prev)}
      onCommentSubmit={async () => {
        if (!commentDialog || validation?.status !== 'valid') return;
        const result = await submitFeedback(
          commentDialog.replyId,
          commentDialog.feedbackState === 'liked' ? 'helpful' : 'not_helpful',
          commentDialog.draft,
        );
        if (result?.status === 'saved') closeComment();
      }}
      onCommentClose={closeComment}
    />
  );
}
