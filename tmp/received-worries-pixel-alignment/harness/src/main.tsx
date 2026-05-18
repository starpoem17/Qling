import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../dist/assets/index-B2xZor0K.css';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import { BottomNavigation, MobileAppShell } from '../../../../src/screens/shared/ui';
import { ReceivedWorriesScreen } from '../../../../src/screens/receivedWorries/ReceivedWorriesScreen';
import type { ReceivedWorriesScreenProps } from '../../../../src/screens/receivedWorries/contract';

const props: ReceivedWorriesScreenProps = {
  state: { status: 'ready' },
  passingDeliveryIds: [],
  items: [
    {
      deliveryId: 'delivery-1',
      worryId: 'worry-1',
      category: WORRY_CATEGORIES[2],
      previewText: '시험이 얼마 안 남았는데 2일 동안 밤새면 A+ 받을 수 있을까요?',
      bodyText: '시험이 얼마 안 남았는데 2일 동안 밤새면 A+ 받을 수 있을까요?',
      receivedAt: { label: '3분 전', isoValue: '2026-05-19T02:57:00.000Z' },
      isUnread: false,
    },
    {
      deliveryId: 'delivery-2',
      worryId: 'worry-2',
      category: WORRY_CATEGORIES[4],
      previewText: 'SOXS 숏으로 700만원 날렸습니다. 앞으로 인생 어떡하나요?',
      bodyText: 'SOXS 숏으로 700만원 날렸습니다. 앞으로 인생 어떡하나요?',
      receivedAt: { label: '8분 전', isoValue: '2026-05-19T02:52:00.000Z' },
      isUnread: false,
    },
    {
      deliveryId: 'delivery-3',
      worryId: 'worry-3',
      category: WORRY_CATEGORIES[11],
      previewText: '오늘도 잠 안온다... 자려고 누우면 오늘 했던 말실수부터 내일 스케줄까지 오만가지 생각이 드는데...',
      bodyText: '오늘도 잠 안온다... 자려고 누우면 오늘 했던 말실수부터 내일 스케줄까지 오만가지 생각이 드는데...',
      receivedAt: { label: '2시간 전', isoValue: '2026-05-19T01:00:00.000Z' },
      isUnread: false,
    },
    {
      deliveryId: 'delivery-4',
      worryId: 'worry-4',
      category: '잡담',
      previewText: '야구 팀 하나 정해서 응원하려고 하는데 무슨 팀으로 할까요 추천 부탁드립니다',
      bodyText: '야구 팀 하나 정해서 응원하려고 하는데 무슨 팀으로 할까요 추천 부탁드립니다',
      receivedAt: { label: '3시간 전', isoValue: '2026-05-19T00:00:00.000Z' },
      isUnread: false,
    },
    {
      deliveryId: 'delivery-5',
      worryId: 'worry-5',
      category: '잡담',
      previewText: '요즘 퇴근하고 아무것도 하기 싫은데 이게 번아웃인지 그냥 게으른 건지 모르겠어요',
      bodyText: '요즘 퇴근하고 아무것도 하기 싫은데 이게 번아웃인지 그냥 게으른 건지 모르겠어요',
      receivedAt: { label: '10시간 전', isoValue: '2026-05-18T17:00:00.000Z' },
      isUnread: false,
    },
  ],
  onPass: () => undefined,
  onOpen: () => undefined,
  onOpenMyPage: () => undefined,
};

function Harness() {
  return (
    <MobileAppShell
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
      <ReceivedWorriesScreen {...props} />
    </MobileAppShell>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
