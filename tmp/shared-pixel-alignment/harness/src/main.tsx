import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../dist/assets/index-BSL99fe4.css';
import { WORRY_CATEGORIES } from '@midnight-radio/domain';
import { BottomNavigation, MobileAppShell } from '../../../../src/screens/shared/ui';
import { ReceivedWorriesScreen } from '../../../../src/screens/receivedWorries/ReceivedWorriesScreen';
import type { ReceivedWorriesScreenProps } from '../../../../src/screens/receivedWorries/contract';

const now = new Date(2026, 4, 19, 12, 0, 0);

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
      receivedAt: { label: '3분 전', isoValue: new Date(now.getTime() - 3 * 60000).toISOString() },
      isUnread: false,
    },
    {
      deliveryId: 'delivery-2',
      worryId: 'worry-2',
      category: WORRY_CATEGORIES[4],
      previewText: 'SOXS 숏으로 700만원 날렸습니다. 앞으로 인생 어떡하나요?',
      bodyText: 'SOXS 숏으로 700만원 날렸습니다. 앞으로 인생 어떡하나요?',
      receivedAt: { label: '8분 전', isoValue: new Date(now.getTime() - 8 * 60000).toISOString() },
      isUnread: true,
    },
    {
      deliveryId: 'delivery-3',
      worryId: 'worry-3',
      category: WORRY_CATEGORIES[11],
      previewText: '오늘도 잠 안온다... 자려고 누우면 오늘 했던 말실수부터 내일 스케줄까지 생각이 듭니다.',
      bodyText: '오늘도 잠 안온다... 자려고 누우면 오늘 했던 말실수부터 내일 스케줄까지 생각이 듭니다.',
      receivedAt: { label: '2시간 전', isoValue: new Date(now.getTime() - 2 * 60 * 60000).toISOString() },
      isUnread: false,
    },
  ],
  onPass: () => undefined,
  onOpen: () => undefined,
  onReply: () => undefined,
};

function Harness() {
  return (
    <MobileAppShell
      mainClassName="pt-8"
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
