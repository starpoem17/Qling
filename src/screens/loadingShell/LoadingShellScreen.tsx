import { Loader2 } from 'lucide-react';
import { MobileAppShell, ProfileMotif } from '../shared/ui';
import type { LoadingShellProps } from './contract';

const eyePaths = {
  leftMask: 'M44.0629 37.4898C44.3773 69.7665 34.2086 74.9796 22.0526 74.9796C9.89671 74.9796 -0.757995 67.9919 0.0423761 37.4898C0.842747 6.98776 9.89671 1.72574e-05 22.0526 1.72574e-05C34.2086 1.72574e-05 43.7485 5.2131 44.0629 37.4898Z',
  rightPupil: 'M102.026 38.984C102.026 54.0626 94.6623 66.2863 85.5792 66.2863C76.4961 66.2863 69.1328 59.3589 69.1328 38.984C69.1328 23.9053 76.4961 11.6816 85.5792 11.6816C94.6623 11.6816 102.026 23.9053 102.026 38.984Z',
  leftEye: 'M42.9931 37.9796C43.2999 69.8346 33.378 74.9796 21.5172 74.9796C9.65642 74.9796 -0.739591 68.0832 0.0413472 37.9796C0.822286 7.87606 9.65642 0.979614 21.5172 0.979614C33.378 0.979614 42.6863 6.12458 42.9931 37.9796Z',
  rightEye: 'M94.9928 37.9796C95.3138 69.8346 84.9305 74.9796 72.518 74.9796C60.1056 74.9796 49.226 68.0832 50.0433 37.9796C50.8605 7.87606 60.1056 0.979614 72.518 0.979614C84.9305 0.979614 94.6717 6.12458 94.9928 37.9796Z',
  leftPupil: 'M51.0956 38.984C51.0956 54.0626 43.7323 66.2863 34.6492 66.2863C25.5661 66.2863 18.2028 59.3589 18.2028 38.984C18.2028 23.9053 25.5661 11.6816 34.6492 11.6816C43.7323 11.6816 51.0956 23.9053 51.0956 38.984Z',
  rightMask: 'M94.9929 37.4898C95.3073 69.7665 85.1386 74.9796 72.9827 74.9796C60.8267 74.9796 50.172 67.9919 50.9724 37.4898C51.7728 6.98776 60.8267 1.72574e-05 72.9827 1.72574e-05C85.1386 1.72574e-05 94.6785 5.2131 94.9929 37.4898Z',
} as const;

const loadingCopyByReason: Record<LoadingShellProps['reason'], string> = {
  splash: '큐링을 여는 중입니다.',
  'app-loading': '앱을 준비하는 중입니다.',
  'session-loading': '로그인 상태를 확인하는 중입니다.',
  'profile-loading': '프로필을 불러오는 중입니다.',
  'route-loading': '화면을 불러오는 중입니다.',
};

function SplashEyes() {
  return (
    <svg
      className="h-[74.98px] w-[95px]"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 95 74.9796"
      aria-hidden="true"
    >
      <path d={eyePaths.leftEye} fill="var(--qling-ref-splash-cream)" />
      <mask id="qling-splash-left-eye-mask" height="75" maskUnits="userSpaceOnUse" width="45" x="0" y="0">
        <path d={eyePaths.leftMask} fill="var(--qling-ref-splash-cream)" />
      </mask>
      <g mask="url(#qling-splash-left-eye-mask)">
        <path d={eyePaths.leftPupil} fill="var(--qling-ref-splash-text)" />
      </g>
      <path d={eyePaths.rightEye} fill="var(--qling-ref-splash-cream)" />
      <mask id="qling-splash-right-eye-mask" height="75" maskUnits="userSpaceOnUse" width="45" x="50" y="0">
        <path d={eyePaths.rightMask} fill="var(--qling-ref-splash-cream)" />
      </mask>
      <g mask="url(#qling-splash-right-eye-mask)">
        <path d={eyePaths.rightPupil} fill="var(--qling-ref-splash-text)" />
      </g>
    </svg>
  );
}

function ReferenceSplashScreen({ accessibleLabel, visibleMessage }: {
  readonly accessibleLabel: string;
  readonly visibleMessage: string;
}) {
  return (
    <div className="qling-reference-root qling-splash-root">
      <section className="qling-reference-canvas qling-splash-canvas" aria-label={accessibleLabel}>
        <div className="absolute left-1/2 top-[351px] -translate-x-1/2">
          <SplashEyes />
        </div>
        <p className="absolute left-1/2 bottom-[120px] -translate-x-1/2 m-0 whitespace-nowrap text-[30px] font-black leading-normal tracking-[1.2px] text-[var(--qling-ref-splash-cream)]">
          {' Qling'}
        </p>
        <p className="sr-only" role="status" aria-live="polite">{visibleMessage}</p>
      </section>
    </div>
  );
}

export function LoadingShellScreen({ reason, accessibleLabel, message }: LoadingShellProps) {
  const visibleMessage = message ?? loadingCopyByReason[reason];

  if (reason === 'splash' || reason === 'session-loading') {
    return <ReferenceSplashScreen accessibleLabel={accessibleLabel} visibleMessage={visibleMessage} />;
  }

  return (
    <MobileAppShell mainClassName="flex min-h-dvh max-w-none items-stretch px-0 pb-0">
      <section
        className="flex min-h-dvh w-full flex-col items-center justify-center bg-[var(--qling-color-primary-orange)] px-[var(--qling-space-shell-x)] py-[calc(3rem+var(--qling-space-safe-bottom))] text-center text-[var(--qling-color-text)]"
        aria-label={accessibleLabel}
      >
        <div className="flex min-h-[22rem] w-full max-w-sm flex-col items-center justify-center gap-8">
          <ProfileMotif label="Qling" />
          <div className="space-y-3" role="status" aria-live="polite">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--qling-color-text)]" aria-hidden="true" />
            <p className="text-sm font-bold text-[var(--qling-color-text)]">{visibleMessage}</p>
          </div>
        </div>
        <p className="mt-auto pb-[var(--qling-space-safe-bottom)] text-3xl font-black tracking-normal text-[var(--qling-color-text)]">
          Qling
        </p>
      </section>
    </MobileAppShell>
  );
}
