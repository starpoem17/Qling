import { useState, type Dispatch, type SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { publishReplyViaApi } from '../../services/replyPublication/apiClient';
import {
  backRouteFromWriteReply,
  resolveAppRouteState,
  type AppRouteViewState,
} from '../../services/appShell/prdNavigationPolicy';
import {
  clearStoredDraft,
  getStoredDraft,
  replyDraftKey,
  setStoredDraft,
} from '../../services/drafts/contentDrafts';
import { CONTENT_MAX_LENGTH, validateDraftContent } from '../../services/validation/content';
import type { SelectedReceivedWorry } from '../receivedWorries/ReceivedWorriesContainer';
import type { ScreenModerationState } from '../shared/contract';
import { resolveReplyPublicationResult } from './containerPolicy';
import { buildWriteDraftContract, mapSelectedWorryToOriginalWorrySummary } from './mapping';
import { WriteFormScreen } from './WriteFormScreen';

export type WriteReplyContainerProps = {
  readonly user: User | null;
  readonly selectedWorry: SelectedReceivedWorry;
  readonly setView: Dispatch<SetStateAction<AppRouteViewState>>;
  readonly clearSelectedWorry: () => void;
  readonly clearSelectedReply: () => void;
  readonly setFilterAlert: (message: string) => void;
};

export function WriteReplyContainer(props: WriteReplyContainerProps) {
  const [draft, setDraft] = useState(() => getStoredDraft(
    props.selectedWorry.deliveryId ? replyDraftKey(props.selectedWorry.deliveryId) : undefined,
  ));
  const [isProcessing, setIsProcessing] = useState(false);
  const [moderation, setModeration] = useState<ScreenModerationState>({ status: 'idle' });
  const [isOriginalOverlayOpen, setIsOriginalOverlayOpen] = useState(false);
  const originalWorry = mapSelectedWorryToOriginalWorrySummary(props.selectedWorry);
  const validation = validateDraftContent(draft, 'reply');

  if (!originalWorry) {
    return (
      <div>
        <button
          onClick={() => props.setView(backRouteFromWriteReply())}
          className="mb-6 flex items-center gap-2 text-[#8B8B6B] hover:text-[#5A5A40] transition-colors"
        >
          돌아가기
        </button>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-700">
          이전 형식의 고민에는 새 답장을 보낼 수 없습니다.
        </div>
      </div>
    );
  }

  const publish = async (target: { readonly deliveryId: string; readonly worryId: string }) => {
    if (isProcessing) return;
    const currentValidation = validateDraftContent(draft, 'reply');
    if (currentValidation.status !== 'valid') {
      setModeration({ status: 'failed', message: currentValidation.message });
      return;
    }
    if (!props.user) return;
    if (!target.deliveryId) {
      const message = '이전 형식의 고민에는 새 답장을 보낼 수 없습니다.';
      setModeration({ status: 'failed', message });
      props.setFilterAlert(message);
      return;
    }

    setIsProcessing(true);
    setModeration({ status: 'checking' });
    try {
      const result = await publishReplyViaApi({
        user: props.user,
        deliveryId: target.deliveryId,
        content: currentValidation.content,
      });
      const policy = resolveReplyPublicationResult(result, target);

      setModeration(policy.moderation);
      if (policy.alertMessage) props.setFilterAlert(policy.alertMessage);
      if (!policy.clearDraft || !policy.route) {
        return;
      }

      props.setView(prev => resolveAppRouteState(prev, policy.route));
      clearStoredDraft(replyDraftKey(target.deliveryId));
      setDraft('');
      props.clearSelectedWorry();
      props.clearSelectedReply();
    } catch (e) {
      console.error(e);
      setModeration({ status: 'failed', message: '답장 전송 실패' });
      props.setFilterAlert('답장 전송 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  const backToReceivedWorries = () => {
    clearStoredDraft(replyDraftKey(originalWorry.deliveryId));
    setDraft('');
    props.clearSelectedWorry();
    props.clearSelectedReply();
    props.setView(backRouteFromWriteReply());
  };

  return (
    <div>
      <WriteFormScreen
        kind="write-reply"
        originalWorry={originalWorry}
        draft={buildWriteDraftContract({
          value: draft,
          maxLength: CONTENT_MAX_LENGTH,
          validation,
          moderation,
          isProcessing,
        })}
        isOriginalOverlayOpen={isOriginalOverlayOpen}
        onBack={backToReceivedWorries}
        onDraftChange={value => {
          setDraft(value);
          setStoredDraft(replyDraftKey(originalWorry.deliveryId), value);
          setModeration({ status: 'idle' });
        }}
        onOpenOriginal={() => setIsOriginalOverlayOpen(true)}
        onCloseOriginal={() => setIsOriginalOverlayOpen(false)}
        onPublish={publish}
      />
    </div>
  );
}
