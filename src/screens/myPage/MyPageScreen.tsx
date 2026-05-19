import { Heart } from 'lucide-react';
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
} from './contract';

const settingLabels: Record<MyPageSettingItem, string> = {
  privacy_policy: '개인정보처리방침',
  push_notifications: '알림 설정',
  logout: '로그아웃',
  delete_account: '회원 탈퇴',
};

export function MyPageScreen(props: MyPageScreenProps) {
  const isLogoutProcessing = props.logoutConfirmation.isProcessing;
  const isAccountDeletionProcessing = props.accountDeletionConfirmation.isProcessing;

  return (
    <div className="-mx-[var(--qling-space-shell-x)] -mt-6 min-h-[calc(100dvh-var(--qling-space-scroll-bottom))] bg-[#ff8b0d] px-5 pb-8 pt-[56px] text-[#1a1a1e]">
      <div className="mx-auto max-w-[353px]">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
          <BackButton onBack={() => undefined} label="이전 화면으로" inert />
          <h1 className="truncate text-center text-[17px] font-extrabold leading-[21px]">마이페이지</h1>
        </div>
      </div>

      <QlingCard className="mx-auto mt-9 flex h-[93px] max-w-[353px] items-center gap-[19px] rounded-[24px] border-0 px-[17px] py-[14px]">
        <ProfileMotif label={props.profile.profileMotif.label} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[18px] font-extrabold leading-[22px] text-[#1a1a1e]">{props.profile.nickname}</h2>
              <p className="mt-[7px] flex min-w-0 items-center gap-[6px] text-[11px] font-medium leading-[14px] text-[#7a7a7e]">
                <Heart className="h-[14px] w-[14px] shrink-0 fill-[#ea4335] text-[#ea4335]" aria-hidden="true" />
                <span className="shrink-0 text-[13px] font-bold leading-4 text-[#1a1a1e]">{props.profile.helpedCount}</span>
                <span className="ml-[18px] truncate">{props.profile.helpedCountLabel}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={props.onEditInterests}
              className="shrink-0 pt-[3px] text-xs font-medium leading-[15px] text-[#7a7a7e]"
              aria-label="관심 분야 수정으로 이동"
            >
              관심분야 수정 &gt;
            </button>
          </div>
        </div>
      </QlingCard>

      <section className="mx-auto mt-[45px] max-w-[353px] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="truncate text-base font-extrabold leading-5 text-white">내가 쓴 답변</h2>
          <button
            type="button"
            onClick={props.onOpenMyAnswers}
            className="shrink-0 text-[13px] font-medium leading-4 text-white"
            aria-label="내가 쓴 답변 전체보기"
          >
            전체보기 ›
          </button>
        </div>
        {props.answerPreviewItems.length === 0 ? (
          <EmptyAnswerPreviewCard />
        ) : props.answerPreviewItems.slice(0, 2).map(item => (
          <AnswerPreviewCard key={item.replyId} item={item} />
        ))}
      </section>

      <section className="mx-auto mt-[25px] max-w-[353px] space-y-3">
        <h2 className="truncate text-base font-extrabold leading-5 text-white">설정</h2>
        <ContentSheet className="h-[192px] overflow-hidden rounded-[18px] p-0">
        {props.settings.map((item, index) => item === 'push_notifications' ? (
          <PushToggleRow key={item} pushSettings={props.pushSettings} />
        ) : (
          <SettingsRow
            key={item}
            label={settingLabels[item]}
            leadingIcon={<SettingIcon item={item} />}
            description={undefined}
            danger={item === 'delete_account'}
            disabled={(item === 'logout' && isLogoutProcessing) || (item === 'delete_account' && isAccountDeletionProcessing)}
            accessibilityLabel={`${settingLabels[item]}으로 이동`}
            showDivider={index < props.settings.length - 1}
            onSelect={() => props.onSettingSelect(item)}
          />
        ))}
        </ContentSheet>
      </section>

      <ConfirmationDialog title="로그아웃할까요?" description="이 기기에서 Qling 계정 연결을 해제합니다." confirmLabel="로그아웃" confirmation={props.logoutConfirmation} />
      <ConfirmationDialog title="계정을 삭제할까요?" description="계정 삭제는 되돌릴 수 없습니다. 작성한 고민과 답변 접근도 함께 중단됩니다." confirmLabel="계정 삭제" confirmation={props.accountDeletionConfirmation} destructive />
    </div>
  );
}

function AnswerPreviewCard({ item }: { readonly item: MyPageScreenProps['answerPreviewItems'][number] }) {
  return (
    <QlingCard className="h-[86px] space-y-[11px] overflow-hidden rounded-[18px] border-0 px-[18px] py-4">
      <div className="flex min-w-0 items-center gap-2 text-xs font-bold">
        {item.categoryLabel && (
          <span className="max-w-[90px] truncate rounded-[var(--qling-radius-pill)] bg-[#ffe4cc] px-[11px] py-1 text-[#ff8b3d]">{item.categoryLabel}</span>
        )}
        {item.dateLabel && <span className="min-w-0 truncate text-[#9a9aa0]">{item.dateLabel}</span>}
        {item.hasReceivedHeart && <Heart className="ml-auto h-4 w-4 shrink-0 fill-[#ea4335] text-[#ea4335]" aria-hidden="true" />}
      </div>
      <p className="line-clamp-2 break-words text-[13px] font-semibold leading-[19px] text-[#1a1a1e]">
        "{item.previewText}"
      </p>
    </QlingCard>
  );
}

function EmptyAnswerPreviewCard() {
  return (
    <QlingCard className="flex h-[86px] items-center rounded-[18px] border-0 px-[18px] py-4">
      <p className="truncate text-[13px] font-semibold leading-[19px] text-[#1a1a1e]">첫 답변을 남겨보세요!</p>
    </QlingCard>
  );
}

function PushToggleRow({ pushSettings }: { readonly pushSettings: MyPageScreenProps['pushSettings'] }) {
  const handleToggleClick = () => {
    if (pushSettings.enabled) return;
    void pushSettings.onToggle(true);
  };

  return (
    <div className="flex h-12 w-full items-center justify-between gap-3 border-b border-[var(--qling-color-border)] px-5 py-3 text-left">
      <span className="flex min-w-0 items-center gap-3">
        <SettingIcon item="push_notifications" />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold leading-[22px] text-[#1a1a1e]">{settingLabels.push_notifications}</span>
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={pushSettings.enabled}
        aria-label="알림 설정 토글"
        onClick={handleToggleClick}
        disabled={pushSettings.status === 'unsupported'}
        className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] disabled:opacity-50 ${pushSettings.enabled ? 'bg-[#34c759]' : 'bg-[#d8d8dc]'}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-[27px] w-[27px] rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.18)] transition-[left,right] ${pushSettings.enabled ? 'right-0.5' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
}

function SettingIcon({ item }: { readonly item: MyPageSettingItem }) {
  const danger = item === 'delete_account';
  const stroke = danger ? '#ea4335' : '#5f6368';

  if (item === 'privacy_policy') {
    return (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3.5 19 6v5.2c0 4.5-2.8 8.1-7 9.3-4.2-1.2-7-4.8-7-9.3V6l7-2.5Z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (item === 'logout') {
    return (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 4h9v4M13 16v4H4V4" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 12h9M16 9l3 3-3 3" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (item === 'delete_account') {
    return (
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke={stroke} strokeWidth="2" />
        <path d="M3.5 20c.6-4.2 2.7-6.4 5.5-6.4 1.3 0 2.4.4 3.3 1.2" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="m16 15 5 5M21 15l-5 5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.3 20a2.9 2.9 0 0 0 5.4 0" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M5.5 16.2h13c-.9-1.2-1.7-2.6-1.7-6.1a4.8 4.8 0 1 0-9.6 0c0 3.5-.8 4.9-1.7 6.1Z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    </svg>
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
    return <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-start text-[32px] font-semibold leading-none text-[#2a2a2a]">‹</span>;
  }

  return (
    <button
      type="button"
      onClick={onBack}
      aria-label={`${label} 돌아가기`}
      className="inline-flex items-center gap-2 rounded-[var(--qling-radius-small-button)] px-2 py-1 text-sm font-bold text-[var(--qling-color-muted)] transition-colors hover:text-[var(--qling-color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--qling-color-primary-orange)]"
    >
      <span className="text-[24px] leading-none" aria-hidden="true">‹</span>
      {label}
    </button>
  );
}
