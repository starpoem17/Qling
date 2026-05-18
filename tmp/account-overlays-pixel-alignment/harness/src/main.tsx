import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../dist/assets/index-C3DbL80N.css';
import { BottomNavigation, MobileAppShell } from '../../../../src/screens/shared/ui';
import { MyPageScreen } from '../../../../src/screens/myPage/MyPageScreen';
import { HELPED_COUNT_LABEL, MY_PAGE_SETTING_ITEMS } from '../../../../src/screens/myPage/contract';

const screen = new URLSearchParams(window.location.search).get('screen') ?? '15';

const answerItems = [
  {
    replyId: 'reply-1',
    deliveryId: 'delivery-1',
    worryId: 'worry-1',
    previewText: '누구나 그런 시기가 있는 것 같아요. 저도 비슷한 경험이 있는데 앞으로 잘 해내실거라 믿습니다.',
    originalWorryPreview: '주변 친구들은 원하는대로 잘하고 있는 것 같은데 저만 뒤처지는 기분이 들어요..',
    categoryLabel: '자존감',
    dateLabel: '2026.05.02',
    hasReceivedHeart: false,
    accessibilityLabel: '내가 쓴 답변, 카테고리 자존감, 피드백 없음',
  },
  {
    replyId: 'reply-2',
    deliveryId: 'delivery-2',
    worryId: 'worry-2',
    previewText: '자신이 무엇을 좋아하는지 천천히 찾아가는 과정도 필요한거 같아요. 저는 개인적으로 삼성라이온즈 추천합니다.',
    originalWorryPreview: '야구 팀 하나 정해서 응원하려고 하는데 무슨 팀으로 할까요',
    categoryLabel: '잡담',
    dateLabel: '2026.05.01',
    hasReceivedHeart: true,
    feedbackLabel: '받은 하트',
    accessibilityLabel: '내가 쓴 답변, 카테고리 잡담, 피드백 받은 하트',
  },
];

function Shell({ children }: { readonly children: React.ReactNode }) {
  return (
    <MobileAppShell
      hasBottomNavigation
      mainClassName="min-h-[852px] bg-[#ff8b0d] pt-0"
      bottomNavigation={(
        <BottomNavigation
          activeTab="마이페이지"
          tabs={[
            { tab: '답변하기', label: '답변하기' },
            { tab: '나의 고민', label: '나의 고민' },
            { tab: '마이페이지', label: '마이페이지' },
          ]}
          onSelectTab={() => undefined}
        />
      )}
    >
      {children}
    </MobileAppShell>
  );
}

function HarnessScreen() {
  return (
    <Shell>
      <MyPageScreen
        profile={{
          nickname: '라미',
          helpedCount: 314,
          helpedCountLabel: HELPED_COUNT_LABEL,
          profileMotif: { kind: 'visual-only', label: '프로필 모티프' },
        }}
        answerPreviewItems={answerItems}
        settings={MY_PAGE_SETTING_ITEMS}
        pushSettings={{
          status: 'default',
          enabled: false,
          message: '켜면 브라우저 알림 권한 요청과 푸시 등록을 시도합니다.',
          onToggle: () => undefined,
        }}
        logoutConfirmation={{
          isOpen: screen === '15',
          isProcessing: false,
          onCancel: () => undefined,
          onConfirm: () => undefined,
        }}
        accountDeletionConfirmation={{
          isOpen: screen === '16',
          isProcessing: false,
          onCancel: () => undefined,
          onConfirm: () => undefined,
        }}
        onEditInterests={() => undefined}
        onOpenMyAnswers={() => undefined}
        onSettingSelect={() => undefined}
      />
    </Shell>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<HarnessScreen />);
