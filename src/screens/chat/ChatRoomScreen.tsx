import { useState, useRef, useEffect, type CSSProperties, type KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';
import { ErrorState, profileImageUrlForColor } from '../shared/ui';

const roomPlusIconUrl = new URL('../../../assets/chat/room_plus.svg', import.meta.url).href;
const roomSendIconUrl = new URL('../../../assets/chat/room_send.svg', import.meta.url).href;
const roomMoreIconUrl = new URL('../../../assets/chat/room_more.svg', import.meta.url).href;
const roomNotificationOffIconUrl = new URL('../../../assets/chat/room_notification_off.svg', import.meta.url).href;
const roomBlockIconUrl = new URL('../../../assets/chat/room_block.svg', import.meta.url).href;
const roomReportIconUrl = new URL('../../../assets/chat/room_report.svg', import.meta.url).href;
const dimThemeColor = '#8b7b62';
const chatRoomDocumentBackground = '#ffffff';
const chatInputYOffset = 10;

type ChatRoomCanvasStyle = CSSProperties & {
  readonly '--chat-keyboard-offset': string;
  readonly '--chat-input-y-offset': string;
};

type ChatRoomTopBarStyle = CSSProperties & {
  readonly transform: string;
};

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
  onReportUser,
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
  const [viewportMetrics, setViewportMetrics] = useState({ canvasHeight: 852, keyboardOffset: 0, scale: 1 });
  const messagesScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateViewportMetrics = () => {
      const visualViewport = window.visualViewport;
      const visualWidth = visualViewport?.width ?? window.innerWidth;
      const scale = Math.max(Math.min(visualWidth, 480) / 393, 0.1);
      const layoutHeight = document.documentElement.clientHeight || window.innerHeight || visualViewport?.height || 852;
      const keyboardOffset = Math.max(0, layoutHeight - (visualViewport?.height ?? layoutHeight) - (visualViewport?.offsetTop ?? 0));

      setViewportMetrics(previousMetrics => {
        const nextMetrics = {
          canvasHeight: keyboardOffset > 0 ? previousMetrics.canvasHeight : layoutHeight / scale,
          keyboardOffset: keyboardOffset / scale,
          scale,
        };

        return previousMetrics.canvasHeight === nextMetrics.canvasHeight
          && previousMetrics.keyboardOffset === nextMetrics.keyboardOffset
          && previousMetrics.scale === nextMetrics.scale
          ? previousMetrics
          : nextMetrics;
      });
    };

    updateViewportMetrics();
    window.addEventListener('resize', updateViewportMetrics);
    window.addEventListener('orientationchange', updateViewportMetrics);
    window.visualViewport?.addEventListener('resize', updateViewportMetrics);

    return () => {
      window.removeEventListener('resize', updateViewportMetrics);
      window.removeEventListener('orientationchange', updateViewportMetrics);
      window.visualViewport?.removeEventListener('resize', updateViewportMetrics);
    };
  }, []);

  useEffect(() => {
    const root = document.getElementById('root');
    const previousHtmlBackground = document.documentElement.style.backgroundColor;
    const previousBodyBackground = document.body.style.backgroundColor;
    const previousRootBackground = root?.style.backgroundColor ?? null;
    const backgroundColor = menuOpen ? dimThemeColor : chatRoomDocumentBackground;

    document.documentElement.style.backgroundColor = backgroundColor;
    document.body.style.backgroundColor = backgroundColor;
    if (root) root.style.backgroundColor = backgroundColor;

    return () => {
      document.documentElement.style.backgroundColor = previousHtmlBackground;
      document.body.style.backgroundColor = previousBodyBackground;
      if (root && previousRootBackground !== null) root.style.backgroundColor = previousRootBackground;
    };
  }, [menuOpen]);

  const canvasStyle: ChatRoomCanvasStyle = {
    '--chat-keyboard-offset': `${viewportMetrics.keyboardOffset}px`,
    '--chat-input-y-offset': `${chatInputYOffset}px`,
    height: `${viewportMetrics.canvasHeight}px`,
    transform: `scale(${viewportMetrics.scale})`,
  };
  const topBarStyle: ChatRoomTopBarStyle = {
    transform: `translateX(-50%) scale(${viewportMetrics.scale})`,
  };

  useEffect(() => {
    const scroller = messagesScrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
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

  const handleMessageKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void handleSend();
  };

  const mineMessageIds = messages.filter(m => m.isMine).map(m => m.messageId);
  const unreadThresholdIndex = mineMessageIds.length - (opponentUnreadCount || 0);

  if (loading || error) {
    return (
      <section className="-mx-[var(--qling-space-shell-x)] -mb-12 -mt-6 h-dvh overflow-hidden bg-[#fff1d1]">
        <ChatRoomTopBar
          opponent={opponent}
          onBack={onBack}
          onOpenMenu={() => setMenuOpen(true)}
          style={topBarStyle}
        />
        <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
          <div className="relative w-[393px] shrink-0 origin-top overflow-hidden bg-[#fff1d1] qling-figma-font" style={canvasStyle}>
            <div className="absolute bottom-0 left-0 top-[74px] flex w-[393px] items-start justify-center bg-[#fff1d1] px-6 pt-10">
              {error ? <ErrorState title="오류" message={error} /> : <div className="text-center text-[14px] font-bold text-[#a39e96]">로딩 중...</div>}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="-mx-[var(--qling-space-shell-x)] -mb-12 -mt-6 h-dvh overflow-hidden bg-[#fff1d1]">
      <ChatRoomTopBar
        opponent={opponent}
        onBack={onBack}
        onOpenMenu={() => setMenuOpen(true)}
        style={topBarStyle}
      />
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
        <div className="relative w-[393px] shrink-0 origin-top overflow-hidden bg-[#fff1d1] qling-figma-font" style={canvasStyle}>
          <div
            ref={messagesScrollerRef}
            className="absolute bottom-[calc(67px+max(0px,calc(var(--chat-keyboard-offset)-var(--chat-input-y-offset))))] left-0 top-[74px] w-[393px] overflow-y-auto bg-[#fff1d1] px-4 pb-[28px] pt-4 [-webkit-overflow-scrolling:touch]"
          >
            <div className="mb-[14px] flex w-full justify-center">
              <span className="rounded-full bg-[#ffe7d2] px-3 py-[4px] text-[11px] font-semibold leading-[16.5px] text-[#f26c0f]">
                {worryInfo?.createdAtStr || '날짜 정보 없음'}
              </span>
            </div>

            <div className="mb-[14px] h-[99.425px] w-full rounded-[14px] border-[0.8px] border-[#f1e7da] bg-white px-[14.8px] py-[12.8px] shadow-[0_2px_8px_rgb(120_90_60/0.07)]">
              <div className="flex h-[30.2px] items-center">
                <span className="rounded-full bg-[#ffe7d2] px-[7.2px] py-[2px] font-['Qling_Noto_Sans_KR_Black'] text-[10px] font-black leading-[15px] text-[#f26c0f]">
                  {worryInfo?.category || '고민'}
                </span>
              </div>
              <h3 className="truncate text-[13px] font-semibold leading-[21.125px] tracking-[-0.325px] text-[#2b2620]">
                {worryInfo?.title || '게시글 정보 불러오는 중...'}
              </h3>
              <p className="pt-[6px] text-[11px] font-normal leading-[16.5px] text-[#a39e96]">
                이 고민의 답변에서 시작된 대화예요
              </p>
            </div>

            <div className="flex flex-col gap-[14px]">
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
                      <div className="flex max-w-full items-end gap-2">
                        <div className="relative h-full min-h-[31px] w-[34px] shrink-0 self-stretch">
                             {showProfile ? (
                                <>
                                  <img 
                                    src={profileImageUrlForColor(opponent?.profileColor || '#FF8B3D')}
                                    alt="프로필"
                                    className="absolute left-[0.4px] top-[0.5px] h-[30px] w-[30px] rounded-full object-cover"
                                  />
                                </>
                             ) : (
                               <span className="block h-[30px] w-[30px]" aria-hidden="true" />
                             )}
                          </div>
                          
                        <div className="w-fit max-w-[199px] rounded-bl-[18px] rounded-br-[18px] rounded-tl-[7px] rounded-tr-[18px] border-[0.8px] border-[#f1e7da] bg-white px-[14px] py-[10.4px] text-[14px] font-normal leading-[22.75px] tracking-[-0.35px] text-[#2b2620] shadow-[0_2px_4px_rgb(120_90_60/0.07)]">
                                {msg.content}
                             </div>
                          
                        <div className="flex h-[18px] w-[43px] shrink-0 items-end pb-[2px]">
                          <span className="whitespace-nowrap text-[10.5px] font-normal leading-[15.75px] text-[#a39e96]">{msg.createdAtStr}</span>
                          </div>
                       </div>
                    )}
                    
                    {msg.isMine && (
                      <div className="flex max-w-[317px] items-end justify-end gap-2">
                        <div className="flex shrink-0 flex-col items-end justify-end gap-[2px] pb-[2px]">
                          {readStatusText && <span className="whitespace-nowrap text-[10.5px] font-semibold leading-[15.75px] text-[#f26c0f]">{readStatusText}</span>}
                          <span className="whitespace-nowrap text-[10.5px] font-normal leading-[15.75px] text-[#a39e96]">{msg.createdAtStr}</span>
                          </div>

                        <div className="w-fit max-w-[236px] rounded-bl-[18px] rounded-br-[18px] rounded-tl-[18px] rounded-tr-[7px] bg-[#ff8a2e] px-[14px] py-[10.4px] text-[14px] font-normal leading-[22.75px] tracking-[-0.35px] text-white shadow-[0_4px_6px_rgb(255_122_26/0.32)]">
                             {msg.content}
                          </div>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-[max(0px,calc(var(--chat-keyboard-offset)-var(--chat-input-y-offset)))] left-0 h-[67px] w-[393px] border-t-[0.8px] border-[#ede3d6] bg-white">
            {sendError && (
              <div className="absolute bottom-[67px] left-4 right-4 rounded-[12px] bg-white px-3 py-2 text-center text-[12px] font-bold text-red-500 shadow-[0_2px_8px_rgb(120_90_60/0.12)]">
                {sendError}
              </div>
            )}
            <div className="absolute left-[14px] top-[12.2px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#fff0e2]">
              <button type="button" aria-label="첨부 추가" className="flex h-full w-full items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#ff8b3d]">
                <img src={roomPlusIconUrl} alt="" aria-hidden="true" className="h-[18px] w-[18px]" draggable={false} />
              </button>
            </div>
            <div className="absolute left-[60px] top-[10.2px] flex min-h-[40px] w-[269px] items-center rounded-[21px] border-[0.8px] border-[#ede3d6] bg-[#fff4e8] px-[16.8px] py-[0.8px]">
                <input
                  type="text"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                onKeyDown={handleMessageKeyDown}
                  placeholder="메시지를 입력해 주세요"
                className="w-full bg-transparent text-[14px] font-normal leading-5 text-[#2b2620] outline-none placeholder:text-[#a39e96]"
                />
              </div>
              <button
                type="button"
              onClick={() => void handleSend()}
                disabled={!draft.trim() || isSending}
              aria-label="메시지 보내기"
              className="absolute left-[337px] top-[8.2px] flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#ff8b3d] shadow-[0_4px_6px_rgb(255_122_26/0.4)] transition-transform active:scale-95 disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-[#f26c0f]"
              >
              <img src={roomSendIconUrl} alt="" aria-hidden="true" className="h-5 w-5" draggable={false} />
              </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <ChatRoomActionSheet
          keyboardOffset={viewportMetrics.keyboardOffset * viewportMetrics.scale}
          onClose={() => setMenuOpen(false)}
          onNotificationOff={() => {
            setMenuOpen(false);
            alert('알림이 꺼졌습니다.');
          }}
          onBlock={() => {
            setMenuOpen(false);
            onLeaveChat();
          }}
          onReport={() => {
            setMenuOpen(false);
            onReportUser();
          }}
        />
      )}
    </section>
  );
}

function ChatRoomTopBar({
  opponent,
  onBack,
  onOpenMenu,
  style,
}: {
  readonly opponent: { nickname: string; profileColor: string } | null;
  readonly onBack: () => void;
  readonly onOpenMenu: () => void;
  readonly style: ChatRoomTopBarStyle;
}) {
  return (
    <header className="fixed left-1/2 top-0 z-20 h-[74px] w-[393px] origin-top bg-[#ff8b3d] qling-figma-font" style={style}>
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로가기"
        className="absolute left-[11px] top-[18px] flex h-12 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <span aria-hidden="true" className="font-['Qling_Figma_Inter'] text-[32px] font-semibold leading-none">
          ‹
        </span>
      </button>
      <div className="absolute left-[126px] top-[28px] h-[30px] w-[30px]">
        <img
          src={profileImageUrlForColor(opponent?.profileColor || '#FF8B3D')}
          alt="프로필"
          className="h-[30px] w-[30px] rounded-full object-cover"
          draggable={false}
        />
        <span className="absolute left-[21px] top-5 h-[11px] w-[11px] rounded-full border-[1.6px] border-[#fff4e8] bg-[#3fc36b]" aria-hidden="true" />
      </div>
      <div className="absolute left-[170px] top-[25px] flex w-[83px] flex-col items-start">
        <span className="max-w-[130px] truncate text-[16px] font-extrabold leading-5 tracking-[-0.4px] text-white">
          {opponent?.nickname || '대화방'}
        </span>
        <span className="whitespace-nowrap text-[11.5px] font-medium leading-[17.25px] text-white/80">
          답변 채택률 92%
        </span>
      </div>
      <button
        type="button"
        aria-label="채팅방 메뉴 열기"
        onClick={onOpenMenu}
        className="absolute left-[339px] top-[27px] flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <img src={roomMoreIconUrl} alt="" aria-hidden="true" className="h-[22px] w-[22px]" draggable={false} />
      </button>
    </header>
  );
}

function ChatRoomActionSheet({
  keyboardOffset,
  onClose,
  onNotificationOff,
  onBlock,
  onReport,
}: {
  readonly keyboardOffset: number;
  readonly onClose: () => void;
  readonly onNotificationOff: () => void;
  readonly onBlock: () => void;
  readonly onReport: () => void;
}) {
  const sheetStyle = {
    '--chat-keyboard-offset': `${keyboardOffset}px`,
  } as CSSProperties;

  return (
    <div className="fixed inset-0 z-30 bg-[rgba(40,30,20,0.42)]" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="채팅방 메뉴"
        className="absolute bottom-[var(--chat-keyboard-offset)] left-1/2 flex h-[284px] w-[min(393px,100vw)] -translate-x-1/2 flex-col items-start overflow-hidden rounded-tl-[22px] rounded-tr-[22px] bg-white pb-[26px] pt-[10px]"
        style={sheetStyle}
        onClick={event => event.stopPropagation()}
      >
        <div className="flex w-full justify-center overflow-hidden pb-2">
          <span className="h-1 w-10 rounded-[2px] bg-[#e6dccf]" aria-hidden="true" />
        </div>
        <ActionSheetButton iconUrl={roomNotificationOffIconUrl} label="알림 끄기" onClick={onNotificationOff} />
        <ActionSheetButton iconUrl={roomBlockIconUrl} label="차단하기" danger onClick={onBlock} />
        <ActionSheetButton iconUrl={roomReportIconUrl} label="신고하기" danger onClick={onReport} />
        <div className="h-2 w-[393px] shrink-0 bg-[#f4efe7]" />
        <button
          type="button"
          onClick={onClose}
          className="flex h-[72px] w-full shrink-0 items-start justify-center py-[15px] font-['Qling_Noto_Sans_KR'] text-[15px] font-bold leading-[22px] text-[#8a857c] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function ActionSheetButton({
  iconUrl,
  label,
  danger = false,
  onClick,
}: {
  readonly iconUrl: string;
  readonly label: string;
  readonly danger?: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full shrink-0 items-center gap-3 overflow-hidden px-5 py-[15px] text-left focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset"
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
        <img src={iconUrl} alt="" className="max-h-4 max-w-4" draggable={false} />
      </span>
      <span className={cn("font-['Qling_Noto_Sans_KR'] text-[15px] font-medium leading-[22px]", danger ? 'text-[#e5484d]' : 'text-[#2b2620]')}>
        {label}
      </span>
    </button>
  );
}
