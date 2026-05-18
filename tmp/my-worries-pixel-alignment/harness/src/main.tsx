import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../dist/assets/index-DdTfDWHy.css';
import { MyWorriesScreen } from '../../../../src/screens/myPage/MyWorriesScreen';
import { BottomNavigation, MobileAppShell } from '../../../../src/screens/shared/ui';

const root = document.getElementById('root');
const isEmpty = new URLSearchParams(window.location.search).get('state') === 'empty';

if (!root) {
  throw new Error('Harness root missing');
}

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
      <MyWorriesScreen
        state={isEmpty ? { status: 'empty', message: '첫 고민을 남겨보세요.' } : { status: 'ready' }}
        items={isEmpty ? [] : [
          {
            worryId: 'worry-1',
            categoryLabel: '외모',
            createdAtLabel: '2026.05.02',
            summaryText: '꾸미고 싶은데 안 꾸며봐서 어떻게 꾸며야 할 지 잘 모르겠어요, 뭐부터 하는게 좋을까요',
            replyCountLabel: '5명이 답변했어요',
            hasUnreadReplies: false,
            accessibilityLabel: '답변 확인으로 이동, 카테고리 외모, 작성일 2026.05.02, 5명이 답변했어요',
          },
          {
            worryId: 'worry-2',
            categoryLabel: '자존감',
            createdAtLabel: '2026.04.28',
            summaryText: '칭찬을 들어도 진심으로 받아들이기 어려워요',
            replyCountLabel: '7명이 답변했어요',
            hasUnreadReplies: false,
            accessibilityLabel: '답변 확인으로 이동, 카테고리 자존감, 작성일 2026.04.28, 7명이 답변했어요',
          },
        ]}
        onWriteWorry={() => undefined}
        onOpenMyPage={() => undefined}
        onSelectWorryForAnswers={() => undefined}
      />
    </MobileAppShell>
  </React.StrictMode>,
);
