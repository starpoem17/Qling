import { useState, type Dispatch, type SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { publishWorryViaApi } from '../../services/worryPublication/apiClient';
import {
  backRouteFromWriteWorry,
  resolveAppRouteState,
  type AppRouteViewState,
} from '../../services/appShell/prdNavigationPolicy';
import {
  clearStoredDraft,
  getStoredDraft,
  setStoredDraft,
  WRITE_WORRY_DRAFT_KEY,
} from '../../services/drafts/contentDrafts';
import { CONTENT_MAX_LENGTH, validateDraftContent } from '../../services/validation/content';
import type { ScreenModerationState } from '../shared/contract';
import { resolveWorryPublicationResult } from './containerPolicy';
import { buildWriteDraftContract } from './mapping';
import { WriteWorryScreen } from './WriteWorryScreen';

export type WriteWorryContainerProps = {
  readonly user: User | null;
  readonly profile: { readonly uid: string } | null;
  readonly setView: Dispatch<SetStateAction<AppRouteViewState>>;
  readonly clearSelectedMyWorry: () => void;
  readonly setFilterAlert: (message: string) => void;
};

export function WriteWorryContainer(props: WriteWorryContainerProps) {
  const [draft, setDraft] = useState(() => getStoredDraft(WRITE_WORRY_DRAFT_KEY));
  const [isProcessing, setIsProcessing] = useState(false);
  const [moderation, setModeration] = useState<ScreenModerationState>({ status: 'idle' });
  const validation = validateDraftContent(draft, 'worry');

  const publish = async () => {
    if (isProcessing) return;
    const currentValidation = validateDraftContent(draft, 'worry');
    if (currentValidation.status !== 'valid') {
      setModeration({ status: 'failed', message: currentValidation.message });
      return;
    }
    if (!props.user || !props.profile) {
      props.setFilterAlert('로그인 정보가 없습니다.');
      setModeration({ status: 'failed', message: '로그인 정보가 없습니다.' });
      return;
    }

    setIsProcessing(true);
    setModeration({ status: 'checking' });
    try {
      const result = await publishWorryViaApi({
        user: props.user,
        content: currentValidation.content,
      });
      const policy = resolveWorryPublicationResult(result);

      setModeration(policy.moderation);
      if (policy.alertMessage) props.setFilterAlert(policy.alertMessage);
      if (!policy.clearDraft || !policy.route) {
        return;
      }

      if (result.status === 'published' && result.warnings.length > 0) {
        console.warn('Worry publication completed with warnings:', result.warnings);
      }

      setDraft('');
      clearStoredDraft(WRITE_WORRY_DRAFT_KEY);
      props.clearSelectedMyWorry();
      props.setView(prev => resolveAppRouteState(prev, policy.route));
      window.scrollTo(0, 0);
    } catch (e) {
      const message = `전송 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`;
      console.error('Publication Error:', e);
      setModeration({ status: 'failed', message });
      props.setFilterAlert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <WriteWorryScreen
      draft={buildWriteDraftContract({
        value: draft,
        maxLength: CONTENT_MAX_LENGTH,
        validation,
        moderation,
        isProcessing,
      })}
      onBack={() => props.setView(backRouteFromWriteWorry())}
      onDraftChange={value => {
        setDraft(value);
        setStoredDraft(WRITE_WORRY_DRAFT_KEY, value);
        setModeration({ status: 'idle' });
      }}
      onPublish={publish}
    />
  );
}
