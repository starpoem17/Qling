import React from 'react';
import { createRoot } from 'react-dom/client';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import '../../../../dist/assets/index-BQXwgoUS.css';
import { BottomNavigation, MobileAppShell } from '../../../../src/screens/shared/ui';
import { EditInterestsScreen, MyPageScreen, PolicyScreen } from '../../../../src/screens/myPage/MyPageScreen';
import { MyAnswersScreen } from '../../../../src/screens/myPage/MyAnswersScreen';
import { HELPED_COUNT_LABEL, MY_PAGE_SETTING_ITEMS } from '../../../../src/screens/myPage/contract';

const screen = new URLSearchParams(window.location.search).get('screen') ?? '10';

function Shell({ children, tab = '마이페이지', bottom = true }: {
  readonly children: React.ReactNode;
  readonly tab?: '답변하기' | '나의 고민' | '마이페이지';
  readonly bottom?: boolean;
}) {
  return (
    <MobileAppShell
      hasBottomNavigation={bottom}
      mainClassName="min-h-[852px] bg-[#ff8b0d] pt-0"
      bottomNavigation={bottom ? (
        <BottomNavigation
          activeTab={tab}
          tabs={[
            { tab: '답변하기', label: '답변하기' },
            { tab: '나의 고민', label: '나의 고민' },
            { tab: '마이페이지', label: '마이페이지' },
          ]}
          onSelectTab={() => undefined}
        />
      ) : undefined}
    >
      {children}
    </MobileAppShell>
  );
}

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

function HarnessScreen() {
  if (screen === '12') {
    return (
      <Shell bottom={false}>
        <EditInterestsScreen
          categoryOptions={WORRY_CATEGORIES}
          selectedInterests={['진로', '소득', '자존감', '미래']}
          validationMessages={{}}
          isProcessing={false}
          onBack={() => undefined}
          onInterestToggle={() => undefined}
          onSubmit={() => undefined}
        />
      </Shell>
    );
  }

  if (screen === '13') {
    return (
      <Shell>
        <MyAnswersScreen
          state={{ status: 'ready' }}
          items={answerItems}
          onBack={() => undefined}
        />
      </Shell>
    );
  }

  if (screen === '14') {
    return (
      <Shell>
        <PolicyScreen
          policy="privacy_policy"
          title="개인정보처리방침"
          body={'수집 데이터:\\n- 구글 계정 정보와 서비스 사용 데이터\\n- 고민과 답변 내용\\n\\n보관 기간:\\n- 탈퇴 시 관련 계정 데이터를 삭제합니다.\\n\\n데이터 활용:\\n- 모든 텍스트 데이터는 AI 매칭 품질 개선에 사용될 수 있습니다.'}
          state={{ status: 'ready' }}
          onBack={() => undefined}
        />
      </Shell>
    );
  }

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
        logoutConfirmation={{ isOpen: false, isProcessing: false, onCancel: () => undefined, onConfirm: () => undefined }}
        accountDeletionConfirmation={{ isOpen: false, isProcessing: false, onCancel: () => undefined, onConfirm: () => undefined }}
        onEditInterests={() => undefined}
        onOpenMyAnswers={() => undefined}
        onSettingSelect={() => undefined}
      />
    </Shell>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<HarnessScreen />);
