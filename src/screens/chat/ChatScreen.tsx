import { FigmaTopBar } from '../shared/ui';

export interface ChatListItem {
  chatId: string;
  opponentName: string;
  opponentColor: string;
  lastMessage: string;
  dateLabel: string;
  unreadCount: number;
}

export function ChatScreen({
  loading,
  chats,
  onChatClick,
}: {
  readonly loading?: boolean;
  readonly chats?: ChatListItem[];
  readonly onChatClick?: (chatId: string) => void;
}) {
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';

  return (
    <section className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#fff1d1] text-[#2a2a2a]">
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
        <div
          className="relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#fff1d1]"
          style={{ transform: `scale(${canvasScale})` }}
        >
          <div className="flex h-[127px] w-[393px] items-end justify-center pb-[20px] bg-white rounded-b-[30px] shadow-[0_4px_4px_rgb(0_0_0/0.05)] absolute top-0 left-0 z-10">
             <h1 className="text-[17px] font-extrabold leading-[21px] tracking-[-0.34px] text-[#2a2a2a]">채팅</h1>
          </div>
          
          <div className="absolute left-0 top-[127px] h-[725px] w-full overflow-y-auto px-4 pt-6 pb-[108px]">
            {loading ? (
               <div className="flex justify-center py-10 text-[#b8b8b8] text-[14px] font-bold">목록을 불러오는 중입니다...</div>
            ) : chats && chats.length > 0 ? (
              <div className="flex flex-col gap-3">
                {chats.map(chat => (
                  <button
                    key={chat.chatId}
                    type="button"
                    onClick={() => onChatClick && onChatClick(chat.chatId)}
                    className="flex w-full items-center gap-4 rounded-[18px] bg-white p-4 shadow-[0_4px_4px_rgb(0_0_0/0.05)] transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff8b3d]"
                  >
                    <div className="relative">
                      <div className="h-[48px] w-[48px] rounded-full shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: chat.opponentColor }}>
                        {/* 닉네임 첫 글자라도 띄울 수 있음, 디자인 상 프로필 아이콘 */}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-1 overflow-hidden">
                      <span className="text-[15px] font-bold text-[#2a2a2a] truncate w-full text-left">{chat.opponentName}</span>
                      <span className="text-[13px] font-medium text-[#7a7a7a] truncate w-full text-left">{chat.lastMessage}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] font-medium text-[#b8b8b8]">{chat.dateLabel}</span>
                      {chat.unreadCount > 0 && (
                        <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#ff8b3d] px-[6px] text-[11px] font-bold text-white">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-10 text-[#b8b8b8] text-[14px] font-bold">참여 중인 대화방이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
