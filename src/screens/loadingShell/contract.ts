export const LOGIN_SESSION_STATES = [
  'checking',
  'signed-out',
  'signing-in',
  'failed',
] as const;

export type LoginSessionState = (typeof LOGIN_SESSION_STATES)[number];

export type LoginScreenProps = {
  readonly sessionState: LoginSessionState;
  readonly errorMessage?: string;
  readonly isProcessing: boolean;
  readonly disabled: boolean;
  readonly onSignIn: () => void;
};

export const LOADING_SHELL_REASONS = [
  'splash',
  'app-loading',
  'session-loading',
  'profile-loading',
  'route-loading',
] as const;

export type LoadingShellReason = (typeof LOADING_SHELL_REASONS)[number];

export type LoadingShellProps = {
  readonly reason: LoadingShellReason;
  readonly accessibleLabel: string;
  readonly message?: string;
  readonly retry?: {
    readonly label: string;
    readonly onRetry: () => void;
  };
};
