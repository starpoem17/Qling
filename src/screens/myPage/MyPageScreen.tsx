import {
  FigmaTopBar,
  QlingDialog,
  profileImageUrlForColor,
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

const editInterestsFigmaOrder = [
  '진로',
  '취업',
  '시험',
  '학업',
  '소득',
  '연애',
  '결혼',
  '부모',
  '자녀',
  '우울',
  '불안',
  '외로움',
  '직장',
  '워라밸',
  '외모',
  '자존감',
  '건강',
  '노후',
  '미래',
  '잡담',
  '주거',
] as const;

export function MyPageScreen(props: MyPageScreenProps) {
  const isLogoutProcessing = props.logoutConfirmation.isProcessing;
  const isAccountDeletionProcessing = props.accountDeletionConfirmation.isProcessing;
  const previewItems = props.answerPreviewItems.slice(0, 2);
  const hasMultiplePreviewItems = previewItems.length >= 2;
  const answerSectionBottom = hasMultiplePreviewItems ? 486 : 388;
  const settingsHeadingTop = hasMultiplePreviewItems ? 511 : 426;
  const settingsCardTop = hasMultiplePreviewItems ? 544 : 459;
  const myPageCanvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';

  return (
    <section
      aria-label="마이페이지"
      className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-safe-bottom)] -mt-6 h-full min-h-[calc(100dvh-var(--qling-space-nav-height))] overflow-hidden bg-[#ff8b3d] text-[#1a1a1e]"
    >
      <div
        className="mx-auto flex w-full max-w-[480px] justify-center"
        data-measure="my-page-responsive-canvas"
        style={{ minHeight: `calc(min(100vw, var(--qling-mobile-canvas-max-width)) * 756 / 393)` }}
      >
        <div
          className="relative h-[756px] w-[393px] shrink-0 origin-top bg-[#ff8b3d] font-sans"
          data-measure="my-page-screen"
          style={{ transform: `scale(${myPageCanvasScale})` }}
        >
          <FigmaTopBar title="마이페이지" onBack={props.onBack} backLabel="이전 화면으로 돌아가기" tone="light" />

          <section className="absolute left-5 top-[132px] h-[93px] w-[353px] overflow-hidden rounded-[24px] bg-white" data-measure="my-page-profile-card">
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

          <h2 className="absolute left-6 top-[270px] text-[16px] font-extrabold leading-5 tracking-[-0.16px] text-white">내가 쓴 답변</h2>
          <button
            type="button"
            onClick={props.onOpenMyAnswers}
            className="absolute left-[312px] top-[274px] whitespace-nowrap text-[13px] font-bold leading-4 text-white/90 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="내가 쓴 답변 전체보기"
          >
            전체보기 ›
          </button>
          <section className="absolute left-5 w-[353px]" style={{ top: 302, height: answerSectionBottom - 302 }} data-measure="my-page-answer-preview">
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
      </div>
      <ConfirmationDialog title="로그아웃할까요?" description="이 기기에서 Qling 계정 연결을 해제합니다." confirmLabel="로그아웃" confirmation={props.logoutConfirmation} />
      <ConfirmationDialog title="계정을 삭제할까요?" description="계정 삭제는 되돌릴 수 없습니다. 작성한 고민과 답변 접근도 함께 중단됩니다." confirmLabel="계정 삭제" confirmation={props.accountDeletionConfirmation} destructive />
    </section>
  );
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
    <article className="absolute left-0 h-[86px] w-[353px] overflow-hidden rounded-[18px] bg-white" style={{ top }} aria-label={item.accessibilityLabel}>
      <div className="absolute left-[18px] top-4 flex h-[22px] min-w-0 items-center gap-2 text-xs font-bold">
        {item.categoryLabel && (
          <span className="flex h-[22px] max-w-[90px] items-center rounded-[999px] bg-[#ffe4cc] px-[10.5px] font-['Qling_Figma_Inter'] text-[11px] font-bold leading-[13px] text-[#c45614]">{item.categoryLabel}</span>
        )}
        {item.dateLabel && <span className="min-w-0 truncate font-['Qling_Figma_Inter'] text-[12px] font-bold leading-[15px] text-[#9a9aa0]">{item.dateLabel}</span>}
      </div>
      <p className="absolute left-[18px] top-[49px] line-clamp-2 h-9 w-[305px] break-words text-[13px] font-semibold leading-[1.45] tracking-[-0.52px] text-[#1a1a1e]">
        "{item.previewText}"
      </p>
    </article>
  );
}

function EmptyAnswerPreviewCard() {
  return (
    <article className="absolute left-0 top-0 h-[86px] w-[353px] overflow-hidden rounded-[18px] bg-white" data-measure="my-page-empty-answer-preview">
      <p className="absolute left-[18px] top-[35px] h-9 w-[305px] break-words text-[13px] font-semibold leading-[1.45] tracking-[-0.52px] text-[#1a1a1e]">
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
    <section className="absolute left-5 h-[192px] w-[353px] overflow-hidden rounded-[18px] bg-white" style={{ top }} data-measure="my-page-settings-card">
      {enabledSettings.has('push_notifications') && <PushToggleRow pushSettings={pushSettings} />}
      <div className="absolute left-6 top-12 h-px w-[305px] bg-[#f0f0f2]" />
      {enabledSettings.has('privacy_policy') && (
        <SettingsActionRow item="privacy_policy" top={48} onSettingSelect={onSettingSelect} />
      )}
      <div className="absolute left-6 top-24 h-px w-[305px] bg-[#f0f0f2]" />
      {enabledSettings.has('logout') && (
        <SettingsActionRow item="logout" top={96} disabled={isLogoutProcessing} onSettingSelect={onSettingSelect} />
      )}
      <div className="absolute left-6 top-36 h-px w-[305px] bg-[#f0f0f2]" />
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
      <span className="absolute left-[323px] top-[15px] text-[18px] font-semibold leading-[18px] text-[#c2c4c8]" aria-hidden="true">›</span>
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
        className={`absolute left-[288px] top-[9px] h-[31px] w-[51px] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] disabled:opacity-50 ${pushSettings.enabled ? 'bg-[#34c759]' : 'bg-[#d8d8dc]'}`}
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
  const cardContent = props.state.status === 'loading'
    ? props.state.label
    : props.state.status === 'error'
      ? props.state.message
      : policyBody || (props.state.status === 'empty' ? props.state.message : '정책을 준비 중입니다.');
  const policyCanvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';

  return (
    <section
      aria-label={props.title}
      className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b0d] text-[#1a1a1e] qling-figma-font"
    >
      <div
        className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden"
        data-measure="policy-responsive-canvas"
      >
        <div
          className="relative h-[852px] w-[393px] shrink-0 origin-top bg-[#ff8b0d]"
          data-measure="policy-screen"
          style={{ transform: `scale(${policyCanvasScale})` }}
        >
          <FigmaTopBar title="개인정보 처리방침" titleAriaLabel={props.title} onBack={props.onBack} backLabel="마이페이지로 돌아가기" tone="light" />
          <article className="absolute left-4 top-[127px] bottom-[calc(108px+env(safe-area-inset-bottom,0px))] w-[361px] overflow-y-auto rounded-[18px] bg-white px-[18px] py-[31px] [-webkit-overflow-scrolling:touch]">
            <div
              className="whitespace-pre-wrap text-[13px] font-semibold leading-[150%] tracking-[-0.05em] text-[#1a1a1e]"
              role={props.state.status === 'error' ? 'alert' : undefined}
            >
              {cardContent}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function EditInterestsScreen(props: EditInterestsProps) {
  const hasValidationError = Boolean(props.validationMessages.interests);
  const orderedCategoryOptions = editInterestsFigmaOrder.filter(category => props.categoryOptions.includes(category));

  return (
    <section className="-mx-[var(--qling-space-shell-x)] -mt-6 flex h-[calc(100dvh-var(--qling-space-nav-height))] justify-center bg-[#ff8b0d] text-[#1a1a1a]">
      <div className="relative h-full w-full max-w-[393px] overflow-hidden bg-[#ff8b0d]">
        <div className="absolute left-0 top-[196px] bottom-0 w-[393px] rounded-tl-[44px] rounded-tr-[44px] border-t border-[#b99b62] bg-[#fff7e3]" />
        <FigmaTopBar title="관심분야 수정" onBack={props.onBack} backLabel="마이페이지로 돌아가기" tone="light" />
        <p className="absolute left-[28px] top-[147px] text-[26px] font-extrabold leading-8 tracking-normal text-white">
          주요 관심사는 무엇인가요?
        </p>
        <p className="absolute left-6 top-[258px] text-[13px] font-bold leading-4 tracking-normal text-[#8e9095]">
          변경사항은 저장하기를 눌러야 반영돼요.
        </p>
        <p className="absolute left-6 top-[277px] text-[13px] font-bold leading-4 tracking-normal text-[#8e9095]">
          최소 1개 선택, 복수 선택 가능
        </p>
        <div className="absolute bottom-[116px] left-[34px] right-[35px] top-[322px] overflow-y-auto pb-4 scrollbar-hide">
          <div className="grid w-full grid-cols-3 gap-x-[7px] gap-y-[13px]" aria-label="관심 분야 선택">
            {orderedCategoryOptions.map(interest => {
              const selected = props.selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  disabled={props.isProcessing}
                  aria-pressed={selected}
                  onClick={() => props.onInterestToggle(interest)}
                  className={`h-[44px] w-full rounded-[22px] border-2 px-1 py-0 text-[14px] font-bold leading-none tracking-normal disabled:cursor-not-allowed disabled:opacity-55 ${selected ? 'border-[#ff8b0d] bg-transparent text-[#2a2a2a]' : 'border-[#d4be91] bg-[#fff1d1] text-[#25272b]'}`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
        {hasValidationError && (
          <p className="absolute left-[34px] bottom-[110px] text-[13px] font-bold text-[#ea4335]" role="alert">
            {props.validationMessages.interests}
          </p>
        )}
        <button
          type="button"
          onClick={props.onSubmit}
          disabled={props.isProcessing}
          aria-label="관심 분야 저장"
          aria-busy={props.isProcessing || undefined}
          className="absolute left-6 bottom-[44px] h-[56px] w-[calc(100%-48px)] rounded-[28px] bg-[#ff8b0d] text-[17px] font-extrabold leading-none tracking-normal text-[#121316] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {props.isProcessing ? '저장 중' : '저장하기'}
        </button>
      </div>
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
