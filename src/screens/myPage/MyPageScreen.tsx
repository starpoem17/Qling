import { ArrowLeft, Bell, Heart } from 'lucide-react';
import {
  CategoryChip,
  ContentSheet,
  LoadingState,
  OrangeHeaderBand,
  PolicyTextContainer,
  PrimaryCTA,
  ProfileMotif,
  QlingCard,
  QlingDialog,
  SettingsRow,
} from '../shared/ui';
import type {
  ConfirmationProps,
  EditInterestsProps,
  MyPageScreenProps,
  MyPageSettingItem,
  PolicyScreenProps,
  PushPermissionStatus,
} from './contract';

const settingLabels: Record<MyPageSettingItem, string> = {
  privacy_policy: '개인정보처리방침',
  push_notifications: '알림 설정',
  logout: '로그아웃',
  delete_account: '회원 탈퇴',
};

const settingDescriptions: Partial<Record<MyPageSettingItem, string>> = {
  privacy_policy: '개인정보 처리 기준을 확인합니다.',
  push_notifications: '새 고민과 반응 알림을 받아요.',
  logout: '현재 기기에서 로그아웃합니다.',
  delete_account: '계정과 연결된 데이터를 삭제합니다.',
};

const pushStatusLabels: Record<PushPermissionStatus, string> = {
  default: '알림 권한 설정이 필요합니다.',
  granted: '알림 권한이 허용되었습니다.',
  denied: '알림 권한이 거부되었습니다.',
  unsupported: '이 브라우저는 알림을 지원하지 않습니다.',
  registered: '알림 등록이 완료되었습니다.',
  error: '알림 등록에 실패했습니다.',
};

export function MyPageScreen(props: MyPageScreenProps) {
  const isLogoutProcessing = props.logoutConfirmation.isProcessing;
  const isAccountDeletionProcessing = props.accountDeletionConfirmation.isProcessing;

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-6">
      <OrangeHeaderBand className="-mx-[var(--qling-space-shell-x)] rounded-b-[32px] pb-10 pt-4">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
          <BackButton onBack={() => undefined} label="이전 화면으로" inert />
          <h1 className="text-center text-lg font-extrabold">마이페이지</h1>
        </div>
      </OrangeHeaderBand>

      <QlingCard className="-mt-6 flex items-center gap-4 rounded-[24px]">
        <ProfileMotif label={props.profile.profileMotif.label} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-words text-lg font-extrabold leading-7 text-[var(--qling-color-text)]">{props.profile.nickname}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm font-bold text-[var(--qling-color-muted)]">
                <Heart className="h-4 w-4 fill-[var(--qling-color-danger)] text-[var(--qling-color-danger)]" aria-hidden="true" />
                <span className="text-[var(--qling-color-danger)]">{props.profile.helpedCount}</span>
                <span>{props.profile.helpedCountLabel}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={props.onEditInterests}
              className="shrink-0 pt-1 text-xs font-bold text-[var(--qling-color-muted)]"
              aria-label="관심 분야 수정으로 이동"
            >
              관심분야 수정 &gt;
            </button>
          </div>
        </div>
      </QlingCard>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white">내가 쓴 답변</h2>
          <button
            type="button"
            onClick={props.onOpenMyAnswers}
            className="text-sm font-bold text-white/90"
            aria-label="내가 쓴 답변 전체보기"
          >
            전체보기 ›
          </button>
        </div>
        {props.answerPreviewItems.length === 0 ? (
          <QlingCard className="rounded-[18px] text-sm font-semibold text-[var(--qling-color-muted)]">
            아직 내가 보낸 위로가 없어요.
          </QlingCard>
        ) : props.answerPreviewItems.slice(0, 2).map(item => (
          <AnswerPreviewCard key={item.replyId} item={item} />
        ))}
      </section>

      <ContentSheet className="space-y-0 rounded-[18px] p-0">
        <h2 className="sr-only">설정</h2>
        {props.settings.map(item => item === 'push_notifications' ? (
          <PushToggleRow key={item} pushSettings={props.pushSettings} />
        ) : (
          <SettingsRow
            key={item}
            label={settingLabels[item]}
            description={undefined}
            danger={item === 'delete_account'}
            disabled={(item === 'logout' && isLogoutProcessing) || (item === 'delete_account' && isAccountDeletionProcessing)}
            accessibilityLabel={`${settingLabels[item]}으로 이동`}
            onSelect={() => props.onSettingSelect(item)}
          />
        ))}
      </ContentSheet>

      {props.pushSettings.message && (
        <p className="px-1 text-xs font-semibold leading-5 text-white/90">{props.pushSettings.message}</p>
      )}
      <p className="sr-only">{pushStatusLabels[props.pushSettings.status]}</p>

      <ConfirmationDialog title="로그아웃할까요?" description="이 기기에서 Qling 계정 연결을 해제합니다." confirmLabel="로그아웃" confirmation={props.logoutConfirmation} />
      <ConfirmationDialog title="계정을 삭제할까요?" description="계정 삭제는 되돌릴 수 없습니다. 작성한 고민과 답변 접근도 함께 중단됩니다." confirmLabel="계정 삭제" confirmation={props.accountDeletionConfirmation} destructive />
    </div>
  );
}

function AnswerPreviewCard({ item }: { readonly item: MyPageScreenProps['answerPreviewItems'][number] }) {
  return (
    <QlingCard className="space-y-3 rounded-[18px] px-[18px] py-4">
      <div className="flex items-center gap-2 text-xs font-bold">
        {item.categoryLabel && (
          <span className="rounded-[var(--qling-radius-pill)] bg-[#ffe4cc] px-3 py-1 text-[#c45614]">{item.categoryLabel}</span>
        )}
        {item.dateLabel && <span className="text-[var(--qling-color-muted)]">{item.dateLabel}</span>}
        {item.hasReceivedHeart && <Heart className="ml-auto h-4 w-4 fill-[var(--qling-color-danger)] text-[var(--qling-color-danger)]" aria-hidden="true" />}
      </div>
      <p className="line-clamp-2 break-words text-sm font-semibold leading-6 text-[var(--qling-color-text)]">
        "{item.previewText}"
      </p>
    </QlingCard>
  );
}

function PushToggleRow({ pushSettings }: { readonly pushSettings: MyPageScreenProps['pushSettings'] }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 border-b border-[var(--qling-color-border)] px-5 py-3 text-left">
      <span className="flex min-w-0 items-center gap-3">
        <Bell className="h-5 w-5 shrink-0 text-[var(--qling-color-muted)]" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[var(--qling-color-text)]">{settingLabels.push_notifications}</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--qling-color-muted)]">{settingDescriptions.push_notifications}</span>
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={pushSettings.enabled}
        aria-label="알림 설정 토글"
        onClick={() => void pushSettings.onToggle(!pushSettings.enabled)}
        disabled={pushSettings.status === 'unsupported'}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--qling-color-primary-orange)] disabled:opacity-50 ${pushSettings.enabled ? 'bg-[var(--qling-color-primary-orange)]' : 'bg-[#d8d8dc]'}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${pushSettings.enabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

export function PolicyScreen(props: PolicyScreenProps & { readonly onBack: () => void }) {
  const policyBody = props.body?.trim();

  return (
    <div className="space-y-5">
      <BackButton onBack={props.onBack} label="마이페이지로" />
      {props.state.status === 'loading' ? (
        <LoadingState title={props.title} message={props.state.label} />
      ) : props.state.status === 'error' ? (
        <PolicyTextContainer state="error" title={props.title} message={props.state.message} />
      ) : policyBody ? (
        <PolicyTextContainer state="body" title={props.title} body={policyBody} />
      ) : (
        <PolicyTextContainer
          state="empty"
          title={props.title}
          message={props.state.status === 'empty' ? props.state.message : '정책을 준비 중입니다.'}
        />
      )}
    </div>
  );
}

export function EditInterestsScreen(props: EditInterestsProps) {
  const hasValidationError = Boolean(props.validationMessages.interests);

  return (
    <div className="space-y-5">
      <BackButton onBack={props.onBack} label="마이페이지로" />
      <OrangeHeaderBand className="space-y-2">
        <p className="text-sm font-bold opacity-85">관심 분야 수정</p>
        <h1 className="text-2xl font-extrabold">주요 관심사는 무엇인가요?</h1>
      </OrangeHeaderBand>
      <ContentSheet className="space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-bold text-[var(--qling-color-text)]">최소 1개 선택, 복수 선택 가능</p>
          <p className="text-xs leading-5 text-[var(--qling-color-muted)]">변경사항은 저장하기를 눌러야 반영돼요.</p>
        </div>
        <div className="grid grid-cols-3 gap-2" aria-label="관심 분야 선택">
          {props.categoryOptions.map(interest => (
            <CategoryChip
              key={interest}
              label={interest}
              selected={props.selectedInterests.includes(interest)}
              disabled={props.isProcessing}
              onSelect={() => props.onInterestToggle(interest)}
              className="min-h-11 w-full justify-center px-2"
            />
          ))}
        </div>
        {hasValidationError && (
          <p className="text-sm font-semibold text-[var(--qling-color-danger)]" role="alert">
            {props.validationMessages.interests}
          </p>
        )}
        <PrimaryCTA
          onClick={props.onSubmit}
          disabled={props.isProcessing}
          processing={props.isProcessing}
          accessibilityLabel="관심 분야 저장"
        >
          {props.isProcessing ? '저장 중' : '저장하기'}
        </PrimaryCTA>
      </ContentSheet>
    </div>
  );
}

function ConfirmationDialog(props: {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly confirmation: ConfirmationProps;
  readonly destructive?: boolean;
}) {
  return (
    <QlingDialog
      isOpen={props.confirmation.isOpen}
      title={props.title}
      description={props.description}
      cancelLabel="취소"
      confirmLabel={props.confirmation.isProcessing ? '처리 중' : props.confirmLabel}
      destructive={props.destructive}
      processing={props.confirmation.isProcessing}
      errorMessage={props.confirmation.errorMessage}
      onCancel={props.confirmation.onCancel}
      onConfirm={props.confirmation.onConfirm}
    />
  );
}

function BackButton({ onBack, label, inert = false }: { readonly onBack: () => void; readonly label: string; readonly inert?: boolean }) {
  if (inert) {
    return <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center text-[var(--qling-color-text)]"><ArrowLeft className="h-5 w-5" /></span>;
  }

  return (
    <button
      type="button"
      onClick={onBack}
      aria-label={`${label} 돌아가기`}
      className="inline-flex items-center gap-2 rounded-[var(--qling-radius-small-button)] px-2 py-1 text-sm font-bold text-[var(--qling-color-muted)] transition-colors hover:text-[var(--qling-color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--qling-color-primary-orange)]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
