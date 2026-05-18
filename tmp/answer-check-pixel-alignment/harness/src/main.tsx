import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../dist/assets/index-mADDKTUL.css';
import { AnswerCheckScreen } from '../../../../src/screens/answerCheck/AnswerCheckScreen';
import { BottomNavigation, MobileAppShell } from '../../../../src/screens/shared/ui';

const replies = [
  {
    replyId: 'reply-1',
    bodyText: '너무 완벽하게 꾸미려고 하지 않아도 괜찮아요. 작은 변화부터 해보면 생각보다 금방 감이 생길 거예요.',
    createdAtLabel: '방금 전',
    feedbackState: 'none' as const,
    canLike: true,
    canDislike: true,
    canComment: false,
    isFeedbackProcessing: false,
    isCommentProcessing: false,
  },
  {
    replyId: 'reply-2',
    bodyText: '처음에는 편한 옷에 포인트 하나만 더해보세요. 색 하나, 신발 하나처럼 작게 시작하면 부담이 줄어요.',
    createdAtLabel: '12분 전',
    feedbackState: 'liked' as const,
    canLike: true,
    canDislike: false,
    canComment: true,
    isFeedbackProcessing: false,
    isCommentProcessing: false,
  },
];

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MobileAppShell
      hasBottomNavigation
      mainClassName="pt-6"
      bottomNavigation={
        <BottomNavigation
          tabs={[
            { tab: '답변하기', label: '답변하기' },
            { tab: '나의 고민', label: '나의 고민' },
            { tab: '마이페이지', label: '마이페이지' },
          ]}
          activeTab="나의 고민"
          onSelectTab={() => undefined}
        />
      }
    >
      <AnswerCheckScreen
        state={{ status: 'ready' }}
        worry={{
          worryId: 'worry-1',
          bodyText: '꾸미고 싶은데 안 꾸며봐서 어떻게 꾸며야 할 지 잘 모르겠어요. 어디서부터 시작하면 좋을까요?',
          categoryLabel: '외모',
          createdAtLabel: '2026-05-02',
        }}
        replies={replies}
        commentDialog={null}
        onBack={() => undefined}
        onLike={() => undefined}
        onDislike={() => undefined}
        onOpenComment={() => undefined}
        onCommentChange={() => undefined}
        onCommentSubmit={() => undefined}
        onCommentClose={() => undefined}
      />
    </MobileAppShell>
  </React.StrictMode>,
);
