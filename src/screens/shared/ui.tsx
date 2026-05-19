import { useId, type ReactNode } from 'react';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  House,
  Loader2,
  Send,
  Radio,
  UserRound,
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
    답변하기: <House className="h-6 w-6" aria-hidden="true" />,
    '나의 고민': <Send className="h-6 w-6" aria-hidden="true" />,
    마이페이지: <UserRound className="h-5 w-5" aria-hidden="true" />,
  };
  const visibleTabs = tabs.filter(tab => tab.tab !== '마이페이지');
  const indicatorPositionClass = activeTab === '답변하기'
    ? '-translate-x-1/2'
    : activeTab === '나의 고민'
      ? 'translate-x-1/2'
      : '-translate-x-1/2';

  return (
    <nav
      aria-label="주요 화면"
      className="fixed bottom-0 left-1/2 z-50 h-[97px] w-full max-w-[var(--qling-mobile-canvas-width)] -translate-x-1/2 bg-[#fff5eb]"
      style={{ paddingBottom: 'var(--qling-space-safe-bottom)' }}
    >
      <div
        aria-hidden="true"
        role="presentation"
        data-testid="bottom-navigation-central-indicator"
        data-indicator-state={activeTab}
        className={cn(
          'pointer-events-none absolute left-1/2 top-[9px] flex h-[59px] w-[95px] items-center justify-center rounded-[29px] bg-[#ff8b3d] text-[#2a2a2a] transition-transform',
          indicatorPositionClass,
        )}
      >
        <span className="relative block h-full w-full" aria-hidden="true">
          <svg className="absolute left-[14px] top-[15px]" width="17" height="26" viewBox="0 0 17 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.8497 12.7299C16.97 23.6896 13.0814 25.4598 8.43297 25.4598C3.78452 25.4598 -0.289859 23.087 0.0162047 12.7299C0.322268 2.37274 3.78452 1.71661e-05 8.43297 1.71661e-05C13.0814 1.71661e-05 16.7295 1.77015 16.8497 12.7299Z" fill="#FFF5EB" />
            <mask id="bottom-navigation-left-eye-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="17" height="26">
              <path d="M8.44531 1.00002C10.6606 1.00007 12.3637 1.42299 13.5908 2.89748C14.8732 4.43845 15.8145 7.33004 15.874 12.7569C15.9334 18.1729 14.9891 21.0535 13.6875 22.5869C12.4315 24.0665 10.6652 24.4912 8.44531 24.4912C6.28278 24.4912 4.44319 23.9447 3.14062 22.3701C1.80394 20.7543 0.865303 17.8616 1.01562 12.7754C1.16686 7.65838 2.09957 4.73758 3.38574 3.10256C4.61627 1.53836 6.29704 1.00002 8.44531 1.00002Z" fill="#FFF5EB" stroke="black" strokeWidth="2" />
            </mask>
            <g mask="url(#bottom-navigation-left-eye-mask)">
              <path d="M9.56676 13.254C9.56676 18.3804 6.74704 22.5363 3.26873 22.5363C-0.209573 22.5363 -3.0293 20.1811 -3.0293 13.254C-3.0293 8.12752 -0.209573 3.9717 3.26873 3.9717C6.74704 3.9717 9.56676 8.12752 9.56676 13.254Z" fill="#1A1A1A" />
            </g>
          </svg>
          <svg className="absolute left-[33px] top-[15px]" width="17" height="26" viewBox="0 0 17 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.8497 12.7299C16.97 23.6896 13.0814 25.4598 8.43297 25.4598C3.78452 25.4598 -0.289859 23.087 0.0162047 12.7299C0.322268 2.37274 3.78452 1.71661e-05 8.43297 1.71661e-05C13.0814 1.71661e-05 16.7295 1.77015 16.8497 12.7299Z" fill="#FFF5EB" />
            <mask id="bottom-navigation-right-eye-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="17" height="26">
              <path d="M8.44531 1.00002C10.6606 1.00007 12.3637 1.42299 13.5908 2.89748C14.8732 4.43845 15.8145 7.33004 15.874 12.7569C15.9334 18.1729 14.9891 21.0535 13.6875 22.5869C12.4315 24.0665 10.6652 24.4912 8.44531 24.4912C6.28278 24.4912 4.44319 23.9447 3.14062 22.3701C1.80394 20.7543 0.865303 17.8616 1.01562 12.7754C1.16686 7.65838 2.09957 4.73758 3.38574 3.10256C4.61627 1.53836 6.29704 1.00002 8.44531 1.00002Z" fill="#FFF5EB" stroke="black" strokeWidth="2" />
            </mask>
            <g mask="url(#bottom-navigation-right-eye-mask)">
              <path d="M9.56676 13.254C9.56676 18.3804 6.74704 22.5363 3.26873 22.5363C-0.209573 22.5363 -3.0293 20.1811 -3.0293 13.254C-3.0293 8.12752 -0.209573 3.9717 3.26873 3.9717C6.74704 3.9717 9.56676 8.12752 9.56676 13.254Z" fill="#1A1A1A" />
            </g>
          </svg>
        </span>
      </div>
      <div className="mx-auto grid h-full grid-cols-2 gap-[130px] px-4 pt-[37px]">
        {visibleTabs.map(({ tab, label }) => {
          const isActive = activeTab === tab || activeTab === '마이페이지';
          return (
            <button
              key={tab}
              type="button"
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectTab(tab)}
              className={cn(
                'flex h-9 min-w-0 items-center justify-center rounded-[7px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2',
                isActive
                  ? 'bg-[#fae5d7] text-[#ff8b3d]'
                  : 'bg-[#dadce0] text-[#b8b8b8] hover:bg-[#d0d2d6]',
              )}
            >
              {iconByTab[tab]}
              <span className="sr-only">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
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
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[246px] backdrop-blur-sm" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        aria-busy={processing || undefined}
        className="w-full max-w-[310px] rounded-[var(--qling-radius-modal)] bg-[var(--qling-color-surface)] px-6 py-8 shadow-[var(--qling-shadow-modal)]"
      >
        <h2 id={titleId} className="text-lg font-bold text-[var(--qling-color-text)]">{title}</h2>
        {description && <p id={descriptionId} className="mt-2 text-sm leading-6 text-[var(--qling-color-muted)]">{description}</p>}
        {errorMessage && <p id={errorId} className="mt-3 text-sm font-semibold text-[var(--qling-color-danger)]">{errorMessage}</p>}
        <div className="mt-6 flex gap-[var(--qling-space-cta-gap)]">
          <PrimaryCTA onClick={onConfirm} processing={processing}>{confirmLabel}</PrimaryCTA>
          <SecondaryCTA onClick={onCancel} disabled={processing}>{cancelLabel}</SecondaryCTA>
        </div>
      </section>
    </div>
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
    <div aria-label={label} role="img" className="relative h-20 w-20 rounded-full bg-[var(--qling-color-cream-soft)] shadow-[var(--qling-shadow-card)]">
      <div className="absolute left-1/2 top-1/2 h-9 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--qling-color-surface)]" />
      <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--qling-color-primary-orange)]" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--qling-color-text)]" />
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

export function SettingsRow({ label, description, danger, disabled, accessibilityLabel, onSelect }: SettingsRowProps) {
  return (
    <button
      type="button"
      aria-label={accessibilityLabel}
      disabled={disabled}
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-4 border-b border-[var(--qling-color-border)] py-4 text-left disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span className="min-w-0">
        <span className={cn('block text-sm font-bold', danger ? 'text-[var(--qling-color-danger)]' : 'text-[var(--qling-color-text)]')}>{label}</span>
        {description && <span className="mt-1 block text-xs leading-5 text-[var(--qling-color-muted)]">{description}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--qling-color-muted)]" aria-hidden="true" />
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
