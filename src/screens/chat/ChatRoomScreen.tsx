import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeft, MoreVertical, Plus, Send } from 'lucide-react';
import { ErrorState, profileImageUrlForColor } from '../shared/ui';

export interface ChatMessage {
  messageId: string;
  content: string;
  isMine: boolean;
  createdAtStr: string;
  readStatus?: string;
}

export interface WorryInfo {
  category: string;
  title: string;
  createdAtStr: string;
}

export function ChatRoomScreen({
  loading,
  error,
  messages,
  opponent,
  worryInfo,
  opponentUnreadCount,
  onBack,
  onSendMessage,
  onLeaveChat,
}: {
  readonly loading: boolean;
  readonly error: string | null;
  readonly messages: ChatMessage[];
  readonly opponent: { nickname: string; profileColor: string } | null;
  readonly worryInfo?: WorryInfo | null;
  readonly opponentUnreadCount?: number;
  readonly onBack: () => void;
  readonly onSendMessage: (content: string) => Promise<{ success: boolean; error?: string }>;
  readonly onLeaveChat: () => void;
  readonly onReportUser: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || isSending) return;
    setIsSending(true);
    setSendError(null);
    const { success, error } = await onSendMessage(draft);
    if (success) {
      setDraft('');
    } else {
      setSendError(error || '전송 실패');
    }
    setIsSending(false);
  };

  const mineMessageIds = messages.filter(m => m.isMine).map(m => m.messageId);
  const unreadThresholdIndex = mineMessageIds.length - (opponentUnreadCount || 0);

  if (loading || error) {
    return (
      <section className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#fff1d1]">
        <div className="mx-auto flex h-full w-full max-w-[480px] flex-col">
          <div className="flex h-[110px] shrink-0 w-full items-end justify-between px-4 pb-4 bg-[#ff8b3d] text-white">
            <button type="button" onClick={onBack} className="p-2"><ChevronLeft className="w-7 h-7" strokeWidth={3} /></button>
            <span className="text-[18px] font-bold">채팅</span>
            <div className="w-11"></div>
          </div>
          <div className="pt-[40px] px-[24px] flex-1">
            {error ? <ErrorState title="오류" message={error} /> : <div className="text-center font-bold text-[#b8b8b8]">로딩 중...</div>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d]" onClick={() => setMenuOpen(false)}>
      <div className="mx-auto flex h-full w-full max-w-[480px] flex-col bg-[#ff8b3d]">
        {/* Top Bar Area */}
        <div className="flex pt-[48px] h-[115px] shrink-0 w-full items-end justify-between px-4 pb-4 text-white z-20 bg-[#ff8b3d]">
          <button type="button" onClick={onBack} className="p-2 focus:outline-none shrink-0">
            <ChevronLeft className="w-7 h-7" strokeWidth={3} />
          </button>
          <div className="flex flex-col items-center justify-end pb-1 overflow-hidden">
             <div className="relative mb-[6px] shrink-0">
               <img 
                 src={profileImageUrlForColor(opponent?.profileColor || '#ffd43b')}
                 alt="프로필"
                 className="w-[42px] h-[42px] rounded-full object-cover shadow-sm bg-white"
               />
               {/* Online dot */}
               <div className="absolute bottom-0 right-0 w-[12px] h-[12px] bg-[#22c55e] border-[2px] border-[#ff8b3d] rounded-full"></div>
             </div>
             <span className="text-[17px] font-extrabold tracking-tight leading-none mb-1 truncate w-full text-center px-2">{opponent?.nickname || '대화방'}</span>
             <span className="text-[12px] font-medium text-white/90 shrink-0">답변 채택률 92%</span>
          </div>
          <div className="relative pb-5 shrink-0">
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-2 focus:outline-none"
            >
              <MoreVertical className="w-6 h-6" strokeWidth={2.5} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[160px] bg-white rounded-[14px] shadow-[0_4px_16px_rgb(0_0_0/0.15)] overflow-hidden z-30">
                <button type="button" className="w-full text-left px-5 py-3.5 text-[15px] font-bold text-[#2a2a2a] hover:bg-gray-50 border-b border-gray-100" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); alert('알림이 꺼졌습니다.'); }}>알림 끄기</button>
                <button type="button" className="w-full text-left px-5 py-3.5 text-[15px] font-bold text-[#2a2a2a] hover:bg-gray-50 border-b border-gray-100" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onLeaveChat(); }}>채팅방 나가기</button>
                <button type="button" className="w-full text-left px-5 py-3.5 text-[15px] font-bold text-[#ff8b3d] hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onReportUser(); }}>신고하기</button>
              </div>
            )}
          </div>
        </div>
        
        {/* Chat Content Area */}
        <div className="flex-1 w-full bg-[#fff1d1] rounded-t-[24px] overflow-hidden flex flex-col relative z-10 shadow-[0_-4px_16px_rgb(0_0_0/0.05)]">
          <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
            {/* Date Pill */}
            <div className="w-full flex justify-center mb-6">
               <span className="bg-[#ffe8d6] text-[#ff8b3d] px-[14px] py-[6px] rounded-full text-[13px] font-bold tracking-tight">
                  {worryInfo?.createdAtStr || '날짜 정보 없음'}
               </span>
            </div>

            {/* Worry Card */}
            <div className="w-full bg-white rounded-[20px] p-5 shadow-[0_4px_12px_rgb(0_0_0/0.04)] mb-8">
               <span className="bg-[#ffe8d6] text-[#ff8b3d] px-[10px] py-[4px] rounded-[8px] text-[12px] font-bold inline-block mb-3">
                  {worryInfo?.category || '고민'}
               </span>
               <h3 className="text-[16px] font-bold text-[#2a2a2a] leading-[1.4] tracking-tight mb-2">
                  {worryInfo?.title || '게시글 정보 불러오는 중...'}
               </h3>
               <p className="text-[13px] font-medium text-[#b8b8b8]">이 고민의 답변에서 시작된 대화예요</p>
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-5">
              {messages.map((msg, index) => {
                const showProfile = !msg.isMine && (index === 0 || messages[index - 1].isMine);
                
                let readStatusText = '';
                if (msg.isMine) {
                  const isMineIndex = mineMessageIds.indexOf(msg.messageId);
                  const isRead = isMineIndex < unreadThresholdIndex;
                  if (isRead) readStatusText = '읽음';
                }

                return (
                  <div key={msg.messageId} className={cn('flex w-full', msg.isMine ? 'justify-end' : 'justify-start')}>
                    {!msg.isMine && (
                       <div className="flex items-start gap-[10px] max-w-[85%]">
                          {/* Opponent Avatar */}
                          <div className="relative shrink-0 mt-1">
                             {showProfile ? (
                                <>
                                  <img 
                                    src={profileImageUrlForColor(opponent?.profileColor || '#ffd43b')}
                                    alt="프로필"
                                    className="w-[38px] h-[38px] rounded-full object-cover shadow-sm bg-white"
                                  />
                                  <div className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#22c55e] border-[1.5px] border-[#fff1d1] rounded-full"></div>
                                </>
                             ) : (
                                <div className="w-[38px] h-[38px]"></div> // Empty space for alignment
                             )}
                          </div>
                          
                          <div className="flex flex-col items-start gap-1">
                             <div className="bg-white text-[#2a2a2a] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[18px] px-[18px] py-[12px] shadow-[0_2px_8px_rgb(0_0_0/0.03)] text-[15px] font-medium leading-[1.5] tracking-[-0.3px] break-words">
                                {msg.content}
                             </div>
                          </div>
                          
                          {/* Time - Left side for opponent */}
                          <div className="flex flex-col items-start justify-end shrink-0 pb-1 gap-[2px]">
                             <span className="text-[11px] font-bold text-[#b8b8b8]">{msg.createdAtStr}</span>
                          </div>
                       </div>
                    )}
                    
                    {msg.isMine && (
                       <div className="flex items-end gap-2 max-w-[85%]">
                          {/* Read Status and Time - Right side for mine */}
                          <div className="flex flex-col items-end justify-end shrink-0 pb-1 gap-[2px]">
                             {readStatusText && <span className="text-[11px] font-bold text-[#ff8b3d]">{readStatusText}</span>}
                             <span className="text-[11px] font-bold text-[#b8b8b8]">{msg.createdAtStr}</span>
                          </div>

                          <div className="bg-[#ff8b3d] text-white rounded-tl-[18px] rounded-bl-[18px] rounded-br-[18px] px-[18px] py-[12px] shadow-[0_2px_8px_rgb(0_0_0/0.08)] text-[15px] font-bold leading-[1.5] tracking-[-0.3px] break-words">
                             {msg.content}
                          </div>
                       </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-[2px]" />
            </div>
          </div>

          {/* Input Area */}
          <div className="w-full bg-white px-4 py-3 shadow-[0_-4px_16px_rgb(0_0_0/0.03)] z-20 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
            {sendError && (
              <div className="mb-2 text-center text-[12px] font-bold text-red-500">
                {sendError}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="button" className="w-[38px] h-[38px] rounded-full bg-[#fff1d1] text-[#ff8b3d] flex items-center justify-center shrink-0 focus:outline-none">
                <Plus className="w-6 h-6" strokeWidth={2.5} />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="메시지를 입력해 주세요"
                  className="w-full rounded-[24px] bg-[#fff1d1] border-none px-[18px] py-[12px] text-[15px] font-medium text-[#2a2a2a] placeholder:text-[#c4a984] focus:outline-none focus:ring-1 focus:ring-[#ff8b3d]"
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || isSending}
                className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#ff8b3d] text-white shrink-0 shadow-sm focus:outline-none transition-transform active:scale-95 disabled:bg-[#ffe8d6] disabled:text-[#ffb587]"
              >
                <Send className="w-5 h-5 ml-[2px]" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
