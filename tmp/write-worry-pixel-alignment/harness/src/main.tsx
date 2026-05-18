import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../dist/assets/index-DTVG-aYc.css';
import { WriteWorryScreen } from '../../../../src/screens/writeForm/WriteWorryScreen';
import { WriteWorrySuccessScreen } from '../../../../src/screens/writeForm/WriteWorrySuccessScreen';
import { BottomNavigation, MobileAppShell } from '../../../../src/screens/shared/ui';

const root = document.getElementById('root');
const screen = new URLSearchParams(window.location.search).get('screen') ?? '07';

if (!root) {
  throw new Error('Harness root missing');
}

const emptyDraft = {
  value: '',
  characterCount: 0,
  maxLength: 1000,
  validation: { status: 'invalid' as const, message: '내용을 입력해주세요.' },
  moderation: { status: 'idle' as const },
  isProcessing: false,
  submitDisabledReason: 'empty' as const,
};

const filledDraft = {
  value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  characterCount: 302,
  maxLength: 1000,
  validation: { status: 'valid' as const },
  moderation: { status: 'idle' as const },
  isProcessing: false,
};

createRoot(root).render(
  <React.StrictMode>
    <MobileAppShell
      hasBottomNavigation
      mainClassName="pt-6"
      bottomNavigation={(
        <BottomNavigation
          tabs={[
            { tab: '답변하기', label: '답변하기' },
            { tab: '나의 고민', label: '나의 고민' },
            { tab: '마이페이지', label: '마이페이지' },
          ]}
          activeTab="나의 고민"
          onSelectTab={() => undefined}
        />
      )}
    >
      {screen === '09' ? (
        <>
          <WriteWorryScreen
            draft={filledDraft}
            onBack={() => undefined}
            onDraftChange={() => undefined}
            onPublish={() => undefined}
          />
          <WriteWorrySuccessScreen onConfirm={() => undefined} />
        </>
      ) : (
        <WriteWorryScreen
          draft={emptyDraft}
          onBack={() => undefined}
          onDraftChange={() => undefined}
          onPublish={() => undefined}
        />
      )}
    </MobileAppShell>
  </React.StrictMode>,
);
