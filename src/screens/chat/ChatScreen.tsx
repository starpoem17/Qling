import { useState } from 'react';
import { MoreVertical, Search, CircleUserRound } from 'lucide-react';
import { profileImageUrlForColor } from '../shared/ui';

export interface ChatListItem {
  chatId: string;
  opponentUid: string;
  opponentName: string;
  opponentColor: string;
  lastMessage: string;
  dateLabel: string;
  unreadCount: number;
  worryTitle?: string;
  worryCategory?: string;
}

export function ChatScreen({
  loading,
  chats,
  onChatClick,
  onBack,
  onProfileClick,
  onLeaveChat,
  onReportUser,
}: {
  readonly loading?: boolean;
  readonly chats?: ChatListItem[];
  readonly onChatClick?: (chatId: string) => void;
  readonly onBack?: () => void;
  readonly onProfileClick?: () => void;
  readonly onLeaveChat?: (chatId: string) => void;
  readonly onReportUser?: (chatId: string, opponentUid: string, opponentNickname: string) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <section className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d] text-[#2a2a2a]" onClick={() => setOpenMenuId(null)}>
      <div className="mx-auto flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-[#ff8b3d]">
        {/* Top Bar Area */}
        <div className="flex flex-col w-full z-20 bg-[#ff8b3d] shrink-0 pt-[calc(env(safe-area-inset-top,20px)+20px)] pb-4 relative">
          <div className="flex items-start justify-between px-2">
            <button
              type="button"
              onClick={() => onBack && onBack()}
              aria-label="뒤로가기"
              className="flex h-[44px] w-[36px] items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 hover:bg-white/20 focus:ring-white shrink-0"
            >
              <span aria-hidden="true" className="font-['Qling_Figma_Inter'] text-[32px] font-semibold leading-none text-white pr-1">
                ‹
              </span>
            </button>
            <h1 className="flex-1 text-center text-[17px] font-extrabold leading-[44px] tracking-[-0.34px] font-sans text-white pointer-events-none">
              채팅
            </h1>
            <button
              type="button"
              aria-label="마이페이지 열기"
              onClick={() => onProfileClick && onProfileClick()}
              className="flex h-[44px] w-[36px] items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white shrink-0"
            >
              <CircleUserRound className="h-[26px] w-[26px]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 relative z-20 shrink-0">
          <div className="flex items-center bg-white/30 rounded-[12px] px-4 py-3">
            <Search className="w-5 h-5 text-white mr-2 shrink-0" strokeWidth={2} />
            <input 
              type="text" 
              placeholder="닉네임으로 검색" 
              className="bg-transparent border-none text-white placeholder:text-white/90 focus:outline-none w-full text-[15px] font-medium" 
            />
          </div>
        </div>

        {/* Bottom Sheet Area */}
        <div className="mt-6 flex-1 w-full overflow-y-auto px-[18px] pt-6 pb-[calc(108px+env(safe-area-inset-bottom,0px))] bg-[#fff1d1] rounded-t-[30px] z-10 scrollbar-hide">
          {loading ? (
             <div className="flex justify-center py-10 text-[#b8b8b8] text-[14px] font-bold">목록을 불러오는 중입니다...</div>
          ) : chats && chats.length > 0 ? (
            <div className="flex flex-col gap-4">
              {chats.map(chat => (
                <div 
                  key={chat.chatId}
                  role="button"
                  tabIndex={0}
                  onClick={() => onChatClick && onChatClick(chat.chatId)} 
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { onChatClick && onChatClick(chat.chatId); } }}
                  className="flex w-full flex-col rounded-[20px] bg-white p-[18px] shadow-[0_4px_12px_rgb(0_0_0/0.06)] transition-transform hover:scale-[0.99] focus:outline-none text-left cursor-pointer"
                >
                  {/* Header: Tag + Title + More Icon */}
                  <div className="flex items-center justify-between w-full mb-3 gap-2">
                    <div className="flex items-center gap-[10px] w-full overflow-hidden">
                       <span className="bg-[#ffe8d6] text-[#ff8b3d] px-[12px] py-[4px] rounded-full text-[12px] font-bold shrink-0">
                         {chat.worryCategory || '기타'}
                       </span>
                       <span className="text-[14px] font-medium text-[#4a4a4a] truncate w-full tracking-[-0.28px]">
                         {chat.worryTitle || '게시글 정보 불러오는 중...'}
                       </span>
                    </div>
                    <div className="relative">
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === chat.chatId ? null : chat.chatId); }} 
                        className="p-1 hover:bg-gray-50 rounded-full focus:outline-none"
                      >
                        <MoreVertical className="w-5 h-5 text-[#b8b8b8] shrink-0" strokeWidth={2} />
                      </button>
                      {openMenuId === chat.chatId && (
                        <div className="absolute right-0 top-full mt-1 w-[150px] bg-white rounded-[12px] shadow-[0_4px_10px_rgb(0_0_0/0.15)] overflow-hidden z-30">
                          <button type="button" className="w-full text-left px-4 py-3 text-[14px] font-bold text-[#2a2a2a] hover:bg-gray-50 border-b border-gray-100" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); alert('알림이 꺼졌습니다.'); }}>알림 끄기</button>
                          <button type="button" className="w-full text-left px-4 py-3 text-[14px] font-bold text-[#2a2a2a] hover:bg-gray-50 border-b border-gray-100" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onLeaveChat && onLeaveChat(chat.chatId); }}>채팅방 나가기</button>
                          <button type="button" className="w-full text-left px-4 py-3 text-[14px] font-bold text-[#ff8b3d] hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onReportUser && onReportUser(chat.chatId, chat.opponentUid, chat.opponentName); }}>신고하기</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-[1px] bg-[#f0f0f0] mb-4"></div>

                  {/* Content: Avatar + Text */}
                  <div className="flex items-start w-full gap-4">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                          <img 
                            src={profileImageUrlForColor(chat.opponentColor || '#ff8b3d')} 
                            alt="프로필" 
                            className="w-[52px] h-[52px] rounded-full object-cover shadow-sm bg-white" 
                          />
                          {/* Online dot */}
                          <div className="absolute bottom-0 right-0 w-[14px] h-[14px] bg-[#22c55e] border-[2px] border-white rounded-full"></div>
                      </div>

                        {/* Text info */}
                        <div className="flex flex-col flex-1 pt-1 overflow-hidden">
                            <div className="flex justify-between items-center w-full mb-[2px]">
                               <span className="font-bold text-[16px] text-[#2a2a2a] truncate">{chat.opponentName}</span>
                               <span className="text-[12px] font-medium text-[#b8b8b8] shrink-0">{chat.dateLabel}</span>
                            </div>
                            <div className="flex justify-between items-start w-full gap-2">
                               <span className="text-[13.5px] font-medium text-[#7a7a7a] line-clamp-1 break-all leading-[1.3] mt-[2px]">{chat.lastMessage}</span>
                               {chat.unreadCount > 0 && (
                                  <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#ff8b3d] px-[6px] text-[12px] font-bold text-white shrink-0">
                                     {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                  </span>
                               )}
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center pt-20 pb-10 px-4 text-center h-full">
                <div className="relative mb-6">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="55" cy="55" r="42" fill="#ff8b3d" />
                    <ellipse cx="41" cy="55" rx="7.5" ry="14" fill="white" />
                    <ellipse cx="61" cy="55" rx="7.5" ry="14" fill="white" />
                    <ellipse cx="39.5" cy="56.5" rx="3.5" ry="7" fill="#1a1a1a" />
                    <ellipse cx="59.5" cy="56.5" rx="3.5" ry="7" fill="#1a1a1a" />
                    <text x="68" y="94" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="76" fill="#c3b29c" transform="rotate(18 68 94)">?</text>
                    <text x="65" y="91" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="76" fill="#fbbf24" transform="rotate(18 65 91)">?</text>
                  </svg>
                </div>
                <h2 className="text-[20px] font-extrabold text-[#2a2a2a] mb-[12px] tracking-tight">아직 시작된 채팅이 없어요</h2>
                <p className="text-[14.5px] text-[#7a7a7a] font-medium leading-[1.5] tracking-tight mb-8">
                  답변에 코멘트를 받으면,<br />
                  답변자가 먼저 채팅을 시작할 수 있어요.
                </p>
                <div className="w-full bg-white rounded-[16px] px-[20px] py-[18px] text-left shadow-[0_2px_8px_rgb(0_0_0/0.02)] border border-[#fdf9f5]">
                  <p className="text-[13.5px] text-[#7a7a7a] font-medium leading-[1.55] tracking-tight">
                    좋은 답변을 남기면 채팅으로 이어질 확률이<br />
                    높아져요. 받은 고민에 답변을 달아보세요!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
    </section>
  );
}
