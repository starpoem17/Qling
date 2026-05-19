import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../src/index.css';
import { LoadingShellScreen } from '../../../../src/screens/loadingShell/LoadingShellScreen';
import { LoginScreen } from '../../../../src/screens/loadingShell/LoginScreen';

const root = document.getElementById('root');
const screen = new URLSearchParams(window.location.search).get('screen') ?? '01';

if (!root) {
  throw new Error('Harness root missing');
}

createRoot(root).render(
  <React.StrictMode>
    {screen === '02' ? (
      <LoginScreen
        sessionState="signed-out"
        isProcessing={false}
        disabled={false}
        onSignIn={() => undefined}
      />
    ) : (
      <LoadingShellScreen
        reason="splash"
        accessibleLabel="Qling 시작 화면"
      />
    )}
  </React.StrictMode>,
);
