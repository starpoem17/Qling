import { AlertCircle } from 'lucide-react';
import type { LoginScreenProps } from './contract';

function GoogleMark() {
  return (
    <svg className="absolute left-[14px] top-[11px] h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function LoginScreen({
  sessionState,
  errorMessage,
  isProcessing,
  disabled,
  onSignIn,
}: LoginScreenProps) {
  const isDisabled = disabled || isProcessing || sessionState === 'checking';
  const buttonLabel = isProcessing || sessionState === 'signing-in' ? '로그인 중입니다' : 'Google로 로그인';

  return (
    <div className="qling-reference-root qling-login-root">
      <main className="qling-reference-canvas qling-login-canvas" aria-label="로그인">
        <h1 className="absolute left-[29px] top-[276px] m-0 w-[244px] text-[58px] font-black leading-[1.3] tracking-[-2.9px] text-[var(--qling-ref-login-text)]">
          고민끝에<br />
          큐링
        </h1>
        <div className="absolute left-[322px] top-[404px] h-[22px] w-[22px] rounded-full bg-[var(--qling-ref-login-orange)]" aria-hidden="true" />
        <div className="absolute left-[85px] top-[563px] h-[2px] w-[222px] rounded-[3px] bg-[var(--qling-ref-login-divider)]" aria-hidden="true" />

        {errorMessage && (
          <div
            className="absolute bottom-[200px] left-1/2 flex w-[345px] -translate-x-1/2 items-start gap-2 rounded-[10px] border border-[rgb(216_75_75/0.22)] bg-[rgb(255_255_255/0.7)] px-3 py-2 text-[12px] font-bold leading-[16px] text-[var(--qling-color-danger)]"
            role="alert"
          >
            <AlertCircle className="mt-[1px] h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={(event) => {
          event.preventDefault();
          if (!isDisabled) onSignIn();
        }}>
          <button
            type="submit"
            aria-label={buttonLabel}
            aria-busy={isProcessing || sessionState === 'signing-in' || undefined}
            disabled={isDisabled}
            className="absolute bottom-[142px] left-1/2 h-[47px] w-[345px] -translate-x-1/2 rounded-[28px] border border-[#dadce0] bg-white text-[17px] font-black tracking-[-0.85px] text-[var(--qling-ref-login-text)] shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!isProcessing && sessionState !== 'signing-in' && <GoogleMark />}
            <span className="absolute left-[116px] top-[12px] whitespace-nowrap leading-normal">{buttonLabel}</span>
          </button>
        </form>

        <p className="absolute bottom-[69px] left-1/2 m-0 w-[385px] -translate-x-1/2 text-center text-[11px] font-bold leading-[18px] tracking-[-0.55px] text-[var(--qling-ref-login-policy)]">
          로그인 시 큐링의 개인정보처리방침 및 이용 약관에 동의하는 것으로 간주합니다
        </p>
      </main>
    </div>
  );
}
