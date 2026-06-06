import {
  FigmaCanvasFrame,
  FigmaTopBar,
  QlingDialog,
  profileImageUrlForColor,
} from '../shared/ui';
import type { TouchEvent, WheelEvent } from 'react';
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

const PRIVACY_POLICY_FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSe88_R7B_cP_pIa7aIe-Fcb1gRYeDfBETNpehOODMrEY0skVQ/viewform?usp=publish-editor';
const pwaTopBarShift = 'var(--qling-pwa-topbar-shift, 0px)';
const shiftedTopBarTop = (top: number) => `calc(${top}px + ${pwaTopBarShift})`;

const editInterestsFigmaOrder = [
  '진로',
  '취업',
  '직장',
  '학업',
  '시험',
  '경제',
  '연애',
  '결혼',
  '가족',
  '인간관계',
  '육아',
  '건강',
  '외모',
  '군대',
  '미래',
  '일상',
] as const;

export function MyPageScreen(props: MyPageScreenProps) {
  const isLogoutProcessing = props.logoutConfirmation.isProcessing;
  const isAccountDeletionProcessing = props.accountDeletionConfirmation.isProcessing;
  const previewItems = props.answerPreviewItems.slice(0, 2);
  const hasMultiplePreviewItems = previewItems.length >= 2;
  const answerSectionBottom = hasMultiplePreviewItems ? 386 : 288;
  const settingsHeadingTop = hasMultiplePreviewItems ? 411 : 326;
  const settingsCardTop = hasMultiplePreviewItems ? 444 : 359;
  const contentBottom = settingsCardTop + 192;
  const myPageTabViewportHeight = 'var(--qling-tab-viewport-height)';
  const directTopbarShift = 'var(--qling-pwa-direct-topbar-shift)';
  const myPageContentHeight = `min(752px, max(520px, calc(${myPageTabViewportHeight} - 100px - ${directTopbarShift})))`;

  return (
    <section
      aria-label="마이페이지"
      className="-mx-[var(--qling-space-shell-x)] h-[var(--qling-tab-viewport-height)] overflow-hidden bg-[#ff8b3d] text-[#1a1a1e] qling-figma-font"
    >
      <FigmaCanvasFrame className="max-w-[480px]" data-measure="my-page-responsive-canvas">
        <div
          className="relative h-[852px] w-full max-w-[480px] shrink-0 overflow-hidden bg-[#ff8b3d]"
          data-measure="my-page-screen"
        >
          <MyPageHeader onBack={props.onBack} />

          <section
            className="relative overflow-y-auto overscroll-contain pb-[calc(108px+env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch]"
            style={{ height: myPageContentHeight }}
            aria-label="마이페이지 본문"
          >
            <div className="relative" style={{ height: contentBottom }}>
              <section className="absolute left-5 right-5 top-[32px] h-[93px] overflow-hidden rounded-[24px] bg-white" data-measure="my-page-profile-card">
                <DefaultProfileImage label={props.profile.profileMotif.label} profileColor={props.profile.profileMotif.profileColor} />
                <h2 className="absolute left-[100px] top-[23px] max-w-[128px] truncate text-[18px] font-extrabold leading-[22px] tracking-[-0.18px] text-[#1a1a1e]">
                  {props.profile.nickname}
                </h2>
                <span className="absolute left-[100px] top-[53px] font-['Qling_Figma_Inter'] text-[14px] font-bold leading-[17px] text-[#ea4335]" aria-hidden="true">♥</span>
                <span className="absolute left-[116px] top-[54px] max-w-[28px] truncate text-[13px] font-bold leading-4 tracking-[-0.39px] text-[#1a1a1e]">
                  {props.profile.helpedCount}
                </span>
                <span className="absolute left-[147px] top-[56px] text-[11px] font-bold leading-[14px] tracking-[-0.33px] text-[#7a7a7e]">
                  {props.profile.helpedCountLabel}
                </span>
                <button
                  type="button"
                  onClick={props.onEditInterests}
                  className="absolute left-[256px] top-[26px] whitespace-nowrap text-[12px] font-bold leading-[15px] tracking-[-0.36px] text-[#7a7a7e] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d]"
                  aria-label="관심 분야 수정으로 이동"
                >
                  관심분야 수정 &gt;
                </button>
              </section>

              <h2 className="absolute left-6 top-[170px] text-[16px] font-extrabold leading-5 tracking-[-0.16px] text-white">내가 쓴 답변</h2>
              <button
                type="button"
                onClick={props.onOpenMyAnswers}
                className="absolute left-[312px] top-[174px] whitespace-nowrap text-[13px] font-bold leading-4 text-white/90 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="내가 쓴 답변 전체보기"
              >
                전체보기 ›
              </button>
              <section className="absolute left-5 right-5" style={{ top: 202, height: answerSectionBottom - 202 }} data-measure="my-page-answer-preview">
                {previewItems.length === 0 ? (
                  <EmptyAnswerPreviewCard />
                ) : previewItems.map((item, index) => (
                  <AnswerPreviewCard key={item.replyId} item={item} top={index * 98} />
                ))}
              </section>

              <h2 className="absolute left-5 text-[16px] font-extrabold leading-5 tracking-[-0.16px] text-white" style={{ top: settingsHeadingTop }}>설정</h2>
              <SettingsCard
                top={settingsCardTop}
                settings={props.settings}
                pushSettings={props.pushSettings}
                isLogoutProcessing={isLogoutProcessing}
                isAccountDeletionProcessing={isAccountDeletionProcessing}
                onSettingSelect={props.onSettingSelect}
              />
            </div>
          </section>
        </div>
      </FigmaCanvasFrame>
      <ConfirmationDialog title="로그아웃할까요?" description="이 기기에서 Qling 계정 연결을 해제합니다." confirmLabel="로그아웃" confirmation={props.logoutConfirmation} />
      <ConfirmationDialog title="계정을 삭제할까요?" description="계정 삭제는 되돌릴 수 없습니다. 작성한 고민과 답변 접근도 함께 중단됩니다." confirmLabel="계정 삭제" confirmation={props.accountDeletionConfirmation} destructive />
    </section>
  );
}

function MyPageHeader({
  onBack,
}: {
  readonly onBack: () => void;
}) {
  return (
    <header
      className="h-[calc(100px+var(--qling-pwa-direct-topbar-shift))] touch-none overscroll-none overflow-hidden bg-[#ff8b3d]"
      onTouchMove={blockLockedScroll}
      onWheel={blockLockedScroll}
    >
      <div
        className="relative mx-auto h-[calc(100px+var(--qling-pwa-direct-topbar-shift))] w-full max-w-[480px]"
      >
        <button
          type="button"
          aria-label="이전 화면으로 돌아가기"
          onClick={onBack}
          className="absolute left-[6px] top-[calc(45px+var(--qling-pwa-direct-topbar-shift))] flex h-[45px] w-[44px] items-center justify-center text-[32px] font-semibold leading-none text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <h1 className="absolute left-0 top-[calc(60px+var(--qling-pwa-direct-topbar-shift))] w-full text-center text-[17px] font-extrabold leading-none tracking-[-0.02em] text-white">
          마이페이지
        </h1>
      </div>
    </header>
  );
}

function blockLockedScroll(event: TouchEvent<HTMLElement> | WheelEvent<HTMLElement>) {
  const { preventDefault, stopPropagation } = event;
  preventDefault.call(event);
  stopPropagation.call(event);
}

function DefaultProfileImage({ label, profileColor }: { readonly label: string; readonly profileColor: string }) {
  return (
    <img
      src={profileImageUrlForColor(profileColor)}
      alt={label}
      className="absolute left-[27px] top-5 h-[58px] w-[58px] rounded-full"
      draggable={false}
    />
  );
}

function AnswerPreviewCard({ item, top }: { readonly item: MyPageScreenProps['answerPreviewItems'][number]; readonly top: number }) {
  return (
    <article className="absolute left-0 right-0 h-[86px] overflow-hidden rounded-[18px] bg-white" style={{ top }} aria-label={item.accessibilityLabel}>
      <div className="absolute left-[18px] top-4 flex h-[22px] min-w-0 items-center gap-2 text-xs font-bold">
        {item.categoryLabel && (
          <span className="flex h-[22px] max-w-[90px] items-center rounded-[999px] bg-[#ffe4cc] px-[10.5px] font-['Qling_Figma_Inter'] text-[11px] font-bold leading-[13px] text-[#c45614]">{item.categoryLabel}</span>
        )}
        {item.dateLabel && <span className="min-w-0 truncate font-['Qling_Figma_Inter'] text-[12px] font-bold leading-[15px] text-[#9a9aa0]">{item.dateLabel}</span>}
      </div>
      <p className="absolute left-[18px] right-[18px] top-[49px] h-[19px] truncate text-[13px] font-semibold leading-[1.45] tracking-[-0.52px] text-[#1a1a1e]">
        "{item.previewText}"
      </p>
    </article>
  );
}

function EmptyAnswerPreviewCard() {
  return (
    <article className="absolute left-0 right-0 top-0 h-[86px] overflow-hidden rounded-[18px] bg-white" data-measure="my-page-empty-answer-preview">
      <p className="absolute left-[18px] right-[18px] top-[35px] h-9 break-words text-[13px] font-semibold leading-[1.45] tracking-[-0.52px] text-[#1a1a1e]">
        답변하기 탭에서 따뜻한 첫 답변을 남겨보세요
      </p>
    </article>
  );
}

function SettingsCard({
  top,
  settings,
  pushSettings,
  isLogoutProcessing,
  isAccountDeletionProcessing,
  onSettingSelect,
}: {
  readonly top: number;
  readonly settings: readonly MyPageSettingItem[];
  readonly pushSettings: MyPageScreenProps['pushSettings'];
  readonly isLogoutProcessing: boolean;
  readonly isAccountDeletionProcessing: boolean;
  readonly onSettingSelect: (item: MyPageSettingItem) => void;
}) {
  const enabledSettings = new Set(settings);

  return (
    <section className="absolute left-5 right-5 h-[192px] overflow-hidden rounded-[18px] bg-white" style={{ top }} data-measure="my-page-settings-card">
      {enabledSettings.has('push_notifications') && <PushToggleRow pushSettings={pushSettings} />}
      <div className="absolute left-6 right-6 top-12 h-px bg-[#f0f0f2]" />
      {enabledSettings.has('privacy_policy') && (
        <SettingsActionRow item="privacy_policy" top={48} onSettingSelect={onSettingSelect} />
      )}
      <div className="absolute left-6 right-6 top-24 h-px bg-[#f0f0f2]" />
      {enabledSettings.has('logout') && (
        <SettingsActionRow item="logout" top={96} disabled={isLogoutProcessing} onSettingSelect={onSettingSelect} />
      )}
      <div className="absolute left-6 right-6 top-36 h-px bg-[#f0f0f2]" />
      {enabledSettings.has('delete_account') && (
        <SettingsActionRow item="delete_account" top={144} disabled={isAccountDeletionProcessing} onSettingSelect={onSettingSelect} />
      )}
    </section>
  );
}

function SettingsActionRow({
  item,
  top,
  disabled,
  onSettingSelect,
}: {
  readonly item: Exclude<MyPageSettingItem, 'push_notifications'>;
  readonly top: number;
  readonly disabled?: boolean;
  readonly onSettingSelect: (item: MyPageSettingItem) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${settingLabels[item]}으로 이동`}
      disabled={disabled}
      onClick={() => onSettingSelect(item)}
      className="absolute left-0 h-12 w-full disabled:cursor-not-allowed disabled:opacity-55 focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset"
      style={{ top }}
    >
      <span className="absolute left-5 top-3 h-6 w-6" aria-hidden="true">
        <SettingIcon item={item} />
      </span>
      <span className={`absolute left-14 top-[15px] text-[15px] font-semibold leading-[18px] tracking-[-0.6px] ${item === 'delete_account' ? 'text-[#ea4335]' : 'text-[#1a1a1e]'}`}>
        {settingLabels[item]}
      </span>
      <span className="absolute right-5 top-[15px] text-[18px] font-semibold leading-[18px] text-[#c2c4c8]" aria-hidden="true">›</span>
    </button>
  );
}

function PushToggleRow({ pushSettings }: { readonly pushSettings: MyPageScreenProps['pushSettings'] }) {
  const handleToggleClick = () => {
    void pushSettings.onToggle(!pushSettings.enabled);
  };

  return (
    <div className="absolute left-0 top-0 h-12 w-full text-left">
      <span className="absolute left-5 top-3 h-6 w-6" aria-hidden="true">
        <SettingIcon item="push_notifications" />
      </span>
      <span className="absolute left-14 top-[15px] text-[15px] font-semibold leading-[18px] tracking-[-0.6px] text-[#1a1a1e]">{settingLabels.push_notifications}</span>
      <button
        type="button"
        role="switch"
        aria-checked={pushSettings.enabled}
        aria-label="알림 설정 토글"
        onClick={handleToggleClick}
        disabled={pushSettings.status === 'unsupported'}
        className={`absolute right-[14px] top-[9px] h-[31px] w-[51px] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] disabled:opacity-50 ${pushSettings.enabled ? 'bg-[#34c759]' : 'bg-[#d8d8dc]'}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_3px_1px_rgb(0_0_0/0.06)] transition-[left,right] ${pushSettings.enabled ? 'right-0.5' : 'left-0.5'}`}
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
  const shouldShowFeedbackLink = props.state.status === 'ready' && Boolean(policyBody);
  const cardContent = props.state.status === 'loading'
    ? props.state.label
    : props.state.status === 'error'
      ? props.state.message
      : policyBody || (props.state.status === 'empty' ? props.state.message : '정책을 준비 중입니다.');
  const policyTabViewportHeight = 'var(--qling-tab-viewport-height)';
  const policyCardBottom = `max(calc(108px + env(safe-area-inset-bottom,0px)), calc(876px - ${policyTabViewportHeight}))`;

  return (
    <section
      aria-label={props.title}
      className="-mx-[var(--qling-space-shell-x)] h-[var(--qling-tab-viewport-height)] overflow-hidden bg-[#ff8b0d] text-[#1a1a1e] qling-figma-font"
    >
      <FigmaCanvasFrame className="max-w-[480px]" data-measure="policy-responsive-canvas">
        <div
          className="relative h-[852px] w-full max-w-[480px] shrink-0 bg-[#ff8b0d]"
          data-measure="policy-screen"
        >
          <FigmaTopBar title="개인정보 처리방침" titleAriaLabel={props.title} onBack={props.onBack} backLabel="마이페이지로 돌아가기" tone="light" />
          <article
            className="absolute left-4 right-4 overflow-y-auto rounded-[18px] bg-white px-[18px] py-[17px] [-webkit-overflow-scrolling:touch]"
            style={{ top: shiftedTopBarTop(127), bottom: policyCardBottom }}
          >
            {shouldShowFeedbackLink && (
              <>
                <a
                  href={PRIVACY_POLICY_FEEDBACK_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-[25px] flex h-[43px] w-full items-center justify-center rounded-[12px] bg-[#ff8b3d] px-4 text-[15px] font-bold leading-none text-white"
                >
                  건의사항 남기기
                </a>
                <div className="mb-[20px] h-px w-full bg-[rgba(0,0,0,0.08)]" aria-hidden="true" />
              </>
            )}
            <div
              className="whitespace-pre-wrap text-[13px] font-semibold leading-[150%] tracking-[-0.05em] text-[#1a1a1e]"
              role={props.state.status === 'error' ? 'alert' : undefined}
            >
              {cardContent}
            </div>
          </article>
        </div>
      </FigmaCanvasFrame>
    </section>
  );
}

export function EditInterestsScreen(props: EditInterestsProps) {
  const hasValidationError = Boolean(props.validationMessages.interests);
  const orderedCategoryOptions = editInterestsFigmaOrder.filter(category => props.categoryOptions.includes(category));

  return (
    <section
      aria-label="관심분야 수정"
      className="-mx-[var(--qling-space-shell-x)] h-[var(--qling-tab-viewport-height)] overflow-hidden bg-[#ff8b3d] text-[#1a1a1a] qling-figma-font"
    >
      <FigmaCanvasFrame className="max-w-[480px]" data-measure="edit-interests-responsive-canvas">
        <div
          className="relative h-[852px] w-full max-w-[480px] shrink-0 overflow-hidden bg-[#ff8b3d]"
          data-measure="edit-interests-screen"
        >
          <div className="absolute left-0 right-0 h-[656px] rounded-tl-[44px] rounded-tr-[44px] border-t border-[#b99b62] bg-[#fff7e3]" style={{ top: shiftedTopBarTop(196) }} />
          <FigmaTopBar title="관심분야 수정" onBack={props.onBack} backLabel="마이페이지로 돌아가기" tone="light" />
          <p className="absolute left-[28px] right-[28px] text-[26px] font-extrabold leading-[normal] tracking-[-1.3px] text-white" style={{ top: shiftedTopBarTop(147) }}>
            공감할 수 있는 주제를 골라주세요
          </p>
          <p className="absolute left-6 right-6 text-[13px] font-bold leading-[normal] tracking-[-0.13px] text-[#8e9095]" style={{ top: shiftedTopBarTop(243) }}>
            변경사항은 저장하기를 눌러야 반영돼요.
          </p>
          <p className="absolute left-6 right-6 text-[13px] font-bold leading-[normal] tracking-[-0.13px] text-[#8e9095]" style={{ top: shiftedTopBarTop(262) }}>
            최소 1개 선택, 복수 선택 가능
          </p>
          <div
            className="absolute left-[35px] right-[35px] grid grid-cols-2 justify-center gap-x-[13px] gap-y-[9px]"
            style={{ top: shiftedTopBarTop(303) }}
            aria-label="관심 분야 선택"
          >
            {orderedCategoryOptions.map(interest => {
              const selected = props.selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  disabled={props.isProcessing}
                  aria-pressed={selected}
                  onClick={() => props.onInterestToggle(interest)}
                  className={`box-border h-[43px] w-full rounded-[19px] border-2 px-1 py-0 text-[14px] font-bold leading-none tracking-normal disabled:cursor-not-allowed disabled:opacity-55 ${selected ? 'border-[#ff8b0d] bg-transparent text-[#2a2a2a]' : 'border-[#d4be91] bg-[#fff1d1] text-[#25272b]'}`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          {hasValidationError && (
            <p className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-[13px] font-extrabold leading-[normal] tracking-[-0.13px] text-[#ea4335]" style={{ top: shiftedTopBarTop(730) }} role="alert">
              최소 1개의 관심분야를 선택해주세요
            </p>
          )}
          <button
            type="button"
            onClick={props.onSubmit}
            disabled={props.isProcessing}
            aria-label="관심 분야 저장"
            aria-busy={props.isProcessing || undefined}
            className="absolute left-[24px] right-[24px] h-[56px] rounded-[28px] bg-[#ff8b3d] text-[17px] font-bold leading-none tracking-[-0.17px] text-white disabled:cursor-not-allowed disabled:opacity-55"
            style={{ top: shiftedTopBarTop(752) }}
          >
            {props.isProcessing ? '저장 중' : '저장하기'}
          </button>
        </div>
      </FigmaCanvasFrame>
    </section>
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
