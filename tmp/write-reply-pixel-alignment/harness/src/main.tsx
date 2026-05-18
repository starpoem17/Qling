import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../dist/assets/index-DDqBtg_f.css';
import { WriteFormScreen } from '../../../../src/screens/writeForm/WriteFormScreen';
import { WriteReplySuccessScreen } from '../../../../src/screens/writeForm/WriteReplySuccessScreen';
import { BottomNavigation, MobileAppShell } from '../../../../src/screens/shared/ui';

const root = document.getElementById('root');
const screen = new URLSearchParams(window.location.search).get('screen') ?? '17';

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
  value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  characterCount: 201,
  maxLength: 1000,
  validation: { status: 'valid' as const },
  moderation: { status: 'idle' as const },
  isProcessing: false,
};

const originalWorry = {
  deliveryId: 'delivery-1',
  worryId: 'worry-1',
  category: '외모' as const,
  summaryText: '꾸미고 싶긴 한데 안 꾸며봐서 어떻게 꾸며야 할 지...',
  originalBodyText: '꾸미고 싶긴 한데 안 꾸며봐서 어떻게 꾸며야 할 지 잘 모르겠어요, 뭐부터 하는게 좋을까요',
  receivedAt: { label: '2026.05.02', isoValue: '2026-05-02T00:00:00.000Z' },
};

const form = (
  <WriteFormScreen
    kind="write-reply"
    originalWorry={originalWorry}
    draft={screen === '19' ? filledDraft : emptyDraft}
    isOriginalOverlayOpen={screen === '18'}
    onBack={() => undefined}
    onDraftChange={() => undefined}
    onOpenOriginal={() => undefined}
    onCloseOriginal={() => undefined}
    onPublish={() => undefined}
  />
);

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
          activeTab="답변하기"
          onSelectTab={() => undefined}
        />
      )}
    >
      {form}
      {screen === '19' && <WriteReplySuccessScreen onConfirm={() => undefined} />}
    </MobileAppShell>
  </React.StrictMode>,
);
