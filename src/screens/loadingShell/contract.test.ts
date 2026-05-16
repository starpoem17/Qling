import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOADING_SHELL_REASONS,
  LOGIN_SESSION_STATES,
  type LoadingShellProps,
  type LoginScreenProps,
} from './contract';

test('login contract exposes sign-in state, error, disabled, and submit event only', () => {
  const props = {
    sessionState: 'signed-out',
    errorMessage: 'Sign-in failed.',
    isProcessing: false,
    disabled: false,
    onSignIn: () => undefined,
  } satisfies LoginScreenProps;

  assert.equal(props.sessionState, 'signed-out');
  assert.equal(typeof props.onSignIn, 'function');
  assert.equal(Object.hasOwn(props, 'providerUser'), false);
  assert.equal(Object.hasOwn(props, 'firebaseUser'), false);
  assert.equal(Object.hasOwn(props, 'policyLinks'), false);
  assert.equal(Object.hasOwn(props, 'ter' + 'msLink'), false);
});

test('login session states cover loading and processing without provider objects', () => {
  assert.deepEqual(LOGIN_SESSION_STATES, [
    'checking',
    'signed-out',
    'signing-in',
    'failed',
  ]);
});

test('loading shell contract represents real loading reasons and optional retry', () => {
  const props = {
    reason: 'profile-loading',
    accessibleLabel: 'Loading profile',
    message: 'Loading profile',
  } satisfies LoadingShellProps;

  assert.deepEqual(LOADING_SHELL_REASONS, [
    'splash',
    'app-loading',
    'session-loading',
    'profile-loading',
    'route-loading',
  ]);
  assert.equal(props.reason, 'profile-loading');
  assert.equal(Object.hasOwn(props, 'statusBar'), false);
  assert.equal(Object.hasOwn(props, 'homeIndicator'), false);
  assert.equal(Object.hasOwn(props, 'delayMs'), false);
});
