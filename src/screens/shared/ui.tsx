import { useId, type ReactNode } from 'react';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Radio,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type {
  BottomNavigationProps,
  BottomNavigationTab,
  CategoryChipProps,
  CtaProps,
  LoadingSpinnerProps,
  MobileAppShellProps,
  PolicyTextContainerProps,
  ProfileMotifProps,
  QlingDialogProps,
  QlingSuccessDialogProps,
  QlingTextAreaProps,
  SettingsRowProps,
  StatusStateProps,
} from './uiContract';

const longestCategoryLabelLength = Math.max(...WORRY_CATEGORIES.map(category => category.length));
const categoryChipWidth = `calc(${longestCategoryLabelLength}em + 2.75rem)`;

export function MobileAppShell({
  children,
  header,
  bottomNavigation,
  hasBottomNavigation = Boolean(bottomNavigation),
  mainClassName,
}: MobileAppShellProps) {
  return (
    <div className="qling-production-root text-[var(--qling-color-text)] font-sans selection:bg-[var(--qling-color-cream-soft)]">
      <div className="qling-production-frame">
        {header}
        <main
          className={cn(
            'mx-auto w-full px-[var(--qling-space-shell-x)]',
            hasBottomNavigation ? 'pb-[var(--qling-space-scroll-bottom)]' : 'pb-12',
            mainClassName,
          )}
        >
          {children}
        </main>
        {bottomNavigation}
      </div>
    </div>
  );
}

export function BottomNavigation({
  tabs,
  activeTab,
  onSelectTab,
}: BottomNavigationProps) {
  const itemByTab: Record<BottomNavigationTab, {
    readonly icon: 'reply' | 'myConcerns' | 'chat' | 'ranking';
    readonly centerX: number;
    readonly iconLeft: number;
    readonly iconTop: number;
    readonly iconWidth: number;
    readonly iconHeight: number;
  }> = {
    답변하기: {
      icon: 'reply',
      centerX: 62,
      iconLeft: 22,
      iconTop: 25.217,
      iconWidth: 39.144,
      iconHeight: 34.255,
    },
    '나의 고민': {
      icon: 'myConcerns',
      centerX: 153,
      iconLeft: 25.824,
      iconTop: 14.302,
      iconWidth: 27.153,
      iconHeight: 28.284,
    },
    채팅: {
      icon: 'chat',
      centerX: 243,
      iconLeft: 24,
      iconTop: 15,
      iconWidth: 30,
      iconHeight: 30,
    },
    순위: {
      icon: 'ranking',
      centerX: 329,
      iconLeft: 25.789,
      iconTop: 14.302,
      iconWidth: 26.019,
      iconHeight: 28.284,
    },
  };

  return (
    <nav
      aria-label="주요 화면"
      className="fixed bottom-0 left-1/2 z-50 h-[80px] w-[393px] -translate-x-1/2 bg-[#fff5eb] qling-figma-font"
      style={{ paddingBottom: 'var(--qling-space-safe-bottom)' }}
    >
      <div className="relative mx-auto h-full w-[393px]" data-measure="bottom-nav-frame">
        {tabs.map(({ tab, label }) => {
          const isActive = activeTab === tab;
          const item = itemByTab[tab];
          return (
            <button
              key={tab}
              type="button"
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectTab(tab)}
              className={cn(
                'absolute top-0 h-[80px] w-[calc(100%*78/393)] -translate-x-1/2 text-[12px] font-semibold leading-[13px] tracking-[-0.24px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8b0d] focus:ring-inset',
                isActive ? 'text-[#ff8b0d]' : 'text-[#c0b59d] hover:text-[#a89f8e]',
              )}
              style={{ left: `calc(100% * ${item.centerX} / 393)` }}
            >
              <BottomNavAssetIcon
                icon={item.icon}
                active={isActive}
                left={item.iconLeft}
                top={item.iconTop}
                width={item.iconWidth}
                height={item.iconHeight}
                measureId={`bottom-nav-${tab}-icon`}
              />
              <span className="absolute left-1/2 top-[50px] h-[14px] min-w-12 -translate-x-1/2 whitespace-nowrap text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function BottomNavAssetIcon({
  icon,
  active,
  left,
  top,
  width,
  height,
  measureId,
}: {
  readonly icon: 'reply' | 'myConcerns' | 'chat' | 'ranking';
  readonly active: boolean;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly measureId: string;
}) {
  return (
    <span
      className={cn('absolute block', active ? 'text-[#ff8b0d]' : 'text-[#c0b59d]')}
      style={{
        left: `calc(100% * ${left} / 78)`,
        top: `${top}px`,
        width: `calc(100% * ${width} / 78)`,
        height: `${height}px`,
      }}
      data-measure={measureId}
      aria-hidden="true"
    >
      <BottomNavSvgIcon icon={icon} />
    </span>
  );
}

function BottomNavSvgIcon({ icon }: { readonly icon: 'reply' | 'myConcerns' | 'chat' | 'ranking' }) {
  if (icon === 'reply') {
    return (
      <svg className="h-full w-full" viewBox="0 0 28.3055 24.0434" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M27.1634 10.348L27.1539 10.344L1.96682 0.10559C1.75497 0.0186896 1.52444 -0.0153918 1.29586 0.0063948C1.06728 0.0281814 0.847779 0.105156 0.656983 0.230434C0.455403 0.359884 0.289823 0.536419 0.175141 0.744154C0.0604597 0.95189 0.00027429 1.18431 0 1.4205V7.96846C0.000112335 8.29135 0.115154 8.60409 0.325298 8.85277C0.535442 9.10145 0.827522 9.27049 1.15119 9.33077L14.8883 11.8201C14.9423 11.8302 14.991 11.8583 15.026 11.8998C15.0611 11.9413 15.0802 11.9934 15.0802 12.0473C15.0802 12.1011 15.0611 12.1533 15.026 12.1948C14.991 12.2362 14.9423 12.2644 14.8883 12.2744L1.15178 14.7638C0.828202 14.8239 0.536139 14.9927 0.325901 15.2412C0.115663 15.4896 0.000412839 15.8022 0 16.1249V22.6741C-0.000156302 22.8996 0.0568251 23.1217 0.165831 23.3203C0.274837 23.5189 0.432457 23.6879 0.624547 23.8121C0.855611 23.9626 1.12678 24.043 1.4042 24.0433C1.59706 24.0431 1.78794 24.0052 1.96564 23.9318L27.1522 13.7518L27.1634 13.7466C27.5024 13.6038 27.7913 13.3667 27.9942 13.0647C28.1972 12.7626 28.3054 12.4089 28.3054 12.0473C28.3054 11.6856 28.1972 11.3319 27.9942 11.0299C27.7913 10.7279 27.5024 10.4908 27.1634 10.348Z" fill="currentColor" />
      </svg>
    );
  }
  if (icon === 'myConcerns') {
    return (
      <svg className="h-full w-full" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.9709 0.164763C13.8656 0.059019 13.7256 0 13.58 0C13.4344 0 13.2943 0.059019 13.1891 0.164763L0.176703 13.2229C0.121441 13.2784 0.0774763 13.3452 0.0474686 13.4191C0.0174609 13.4929 -8.66994e-05 13.6552 0 13.7356V25.9083C0 26.5385 0.238296 27.1428 0.662465 27.5884C1.08664 28.0339 1.66193 28.2843 2.2618 28.2843H9.05426C9.3542 28.2843 9.64185 28.1591 9.85393 27.9363C10.066 27.7135 10.1852 27.4114 10.1852 27.0963V16.9985C10.1852 16.8409 10.2447 16.6898 10.3508 16.5784C10.4568 16.467 10.6006 16.4045 10.7506 16.4045H16.4051C16.5551 16.4045 16.6989 16.467 16.8049 16.5784C16.911 16.6898 16.9706 16.8409 16.9706 16.9985V27.0963C16.9706 27.4114 17.0897 27.7135 17.3018 27.9363C17.5139 28.1591 17.8015 28.2843 18.1015 28.2843H24.8911C25.491 28.2843 26.0663 28.0339 26.4904 27.5884C26.9146 27.1428 27.1529 26.5385 27.1529 25.9083V13.6528C27.153 13.5725 27.1376 13.4929 27.1076 13.4191C27.0775 13.3452 27.0336 13.2784 26.9783 13.2229L13.9709 0.164763Z" fill="currentColor" />
      </svg>
    );
  }
  if (icon === 'chat') {
    return (
      <svg className="h-full w-full" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 27.5V5C2.5 4.3125 2.74479 3.72396 3.23438 3.23438C3.72396 2.74479 4.3125 2.5 5 2.5H25C25.6875 2.5 26.276 2.74479 26.7656 3.23438C27.2552 3.72396 27.5 4.3125 27.5 5V20C27.5 20.6875 27.2552 21.276 26.7656 21.7656C26.276 22.2552 25.6875 22.5 25 22.5H7.5L2.5 27.5Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className="h-full w-full" viewBox="0 0 27 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9.93262" width="6.21992" height="28.2843" fill="currentColor" />
      <rect y="8.48438" width="6.21992" height="19.4454" fill="currentColor" />
      <rect x="19.7988" y="14.1416" width="6.21992" height="14.1421" fill="currentColor" />
    </svg>
  );
}

export function ContentSheet({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <section className={cn('rounded-[var(--qling-radius-content-sheet)] bg-[var(--qling-color-surface)] p-[var(--qling-space-card-padding)] shadow-[var(--qling-shadow-sheet)]', className)}>
      {children}
    </section>
  );
}

export function OrangeHeaderBand({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <section className={cn('rounded-b-[var(--qling-radius-content-sheet)] bg-[var(--qling-color-primary-orange)] px-[var(--qling-space-shell-x)] py-6 text-[var(--qling-color-text)]', className)}>
      {children}
    </section>
  );
}

function CTA({ children, onClick, disabled, processing, type = 'button', accessibilityLabel, variant }: CtaProps & { readonly variant: 'primary' | 'secondary' | 'destructive' }) {
  return (
    <button
      type={type}
      aria-label={accessibilityLabel}
      aria-busy={processing || undefined}
      disabled={disabled || processing}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--qling-radius-cta)] px-5 py-3 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55',
        variant === 'primary' && 'bg-[var(--qling-color-primary-orange)] text-[var(--qling-color-text)] focus:ring-[var(--qling-color-primary-orange)]',
        variant === 'secondary' && 'border border-[var(--qling-color-border)] bg-[var(--qling-color-surface)] text-[var(--qling-color-text)] focus:ring-[var(--qling-color-secondary-orange)]',
        variant === 'destructive' && 'bg-[var(--qling-color-danger)] text-white focus:ring-[var(--qling-color-danger)]',
      )}
    >
      {processing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function PrimaryCTA(props: CtaProps) {
  return <CTA {...props} variant="primary" />;
}

export function SecondaryCTA(props: CtaProps) {
  return <CTA {...props} variant="secondary" />;
}

export function DestructiveCTA(props: CtaProps) {
  return <CTA {...props} variant="destructive" />;
}

function FigmaClover() {
  return (
    <span className="relative mx-auto block h-11 w-11" aria-hidden="true" data-testid="figma-clover">
      <span className="absolute left-[13px] top-[5px] h-[18px] w-[18px] rounded-full bg-[#5cc15a]" />
      <span className="absolute left-[21px] top-[13px] h-[18px] w-[18px] rounded-full bg-[#5cc15a]" />
      <span className="absolute left-[13px] top-[21px] h-[18px] w-[18px] rounded-full bg-[#5cc15a]" />
      <span className="absolute left-[5px] top-[13px] h-[18px] w-[18px] rounded-full bg-[#5cc15a]" />
      <span className="absolute left-[21px] top-[37px] h-2 w-0.5 rounded-[1px] bg-[#5cc15a]" />
    </span>
  );
}

function FigmaModalFrame({
  children,
  labelledBy,
  describedBy,
  busy,
}: {
  readonly children: ReactNode;
  readonly labelledBy: string;
  readonly describedBy?: string;
  readonly busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/32 px-10 pt-[251px]" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-busy={busy || undefined}
        className="w-full max-w-[310px] rounded-[24px] bg-white px-6 pb-[35px] pt-[30px] text-center shadow-[0_12px_40px_rgb(0_0_0/0.18)]"
      >
        {children}
      </section>
    </div>
  );
}

function FigmaModalButton({
  children,
  onClick,
  disabled,
  processing,
  accessibilityLabel,
  variant = 'primary',
}: {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly processing?: boolean;
  readonly accessibilityLabel?: string;
  readonly variant?: 'primary' | 'secondary' | 'destructive';
}) {
  return (
    <button
      type="button"
      aria-label={accessibilityLabel}
      aria-busy={processing || undefined}
      disabled={disabled || processing}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[15px] font-bold leading-[19px] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55',
        variant === 'primary' && 'bg-[#ff8b3d] text-white focus:ring-[#ff8b3d]',
        variant === 'secondary' && 'border border-[#e7ded5] bg-white text-[#1a1a1e] focus:ring-[#ff8b3d]',
        variant === 'destructive' && 'bg-[var(--qling-color-danger)] text-white focus:ring-[var(--qling-color-danger)]',
      )}
    >
      {processing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function QlingSuccessDialog({
  title,
  description,
  accessibilityLabel,
  onConfirm,
}: QlingSuccessDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <FigmaModalFrame labelledBy={titleId} describedBy={descriptionId}>
      <FigmaClover />
      <h1 id={titleId} className="mt-5 text-[19px] font-bold leading-6 text-[#1a1a1e]">
        {title}
      </h1>
      <p id={descriptionId} className="mt-[19px] text-sm font-normal leading-[21px] text-[#6e7076]">
        {description}
      </p>
      <div className="mt-[43px]">
        <FigmaModalButton accessibilityLabel={accessibilityLabel} onClick={onConfirm}>
          확인
        </FigmaModalButton>
      </div>
    </FigmaModalFrame>
  );
}

export function QlingCard({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <article className={cn('rounded-[var(--qling-radius-card)] border border-[var(--qling-color-border)] bg-[var(--qling-color-surface)] p-[var(--qling-space-card-padding)] shadow-[var(--qling-shadow-card)]', className)}>
      {children}
    </article>
  );
}

export function CategoryChip({ label, selected, disabled, onSelect, className }: CategoryChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      style={{ width: categoryChipWidth }}
      className={cn(
        'inline-flex min-h-[var(--qling-category-chip-height)] max-w-full shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--qling-radius-pill)] border px-3 py-1.5 text-center text-sm font-semibold leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-55',
        selected
          ? 'border-[var(--qling-color-primary-orange)] bg-[var(--qling-color-cream-soft)] text-[var(--qling-color-text)]'
          : 'border-[var(--qling-color-border)] bg-[var(--qling-color-surface)] text-[var(--qling-color-muted)]',
        className,
      )}
    >
      {label}
    </button>
  );
}

export function LoadingSpinner({ label = '로딩 중', className }: LoadingSpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex items-center justify-center text-[var(--qling-color-primary-orange)]', className)}>
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function QlingTextArea({
  value,
  onChange,
  maxLength,
  label,
  placeholder,
  errorMessage,
  disabled,
  processing,
}: QlingTextAreaProps) {
  const count = value.length;
  const invalid = Boolean(errorMessage) || count > maxLength;

  return (
    <label className="block space-y-2">
      {label && <span className="text-sm font-bold text-[var(--qling-color-text)]">{label}</span>}
      <textarea
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled || processing}
        aria-invalid={invalid || undefined}
        onChange={event => onChange(event.currentTarget.value)}
        className={cn(
          'box-border min-h-36 w-full resize-y rounded-[var(--qling-radius-input)] border bg-[var(--qling-color-surface)] p-4 text-base leading-7 text-[var(--qling-color-text)] outline-none transition-colors placeholder:text-[var(--qling-color-muted)] disabled:cursor-not-allowed disabled:opacity-60',
          invalid ? 'border-[var(--qling-color-danger)]' : 'border-[var(--qling-color-border)] focus:border-[var(--qling-color-primary-orange)]',
        )}
      />
      <div className="flex items-start justify-between gap-3 text-xs">
        <span className={invalid ? 'text-[var(--qling-color-danger)]' : 'text-[var(--qling-color-muted)]'}>{errorMessage}</span>
        <span className={count > maxLength ? 'text-[var(--qling-color-danger)]' : 'text-[var(--qling-color-muted)]'}>
          {count}/{maxLength}
        </span>
      </div>
    </label>
  );
}

export function QlingDialog({
  isOpen,
  title,
  description,
  cancelLabel,
  confirmLabel,
  destructive,
  processing,
  errorMessage,
  onCancel,
  onConfirm,
}: QlingDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const describedBy = [
    description ? descriptionId : undefined,
    errorMessage ? errorId : undefined,
  ].filter(Boolean).join(' ') || undefined;

  if (!isOpen) return null;

  return (
    <FigmaModalFrame labelledBy={titleId} describedBy={describedBy} busy={processing}>
      <h2 id={titleId} className="text-[19px] font-bold leading-6 text-[#1a1a1e]">{title}</h2>
      {description && <p id={descriptionId} className="mt-[19px] text-sm leading-[21px] text-[#6e7076]">{description}</p>}
      {errorMessage && <p id={errorId} className="mt-3 text-sm font-semibold text-[var(--qling-color-danger)]">{errorMessage}</p>}
      <div className="mt-[43px] flex gap-[var(--qling-space-cta-gap)]">
        <FigmaModalButton onClick={onConfirm} processing={processing} variant={destructive ? 'destructive' : 'primary'}>{confirmLabel}</FigmaModalButton>
        <FigmaModalButton onClick={onCancel} disabled={processing} variant="secondary">{cancelLabel}</FigmaModalButton>
      </div>
    </FigmaModalFrame>
  );
}

export function EmptyState(props: StatusStateProps) {
  return <StatusState icon={<Radio className="h-6 w-6" aria-hidden="true" />} {...props} />;
}

export function LoadingState({ title, message }: StatusStateProps) {
  return <StatusState icon={<LoadingSpinner label={title} />} title={title} message={message} />;
}

export function ErrorState(props: StatusStateProps) {
  return <StatusState icon={<AlertCircle className="h-6 w-6" aria-hidden="true" />} danger {...props} />;
}

function StatusState({ icon, title, message, actionLabel, onAction, danger }: StatusStateProps & { readonly icon: ReactNode; readonly danger?: boolean }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-[var(--qling-radius-card)] border border-[var(--qling-color-border)] bg-[var(--qling-color-surface)] p-6 text-center">
      <div className={cn('mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--qling-color-cream-soft)]', danger ? 'text-[var(--qling-color-danger)]' : 'text-[var(--qling-color-primary-orange)]')}>
        {icon}
      </div>
      <h2 className="text-lg font-bold text-[var(--qling-color-text)]">{title}</h2>
      {message && <p className="mt-2 text-sm leading-6 text-[var(--qling-color-muted)]">{message}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="mt-5 rounded-[var(--qling-radius-small-button)] bg-[var(--qling-color-text)] px-4 py-2 text-sm font-bold text-white">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ProfileMotif({ label = '프로필 모티프' }: ProfileMotifProps) {
  return (
    <div aria-label={label} role="img" className="relative h-16 w-16 shrink-0 rounded-full bg-[#ff8b0d]">
      <span aria-hidden="true" className="absolute left-[25px] top-[18px] h-[25px] w-[17px] overflow-hidden rounded-full bg-white">
        <span className="absolute left-[8px] top-0 h-[25px] w-[14px] rounded-full bg-[#1a1a1e]" />
      </span>
      <span aria-hidden="true" className="absolute left-[43px] top-[18px] h-[25px] w-[17px] overflow-hidden rounded-full bg-white">
        <span className="absolute left-[8px] top-0 h-[25px] w-[14px] rounded-full bg-[#1a1a1e]" />
      </span>
    </div>
  );
}

export function PolicyTextContainer(props: PolicyTextContainerProps) {
  if (props.state === 'body') {
    return (
      <ContentSheet className="space-y-4">
        <h1 className="text-xl font-bold">{props.title}</h1>
        <div className="whitespace-pre-wrap text-sm leading-7 text-[var(--qling-color-muted)]">{props.body}</div>
      </ContentSheet>
    );
  }

  if (props.state === 'error') {
    return <ErrorState title={props.title} message={props.message} actionLabel={props.onRetry ? '다시 시도' : undefined} onAction={props.onRetry} />;
  }

  return <EmptyState title={props.title} message={props.message} />;
}

export function SettingsRow({ label, description, leadingIcon, danger, disabled, accessibilityLabel, showDivider = true, onSelect }: SettingsRowProps) {
  return (
    <button
      type="button"
      aria-label={accessibilityLabel}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex h-12 w-full items-center justify-between gap-3 px-5 py-3 text-left disabled:cursor-not-allowed disabled:opacity-55',
        showDivider && 'border-b border-[var(--qling-color-border)]',
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        {leadingIcon && <span className="shrink-0" aria-hidden="true">{leadingIcon}</span>}
        <span className="min-w-0">
          <span className={cn('block truncate text-[15px] font-semibold leading-[22px]', danger ? 'text-[#ea4335]' : 'text-[#1a1a1e]')}>{label}</span>
          {description && <span className="mt-1 block text-xs leading-5 text-[var(--qling-color-muted)]">{description}</span>}
        </span>
      </span>
      <ChevronRight className="h-[18px] w-[18px] shrink-0 text-[#c2c4c8]" aria-hidden="true" />
    </button>
  );
}

export function SuccessBadge({ label }: { readonly label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[var(--qling-radius-pill)] bg-[rgb(79_159_104/0.12)] px-3 py-1 text-xs font-bold text-[var(--qling-color-success)]">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
