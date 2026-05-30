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
  const iconByTab: Record<BottomNavigationTab, ReactNode> = {
    답변하기: <BottomNavAnswerIcon />,
    '나의 고민': <BottomNavHomeIcon />,
    채팅: <BottomNavChatIcon />,
    순위: <BottomNavRankingIcon />,
  };

  return (
    <nav
      aria-label="주요 화면"
      className="fixed bottom-0 left-1/2 z-50 h-[80px] w-full max-w-[var(--qling-mobile-canvas-max-width)] -translate-x-1/2 bg-[#fff5eb]"
      style={{ paddingBottom: 'var(--qling-space-safe-bottom)' }}
    >
      <div className="grid h-full grid-cols-4">
        {tabs.map(({ tab, label }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectTab(tab)}
              className={cn(
                'flex min-w-0 flex-col items-center justify-start gap-[5px] pt-[14px] text-[13px] font-bold leading-[13px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset',
                isActive ? 'text-[#ff8b3d]' : 'text-[#c5bdad] hover:text-[#a89f8e]',
              )}
            >
              {iconByTab[tab]}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function BottomNavAnswerIcon() {
  return (
    <svg className="h-[34px] w-[39px]" viewBox="0 0 39 34" fill="none" aria-hidden="true">
      <path
        d="M36.8 2.2 6.1 15.4c-2 .9-2 3.8.1 4.5l8 2.7 3.2 8.4c.8 2 3.5 2.1 4.5.2L38.5 4.4c.8-1.4-.3-3-1.7-2.2Z"
        fill="currentColor"
      />
      <path
        d="m16.1 22.7 3.9 5.7 3.1-11.7 9.1-8.5-12.5 7.1-3.6 7.4Z"
        fill="#fff5eb"
        fillOpacity="0.72"
      />
    </svg>
  );
}

function BottomNavHomeIcon() {
  return (
    <svg className="h-[30px] w-[30px]" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <path
        d="M3 13.3 14.2 3.2a1.2 1.2 0 0 1 1.6 0L27 13.3c.8.7.3 2-.8 2h-1.7v10.2c0 .8-.7 1.5-1.5 1.5h-5.4v-7.8h-5.2V27H7c-.8 0-1.5-.7-1.5-1.5V15.3H3.8c-1.1 0-1.6-1.3-.8-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BottomNavChatIcon() {
  return (
    <svg className="h-[30px] w-[30px]" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <path
        d="M4.2 5.2A3.2 3.2 0 0 1 7.4 2h15.2a3.2 3.2 0 0 1 3.2 3.2v12.9a3.2 3.2 0 0 1-3.2 3.2h-8.8l-6.2 5.4c-1.3 1.1-3.4.2-3.4-1.5v-20Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BottomNavRankingIcon() {
  return (
    <svg className="h-[28px] w-[26px]" viewBox="0 0 26 28" fill="none" aria-hidden="true">
      <path d="M1 14h5v13H1V14Z" fill="currentColor" />
      <path d="M10.5 7h5v20h-5V7Z" fill="currentColor" />
      <path d="M20 1h5v26h-5V1Z" fill="currentColor" />
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
