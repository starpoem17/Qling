import { useState, useRef, useEffect, type CSSProperties, type ChangeEvent, type KeyboardEvent, type RefObject, type TouchEvent, type WheelEvent } from 'react';
import { cn } from '../../lib/utils';
import { ErrorState, profileImageUrlForColor } from '../shared/ui';

const roomSendIconUrl = new URL('../../../assets/chat/room_send.svg', import.meta.url).href;
const roomMoreIconUrl = new URL('../../../assets/chat/room_more.svg', import.meta.url).href;
const roomNotificationOffIconUrl = new URL('../../../assets/chat/room_notification_off.svg', import.meta.url).href;
const roomBlockIconUrl = new URL('../../../assets/chat/room_block.svg', import.meta.url).href;
const roomReportIconUrl = new URL('../../../assets/chat/room_report.svg', import.meta.url).href;
const dimThemeColor = '#8b7b62';
const chatRoomDocumentBackground = '#ffffff';
const chatRoomKeyboardDebugStorageKey = 'qling.chatRoomKeyboardDebug';
const chatRoomKeyboardDebugQueryParam = 'chatRoomKeyboardDebug';
const chatInputBaseHeight = 67;
const chatRoomTopBarHeight = 100;
const chatRoomTopBarHeightCss = `calc(${chatRoomTopBarHeight}px + var(--qling-pwa-direct-topbar-shift))`;
const chatRoomKeyboardOpenThreshold = 120;
const chatTextareaMinHeight = 40;
const chatTextareaMaxHeight = 60;
const chatRoomBackSwipeEdgeWidth = 32;
const chatRoomBackSwipeMinDistance = 72;
const chatRoomBackSwipeMaxVerticalDrift = 48;
const chatRoomBackSwipeHorizontalRatio = 1.5;

type ChatRoomCanvasStyle = CSSProperties & {
  readonly '--chat-input-height': string;
};

type ChatRoomViewportMetrics = {
  readonly canvasHeight: number;
};

type ChatRoomBackSwipeState = {
  readonly startX: number;
  readonly startY: number;
  readonly tracking: boolean;
  readonly triggered: boolean;
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
  answerAdoptionRatePercent,
  worryInfo,
  opponentUnreadCount,
  onBack,
  onSendMessage,
  onNotificationOff,
  onLeaveChat,
  onReportUser,
}: {
  readonly loading: boolean;
  readonly error: string | null;
  readonly messages: ChatMessage[];
  readonly opponent: { nickname: string; profileColor: string } | null;
  readonly answerAdoptionRatePercent: number | null;
  readonly worryInfo?: WorryInfo | null;
  readonly opponentUnreadCount?: number;
  readonly onBack: () => void;
  readonly onSendMessage: (content: string) => Promise<{ success: boolean; error?: string }>;
  readonly onNotificationOff: () => void;
  readonly onLeaveChat: () => void;
  readonly onReportUser: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(chatTextareaMinHeight);
  const [viewportMetrics, setViewportMetrics] = useState<ChatRoomViewportMetrics>({ canvasHeight: 852 });
  const [isTopBarHiddenForKeyboard, setIsTopBarHiddenForKeyboard] = useState(false);
  const [isMessageScrollerScrollable, setIsMessageScrollerScrollable] = useState(false);
  const messagesScrollerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const fullViewportHeightRef = useRef<number | null>(null);
  const keyboardInputIntentRef = useRef(false);
  const canAutoScrollAfterViewportChangeRef = useRef(false);
  const backSwipeRef = useRef<ChatRoomBackSwipeState | null>(null);
  const previousAutoScrollInputsRef = useRef<{
    readonly messages: readonly ChatMessage[];
    readonly textareaHeight: number;
    readonly canvasHeight: number;
    readonly isTopBarHiddenForKeyboard: boolean;
  } | null>(null);

  useEffect(() => {
    const updateViewportMetrics = (source: string = 'viewport.measure') => {
      const visualViewport = window.visualViewport;
      const layoutHeight = window.innerHeight ?? document.documentElement.clientHeight ?? 852;
      const visibleHeight = visualViewport?.height ?? window.innerHeight ?? document.documentElement.clientHeight ?? 852;
      const viewportHeight = visualViewport ? visibleHeight : layoutHeight;
      const nextFullViewportHeight = Math.max(layoutHeight, visibleHeight);
      const fullViewportHeight = fullViewportHeightRef.current ?? nextFullViewportHeight;
      const viewportHeightShrink = Math.max(0, fullViewportHeight - visibleHeight);
      const isKeyboardHeightVisible = viewportHeightShrink >= chatRoomKeyboardOpenThreshold;
      if (!visualViewport || !isTopBarHiddenForKeyboard) {
        fullViewportHeightRef.current = Math.max(fullViewportHeight, nextFullViewportHeight);
      }
      if (visualViewport && keyboardInputIntentRef.current && isKeyboardHeightVisible) {
        setIsTopBarHiddenForKeyboard(true);
      } else if (visualViewport && isTopBarHiddenForKeyboard && !isKeyboardHeightVisible) {
        keyboardInputIntentRef.current = false;
        setIsTopBarHiddenForKeyboard(false);
      }
      const nextMetrics = {
        canvasHeight: viewportHeight,
      };

      setViewportMetrics(previousMetrics => {
        return previousMetrics.canvasHeight === nextMetrics.canvasHeight
          ? previousMetrics
          : nextMetrics;
      });
      logChatRoomKeyboardMetric(source);
    };
    const handleViewportResize = () => updateViewportMetrics('visualViewport.resize');
    const handleViewportScroll = () => updateViewportMetrics('visualViewport.scroll');
    const handleWindowResize = () => updateViewportMetrics('window.resize');
    const handleOrientationChange = () => updateViewportMetrics('window.orientationchange');

    updateViewportMetrics();
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    window.visualViewport?.addEventListener('scroll', handleViewportScroll);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleViewportScroll);
    };
  }, [isTopBarHiddenForKeyboard]);

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
    '--chat-input-height': `${chatInputBaseHeight + Math.max(0, textareaHeight - chatTextareaMinHeight)}px`,
    height: `${viewportMetrics.canvasHeight}px`,
  };
  const topBarLayerStyle: CSSProperties = {
    height: isTopBarHiddenForKeyboard ? 0 : chatRoomTopBarHeightCss,
    transform: isTopBarHiddenForKeyboard ? `translateY(calc(-1 * ${chatRoomTopBarHeightCss}))` : undefined,
  };

  useEffect(() => {
    const textarea = messageInputRef.current;
    if (!textarea) return;
    textarea.style.height = `${chatTextareaMinHeight}px`;
    const nextHeight = Math.min(chatTextareaMaxHeight, Math.max(chatTextareaMinHeight, textarea.scrollHeight));
    textarea.style.height = `${nextHeight}px`;
    setTextareaHeight(nextHeight);
  }, [draft]);

  useEffect(() => {
    const scroller = messagesScrollerRef.current;
    if (!scroller) return;
    const previousInputs = previousAutoScrollInputsRef.current;
    const currentInputs = {
      messages,
      textareaHeight,
      canvasHeight: viewportMetrics.canvasHeight,
      isTopBarHiddenForKeyboard,
    };
    const messagesChanged = previousInputs === null || previousInputs.messages !== messages;
    const textareaHeightChanged = previousInputs === null || previousInputs.textareaHeight !== textareaHeight;
    const viewportOnlyChanged = previousInputs !== null
      && !messagesChanged
      && !textareaHeightChanged
      && (
        previousInputs.canvasHeight !== viewportMetrics.canvasHeight
        || previousInputs.isTopBarHiddenForKeyboard !== isTopBarHiddenForKeyboard
      );
    const canScrollMessages = canScrollMessageScroller(scroller);
    setIsMessageScrollerScrollable(canScrollMessages);

    if (!canScrollMessages) {
      shouldStickToBottomRef.current = true;
    } else if (
      shouldStickToBottomRef.current
      && (!viewportOnlyChanged || canAutoScrollAfterViewportChangeRef.current)
    ) {
      scroller.scrollTop = scroller.scrollHeight;
    }

    previousAutoScrollInputsRef.current = currentInputs;
    canAutoScrollAfterViewportChangeRef.current = viewportOnlyChanged
      ? canAutoScrollAfterViewportChangeRef.current
      : canScrollMessages;
  }, [messages, textareaHeight, viewportMetrics.canvasHeight, isTopBarHiddenForKeyboard]);

  const handleMessagesScroll = () => {
    const scroller = messagesScrollerRef.current;
    if (!scroller) return;
    if (!canScrollMessageScroller(scroller)) {
      shouldStickToBottomRef.current = true;
      return;
    }
    const distanceFromBottom = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
    shouldStickToBottomRef.current = distanceFromBottom <= 72;
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setSendError(null);
    const { success, error } = await onSendMessage(content);
    if (success) {
      shouldStickToBottomRef.current = true;
      setDraft('');
    } else {
      setSendError(error || '전송 실패');
    }
    setIsSending(false);
  };

  const handleMessageKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void handleSend();
  };

  const handleDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.currentTarget.value);
    setSendError(null);
  };

  const handleOpenMenu = () => {
    messageInputRef.current?.blur();
    setMenuOpen(true);
  };

  const handleMessageInputIntent = (source: string, pointerType?: string) => {
    if (source === 'textarea.touchstart' || source === 'textarea.focus' || pointerType === 'touch') {
      keyboardInputIntentRef.current = true;
    }
    logChatRoomKeyboardMetric(source);
  };

  const handleMessageInputBlur = () => {
    keyboardInputIntentRef.current = false;
    if (!window.visualViewport) {
      setIsTopBarHiddenForKeyboard(false);
    }
    logChatRoomKeyboardMetric('textarea.blur');
  };

  const resetBackSwipe = () => {
    backSwipeRef.current = null;
  };

  const handleBackSwipeStart = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1 || isChatRoomBackSwipeIgnoredTarget(event.target)) {
      resetBackSwipe();
      return;
    }

    const touch = event.touches[0];
    backSwipeRef.current = touch.clientX <= chatRoomBackSwipeEdgeWidth
      ? { startX: touch.clientX, startY: touch.clientY, tracking: true, triggered: false }
      : null;
  };

  const handleBackSwipeMove = (event: TouchEvent<HTMLElement>) => {
    const swipe = backSwipeRef.current;
    if (!swipe?.tracking || swipe.triggered || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - swipe.startX;
    const deltaY = touch.clientY - swipe.startY;
    const absY = Math.abs(deltaY);

    if (absY > 24 && absY > Math.abs(deltaX)) {
      resetBackSwipe();
      return;
    }

    if (
      deltaX >= chatRoomBackSwipeMinDistance
      && absY <= chatRoomBackSwipeMaxVerticalDrift
      && deltaX > absY * chatRoomBackSwipeHorizontalRatio
    ) {
      backSwipeRef.current = { ...swipe, triggered: true };
      onBack();
    }
  };

  const handleMessagesTouchMove = (event: TouchEvent<HTMLElement>) => {
    handleBackSwipeMove(event);
    if (!isMessageScrollerScrollable) blockStaticScroll(event);
  };

  const mineMessageIds = messages.filter(m => m.isMine).map(m => m.messageId);
  const unreadThresholdIndex = mineMessageIds.length - (opponentUnreadCount || 0);
  if (loading || error) {
    return (
      <>
        <ChatRoomTopBarLayer
          opponent={opponent}
          answerAdoptionRatePercent={answerAdoptionRatePercent}
          topBarLayerStyle={topBarLayerStyle}
          onBack={onBack}
          onOpenMenu={handleOpenMenu}
        />
        <section
          className="fixed inset-0 z-40 overflow-hidden bg-[#fff1d1]"
        >
          <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
            <div data-chat-room-canvas className="relative flex h-full w-full max-w-[480px] shrink-0 flex-col overflow-hidden bg-[#fff1d1] qling-figma-font" style={canvasStyle}>
              <ChatRoomTopBarSpacer isHidden={isTopBarHiddenForKeyboard} />
              <div className="flex min-h-0 w-full flex-1 items-start justify-center bg-[#fff1d1] px-6 pt-10">
                {error ? <ErrorState title="오류" message={error} /> : <div className="text-center text-[14px] font-bold text-[#a39e96]">로딩 중...</div>}
              </div>
            </div>
          </div>
        </section>
        {menuOpen && (
          <ChatRoomActionSheet
            onClose={() => setMenuOpen(false)}
            onNotificationOff={() => {
              setMenuOpen(false);
              onNotificationOff();
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
      </>
    );
  }

  return (
    <>
      <ChatRoomTopBarLayer
        opponent={opponent}
        answerAdoptionRatePercent={answerAdoptionRatePercent}
        topBarLayerStyle={topBarLayerStyle}
        onBack={onBack}
        onOpenMenu={handleOpenMenu}
      />
      <section
        className="fixed inset-0 z-40 overflow-hidden bg-[#fff1d1]"
      >
        <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
          <div data-chat-room-canvas className="relative flex h-full w-full max-w-[480px] shrink-0 flex-col overflow-hidden bg-[#fff1d1] qling-figma-font" style={canvasStyle}>
            <ChatRoomTopBarSpacer isHidden={isTopBarHiddenForKeyboard} />
            <div
              ref={messagesScrollerRef}
              data-chat-room-message-scroller
              className={cn(
                'min-h-0 w-full flex-1 bg-[#fff1d1] px-4 pb-[28px] pt-4',
                isMessageScrollerScrollable
                  ? 'overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]'
                  : 'touch-none overscroll-none overflow-hidden',
              )}
              onScroll={handleMessagesScroll}
              onTouchStart={handleBackSwipeStart}
              onTouchMove={handleMessagesTouchMove}
              onTouchEnd={resetBackSwipe}
              onTouchCancel={resetBackSwipe}
              onWheel={isMessageScrollerScrollable ? undefined : blockStaticScroll}
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
                          
                        <div className="w-fit max-w-[min(260px,calc(100vw_-_174px))] rounded-bl-[18px] rounded-br-[18px] rounded-tl-[7px] rounded-tr-[18px] border-[0.8px] border-[#f1e7da] bg-white px-[14px] py-[10.4px] text-[14px] font-normal leading-[22.75px] tracking-[-0.35px] text-[#2b2620] shadow-[0_2px_4px_rgb(120_90_60/0.07)]">
                                {msg.content}
                             </div>
                          
                        <div className="flex h-[18px] w-[43px] shrink-0 items-end pb-[2px]">
                          <span className="whitespace-nowrap text-[10.5px] font-normal leading-[15.75px] text-[#a39e96]">{msg.createdAtStr}</span>
                          </div>
                       </div>
                    )}
                    
                    {msg.isMine && (
                      <div className="flex max-w-[calc(100%_-_40px)] items-end justify-end gap-2">
                        <div className="flex shrink-0 flex-col items-end justify-end gap-[2px] pb-[2px]">
                          {readStatusText && <span className="whitespace-nowrap text-[10.5px] font-semibold leading-[15.75px] text-[#f26c0f]">{readStatusText}</span>}
                          <span className="whitespace-nowrap text-[10.5px] font-normal leading-[15.75px] text-[#a39e96]">{msg.createdAtStr}</span>
                          </div>

                        <div className="w-fit max-w-[min(300px,calc(100vw_-_132px))] rounded-bl-[18px] rounded-br-[18px] rounded-tl-[18px] rounded-tr-[7px] bg-[#ff8a2e] px-[14px] py-[10.4px] text-[14px] font-normal leading-[22.75px] tracking-[-0.35px] text-white shadow-[0_4px_6px_rgb(255_122_26/0.32)]">
                             {msg.content}
                          </div>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
            <ChatRoomInputBar
              draft={draft}
              sendError={sendError}
              isSending={isSending}
              textareaHeight={textareaHeight}
              inputRef={messageInputRef}
              onDraftChange={handleDraftChange}
              onMessageKeyDown={handleMessageKeyDown}
              onMessageInputIntent={handleMessageInputIntent}
              onMessageInputBlur={handleMessageInputBlur}
              onSend={handleSend}
            />
          </div>
        </div>
      </section>
      {menuOpen && (
        <ChatRoomActionSheet
          onClose={() => setMenuOpen(false)}
          onNotificationOff={() => {
            setMenuOpen(false);
            onNotificationOff();
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
    </>
  );
}

function ChatRoomTopBarLayer({
  opponent,
  answerAdoptionRatePercent,
  topBarLayerStyle,
  onBack,
  onOpenMenu,
}: {
  readonly opponent: { nickname: string; profileColor: string } | null;
  readonly answerAdoptionRatePercent: number | null;
  readonly topBarLayerStyle: CSSProperties;
  readonly onBack: () => void;
  readonly onOpenMenu: () => void;
}) {
  return (
    <div
      data-chat-room-top-bar-layer
      className="fixed left-0 right-0 top-0 z-50 overflow-hidden bg-[#ff8b3d]"
      style={topBarLayerStyle}
    >
      <div className="mx-auto flex w-full max-w-[480px] justify-center">
        <div className="h-[calc(100px+var(--qling-pwa-direct-topbar-shift))] w-full max-w-[480px] shrink-0">
          <ChatRoomTopBar
            opponent={opponent}
            answerAdoptionRatePercent={answerAdoptionRatePercent}
            onBack={onBack}
            onOpenMenu={onOpenMenu}
          />
        </div>
      </div>
    </div>
  );
}

function ChatRoomTopBarSpacer({ isHidden }: { readonly isHidden: boolean }) {
  return (
    <div
      data-chat-room-top-bar-spacer
      className="w-full shrink-0 bg-[#ff8b3d]"
      style={{ height: isHidden ? 0 : chatRoomTopBarHeightCss }}
      aria-hidden="true"
    />
  );
}

function ChatRoomInputBar({
  draft,
  sendError,
  isSending,
  textareaHeight,
  inputRef,
  onDraftChange,
  onMessageKeyDown,
  onMessageInputIntent,
  onMessageInputBlur,
  onSend,
}: {
  readonly draft: string;
  readonly sendError: string | null;
  readonly isSending: boolean;
  readonly textareaHeight: number;
  readonly inputRef: RefObject<HTMLTextAreaElement | null>;
  readonly onDraftChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  readonly onMessageKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  readonly onMessageInputIntent: (source: string, pointerType?: string) => void;
  readonly onMessageInputBlur: () => void;
  readonly onSend: () => void;
}) {
  return (
      <div
        data-chat-room-input-bar
        className="relative h-[var(--chat-input-height)] w-full shrink-0 touch-none overscroll-none border-t border-[#ede3d6] bg-white qling-figma-font"
        onTouchMove={blockStaticScroll}
        onWheel={blockStaticScroll}
      >
        {sendError && (
          <div className="absolute bottom-[67px] left-4 right-4 rounded-[12px] bg-white px-3 py-2 text-center text-[12px] font-bold text-red-500 shadow-[0_2px_8px_rgb(120_90_60/0.12)]">
            {sendError}
          </div>
        )}
        <textarea
          ref={inputRef}
          data-chat-room-message-input
          value={draft}
          onChange={onDraftChange}
          onKeyDown={onMessageKeyDown}
          onTouchStart={() => onMessageInputIntent('textarea.touchstart')}
          onPointerDown={event => onMessageInputIntent('textarea.pointerdown', event.pointerType)}
          onFocus={() => onMessageInputIntent('textarea.focus')}
          onBlur={onMessageInputBlur}
          aria-label="메시지 입력"
          rows={1}
          inputMode="text"
          enterKeyHint="send"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          placeholder="메시지를 입력해 주세요"
          className="absolute left-[19px] right-[64px] top-[10.2px] resize-none rounded-[21px] border border-[#ede3d6] bg-[#fff4e8] px-[16.8px] py-[9px] text-[14px] font-normal leading-5 text-[#2b2620] outline-none placeholder:text-[#a39e96] focus:ring-2 focus:ring-[#ff8b3d]"
          style={{ height: textareaHeight, overflow: 'hidden' }}
        />
        <button
          type="button"
          onClick={() => void onSend()}
          disabled={!draft.trim() || isSending}
          aria-label="메시지 보내기"
          className="absolute right-[14px] top-[8.2px] flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#ff8b3d] shadow-[0_4px_6px_rgb(255_122_26/0.4)] transition-transform active:scale-95 disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-[#f26c0f]"
        >
          <img src={roomSendIconUrl} alt="" aria-hidden="true" className="h-5 w-5" draggable={false} />
        </button>
      </div>
  );
}

function ChatRoomTopBar({
  opponent,
  answerAdoptionRatePercent,
  onBack,
  onOpenMenu,
}: {
  readonly opponent: { nickname: string; profileColor: string } | null;
  readonly answerAdoptionRatePercent: number | null;
  readonly onBack: () => void;
  readonly onOpenMenu: () => void;
}) {
  return (
    <header
      data-chat-room-top-bar
      className="relative z-20 grid h-[calc(100px+var(--qling-pwa-direct-topbar-shift))] w-full shrink-0 touch-none grid-cols-[44px_minmax(0,1fr)_44px] items-start overflow-hidden overscroll-none bg-[#ff8b3d] px-[6px] pt-[calc(45px+var(--qling-pwa-direct-topbar-shift))] qling-figma-font"
      onTouchMove={blockStaticScroll}
      onWheel={blockStaticScroll}
    >
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로가기"
          className="flex h-[45px] w-[44px] items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <span aria-hidden="true" className="font-['Qling_Figma_Inter'] text-[32px] font-semibold leading-none">
            ‹
          </span>
        </button>
        <div className="flex h-[45px] min-w-0 items-center justify-center gap-[14px] px-2">
          <div className="relative h-[30px] w-[30px] shrink-0">
            <img
              src={profileImageUrlForColor(opponent?.profileColor || '#FF8B3D')}
              alt="프로필"
              className="h-[30px] w-[30px] rounded-full object-cover"
              draggable={false}
            />
            <span className="absolute left-[21px] top-5 h-[11px] w-[11px] rounded-full border-[1.6px] border-[#fff4e8] bg-[#3fc36b]" aria-hidden="true" />
          </div>
          <div className="flex min-w-0 max-w-[170px] flex-col items-start">
            <span className="max-w-full truncate text-[16px] font-extrabold leading-5 tracking-[-0.4px] text-white">
              {opponent?.nickname || '대화방'}
            </span>
            {answerAdoptionRatePercent !== null && (
              <span className="whitespace-nowrap text-[11.5px] font-medium leading-[17.25px] text-white/80">
                답변 채택률 {answerAdoptionRatePercent}%
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="채팅방 메뉴 열기"
          onClick={onOpenMenu}
          className="mr-2 flex h-[45px] w-9 items-center justify-center justify-self-end rounded-full transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <img src={roomMoreIconUrl} alt="" aria-hidden="true" className="h-[22px] w-[22px]" draggable={false} />
        </button>
    </header>
  );
}

function blockStaticScroll(event: WheelEvent<HTMLElement> | TouchEvent<HTMLElement>) {
  const { preventDefault, stopPropagation } = event;
  preventDefault.call(event);
  stopPropagation.call(event);
}

function canScrollMessageScroller(scroller: HTMLElement) {
  return scroller.scrollHeight > scroller.clientHeight + 1;
}

function isChatRoomBackSwipeIgnoredTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(
    'button, textarea, input, select, a, [role="button"], [role="dialog"], [data-chat-room-top-bar], [data-chat-room-input-bar]'
  ));
}

function logChatRoomKeyboardMetric(source: string) {
  if (!isChatRoomKeyboardDebugEnabled()) return;
  const visualViewport = window.visualViewport;
  const topBarLayerRect = readChatRoomElementRect('[data-chat-room-top-bar-layer]');
  const topBarRect = readChatRoomElementRect('[data-chat-room-top-bar]');
  console.info('[chat-room-keyboard]', {
    source,
    scrollY: window.scrollY,
    documentScrollTop: document.documentElement.scrollTop,
    visualViewportHeight: visualViewport?.height ?? null,
    visualViewportOffsetTop: visualViewport?.offsetTop ?? null,
    topBarLayerTop: topBarLayerRect?.top ?? null,
    topBarLayerHeight: topBarLayerRect?.height ?? null,
    topBarTop: topBarRect?.top ?? null,
    topBarHeight: topBarRect?.height ?? null,
  });
}

function readChatRoomElementRect(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    height: rect.height,
  };
}

function isChatRoomKeyboardDebugEnabled() {
  if (import.meta.env.DEV) return true;
  try {
    if (window.localStorage.getItem(chatRoomKeyboardDebugStorageKey) === '1') return true;
    return new URLSearchParams(window.location.search).get(chatRoomKeyboardDebugQueryParam) === '1';
  } catch {
    return false;
  }
}

function ChatRoomActionSheet({
  onClose,
  onNotificationOff,
  onBlock,
  onReport,
}: {
  readonly onClose: () => void;
  readonly onNotificationOff: () => void;
  readonly onBlock: () => void;
  readonly onReport: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-[rgba(40,30,20,0.42)]" role="presentation" onClick={onClose}>
      <div
        className="absolute bottom-0 left-1/2 h-[284px] w-full max-w-[480px] -translate-x-1/2 overflow-visible"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="채팅방 메뉴"
          className="absolute bottom-0 left-0 flex h-[284px] w-full flex-col items-start overflow-hidden rounded-tl-[22px] rounded-tr-[22px] bg-white pb-[26px] pt-[10px]"
          onClick={event => event.stopPropagation()}
        >
          <div className="flex w-full justify-center overflow-hidden pb-2">
            <span className="h-1 w-10 rounded-[2px] bg-[#e6dccf]" aria-hidden="true" />
          </div>
          <ActionSheetButton iconUrl={roomNotificationOffIconUrl} label="알림 끄기" onClick={onNotificationOff} />
          <ActionSheetButton iconUrl={roomBlockIconUrl} label="차단하기" danger onClick={onBlock} />
          <ActionSheetButton iconUrl={roomReportIconUrl} label="신고하기" danger onClick={onReport} />
          <div className="h-2 w-full shrink-0 bg-[#f4efe7]" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-[72px] w-full shrink-0 items-start justify-center py-[15px] font-['Qling_Noto_Sans_KR'] text-[15px] font-bold leading-[22px] text-[#8a857c] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset"
          >
            취소
          </button>
        </div>
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
