import { useState, type CSSProperties, type TouchEvent, type WheelEvent } from 'react';
import { FigmaCanvasFrame, profileImageUrlForColor } from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import { filterChatsByOpponentName } from './chatListSearch';

const searchIconUrl = new URL('../../../assets/chat/search_icon.svg', import.meta.url).href;
const myPageIconUrl = new URL('../../../assets/chat/my_page_icon.svg', import.meta.url).href;
const moreVerticalUrl = new URL('../../../assets/chat/more_vertical.svg', import.meta.url).href;
const emptyAvatarUrl = new URL('../../../assets/chat/empty_avatar.svg', import.meta.url).href;
const emptyEyesUrl = new URL('../../../assets/chat/empty_eyes.svg', import.meta.url).href;
const emptyQuestionUrl = new URL('../../../assets/chat/empty_question.svg', import.meta.url).href;

const chatListCardStyle = {
  gap: 'calc(10 / 361 * 100cqw)',
  padding: 'calc(14 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardTopRowStyle = {
  gap: 'calc(8 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardChipStyle = {
  padding: 'calc(3 / 361 * 100cqw) calc(9 / 361 * 100cqw)',
  fontSize: 'calc(10.5 / 361 * 100cqw)',
  lineHeight: 'calc(15 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardTitleStyle = {
  fontSize: 'calc(12.5 / 361 * 100cqw)',
  lineHeight: 'calc(18 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardMenuButtonStyle = {
  width: 'calc(22 / 361 * 100cqw)',
  height: 'calc(22 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardMainRowStyle = {
  gap: 'calc(10 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardAvatarStyle = {
  width: 'calc(38 / 361 * 100cqw)',
  height: 'calc(38 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardOnlineDotStyle = {
  left: 'calc(27 / 361 * 100cqw)',
  top: 'calc(28 / 361 * 100cqw)',
  width: 'calc(13 / 361 * 100cqw)',
  height: 'calc(13 / 361 * 100cqw)',
  borderWidth: 'calc(1.6 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardNameStyle = {
  gap: 'calc(3 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardOpponentNameStyle = {
  fontSize: 'calc(14.5 / 361 * 100cqw)',
  lineHeight: 'calc(20 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardLastMessageStyle = {
  fontSize: 'calc(13 / 361 * 100cqw)',
  lineHeight: 'calc(18 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardMetaStyle = {
  gap: 'calc(6 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardDateStyle = {
  fontSize: 'calc(11 / 361 * 100cqw)',
  lineHeight: 'calc(15 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListCardUnreadStyle = {
  minWidth: 'calc(20 / 361 * 100cqw)',
  padding: 'calc(2 / 361 * 100cqw) calc(6 / 361 * 100cqw)',
  fontSize: 'calc(11 / 361 * 100cqw)',
  lineHeight: 'calc(15 / 361 * 100cqw)',
} satisfies CSSProperties;
const chatListActionSheetStyle = {
  height: 'calc(284 / 393 * 100cqw)',
  paddingBottom: 'calc(26 / 393 * 100cqw)',
  paddingTop: 'calc(10 / 393 * 100cqw)',
} satisfies CSSProperties;
const chatListActionSheetHandleAreaStyle = {
  paddingBottom: 'calc(8 / 393 * 100cqw)',
} satisfies CSSProperties;
const chatListActionSheetButtonStyle = {
  padding: 'calc(15 / 393 * 100cqw) calc(20 / 393 * 100cqw)',
} satisfies CSSProperties;
const chatListActionSheetTextStyle = {
  fontSize: 'calc(15 / 393 * 100cqw)',
  lineHeight: 'calc(22 / 393 * 100cqw)',
} satisfies CSSProperties;
const chatListActionSheetCancelStyle = {
  height: 'calc(72 / 393 * 100cqw)',
  paddingTop: 'calc(15 / 393 * 100cqw)',
  paddingBottom: 'calc(15 / 393 * 100cqw)',
  fontSize: 'calc(15 / 393 * 100cqw)',
  lineHeight: 'calc(22 / 393 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyStateStyle = {
  width: 'calc(301 / 393 * 100cqw)',
  height: 'calc(305 / 393 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyAvatarGroupStyle = {
  width: 'calc(80.76 / 301 * 100cqw)',
  height: 'calc(76.58 / 301 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyGapLargeStyle = {
  height: 'calc(21 / 301 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyGapSmallStyle = {
  height: 'calc(10 / 301 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyGapTipStyle = {
  height: 'calc(22 / 301 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyAvatarStyle = {
  left: 0,
  top: 'calc(3.58 / 301 * 100cqw)',
  width: 'calc(74 / 301 * 100cqw)',
  height: 'calc(73 / 301 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyEyesStyle = {
  left: 'calc(21.43 / 301 * 100cqw)',
  top: 'calc(28.9 / 301 * 100cqw)',
  width: 'calc(31.43 / 301 * 100cqw)',
  height: 'calc(23.84 / 301 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyQuestionStyle = {
  left: 'calc(45.96 / 301 * 100cqw)',
  top: 0,
  width: 'calc(34.802 / 301 * 100cqw)',
  height: 'calc(65.303 / 301 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyTitleStyle = {
  fontSize: 'calc(18 / 301 * 100cqw)',
  lineHeight: 'calc(26 / 301 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyDescriptionStyle = {
  fontSize: 'calc(13.5 / 301 * 100cqw)',
  lineHeight: 'calc(20 / 301 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyTipStyle = {
  padding: 'calc(13 / 301 * 100cqw) calc(15 / 301 * 100cqw)',
} satisfies CSSProperties;
const chatEmptyTipTextStyle = {
  fontSize: 'calc(12.5 / 301 * 100cqw)',
  lineHeight: 'calc(18 / 301 * 100cqw)',
} satisfies CSSProperties;

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
  onProfileClick,
  onNotificationOff,
  onLeaveChat,
  onReportUser,
}: {
  readonly loading?: boolean;
  readonly chats?: ChatListItem[];
  readonly onChatClick?: (chatId: string) => void;
  readonly onProfileClick?: () => void;
  readonly onNotificationOff?: () => void;
  readonly onLeaveChat?: (chatId: string) => void;
  readonly onReportUser?: (chatId: string, opponentUid: string, opponentNickname: string) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const screenClassName = '-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-[852px] w-full max-w-[480px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d] qling-figma-font';
  const visibleChats = filterChatsByOpponentName(chats ?? [], searchQuery);
  const selectedMenuChat = visibleChats.find(chat => chat.chatId === openMenuId) ?? null;

  return (
    <section className={screenClassName} onClick={() => setOpenMenuId(null)}>
      <FigmaCanvasFrame className="max-w-[480px]">
        <div className={canvasClassName}>
          <ChatStaticHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenMyPage={onProfileClick}
          />
          <CreamContentBackground />

          {loading ? (
            <section
              className="absolute left-0 top-[136px] h-[716px] w-full touch-none overscroll-none overflow-hidden rounded-t-[30px]"
              aria-label="채팅 목록 로딩 상태"
              onWheel={blockStaticScroll}
              onTouchMove={blockStaticScroll}
            >
              <FigmaTabLoading label="채팅 목록을 불러오는 중입니다" className="top-[270px]" />
            </section>
          ) : chats && chats.length > 0 ? (
            <section
              className="absolute left-0 top-[136px] h-[716px] w-full overflow-y-auto rounded-t-[30px] px-4 pb-[108px] pt-4 [-webkit-overflow-scrolling:touch]"
              aria-label="채팅 목록"
            >
              <div className="flex flex-col gap-3">
                {visibleChats.map(chat => (
                  <ChatListCard
                    key={chat.chatId}
                    chat={chat}
                    onChatClick={onChatClick}
                    onToggleMenu={() => setOpenMenuId(openMenuId === chat.chatId ? null : chat.chatId)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section
              className="absolute left-0 top-[136px] flex h-[716px] w-full touch-none overscroll-none items-center justify-center overflow-hidden rounded-t-[30px] [container-type:inline-size]"
              aria-label="채팅 목록 빈 상태"
              onWheel={blockStaticScroll}
              onTouchMove={blockStaticScroll}
            >
              <ChatEmptyState />
            </section>
          )}
          {selectedMenuChat && (
            <ChatListActionSheet
              chat={selectedMenuChat}
              onClose={() => setOpenMenuId(null)}
              onNotificationOff={() => {
                setOpenMenuId(null);
                onNotificationOff?.();
              }}
              onLeaveChat={() => {
                setOpenMenuId(null);
                onLeaveChat?.(selectedMenuChat.chatId);
              }}
              onReportUser={() => {
                setOpenMenuId(null);
                onReportUser?.(selectedMenuChat.chatId, selectedMenuChat.opponentUid, selectedMenuChat.opponentName);
              }}
            />
          )}
        </div>
      </FigmaCanvasFrame>
    </section>
  );
}

function ChatStaticHeader({
  searchQuery,
  onSearchChange,
  onOpenMyPage,
}: {
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly onOpenMyPage?: () => void;
}) {
  return (
    <header
      className="absolute left-0 top-0 h-[202px] w-full overscroll-none bg-[#ff8b3d]"
      onTouchMove={blockStaticScroll}
      onWheel={blockStaticScroll}
    >
      <h1 className="absolute left-0 top-[34px] w-full text-center text-[17px] font-extrabold leading-normal tracking-[-0.34px] text-white">
        채팅
      </h1>
      <button
        type="button"
        aria-label="마이페이지 열기"
        onClick={onOpenMyPage}
        className="absolute right-[17px] top-[20px] h-[49px] w-[49px] rounded-full transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <img src={myPageIconUrl} alt="" aria-hidden="true" className="absolute left-3 top-[13px] h-[25px] w-[25px]" draggable={false} />
      </button>
      <label className="absolute left-4 right-4 top-[75px] flex h-10 items-center gap-2 rounded-[14px] bg-white/[0.22] px-3">
        <span className="sr-only">닉네임으로 검색</span>
        <img src={searchIconUrl} alt="" aria-hidden="true" className="h-4 w-4 shrink-0" draggable={false} />
        <input
          value={searchQuery}
          onChange={event => onSearchChange(event.target.value)}
          onClick={event => event.stopPropagation()}
          placeholder="닉네임으로 검색"
          className="min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-5 text-white outline-none placeholder:text-white/85"
        />
      </label>
    </header>
  );
}

function CreamContentBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 top-[136px] h-[716px] w-full overflow-hidden rounded-t-[30px] bg-[#fff1d1]"
    />
  );
}

function ChatListCard({
  chat,
  onChatClick,
  onToggleMenu,
}: {
  readonly chat: ChatListItem;
  readonly onChatClick?: (chatId: string) => void;
  readonly onToggleMenu: () => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onChatClick?.(chat.chatId)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onChatClick?.(chat.chatId);
      }}
      className="relative w-full cursor-pointer overflow-visible rounded-[16px] border border-[#f1e7da] bg-white text-left shadow-[0_4px_4px_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2 [container-type:inline-size]"
    >
      <div className="flex w-full flex-col items-start overflow-visible" style={chatListCardStyle}>
        <div className="flex w-full items-center overflow-hidden" style={chatListCardTopRowStyle}>
          <span className="shrink-0 overflow-hidden rounded-full bg-[#ffe7d2] font-black text-[#f26c0f]" style={chatListCardChipStyle}>
            {chat.worryCategory || '기타'}
          </span>
          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-normal text-[#6e6a63]" style={chatListCardTitleStyle}>
            {chat.worryTitle || '게시글 정보 불러오는 중...'}
          </span>
          <div className="relative shrink-0" style={chatListCardMenuButtonStyle}>
            <button
              type="button"
              aria-label="채팅방 메뉴 열기"
              onClick={(event) => {
                event.stopPropagation();
                onToggleMenu();
              }}
              className="absolute inset-0 rounded-full transition-colors hover:bg-[#f4efe7] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d]"
            >
              <img src={moreVerticalUrl} alt="" aria-hidden="true" className="h-full w-full" draggable={false} />
            </button>
          </div>
        </div>

        <div className="h-px w-full shrink-0 bg-[#f4efe7]" />

        <div className="relative flex w-full items-center overflow-hidden" style={chatListCardMainRowStyle}>
          <div className="relative shrink-0" style={chatListCardAvatarStyle}>
            <img
              src={profileImageUrlForColor(chat.opponentColor || '#ff8b3d')}
              alt="프로필"
              className="h-full w-full rounded-full object-cover"
              draggable={false}
            />
            <span className="absolute rounded-full border-[#fff4e8] bg-[#3fc36b]" style={chatListCardOnlineDotStyle} aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start overflow-hidden whitespace-nowrap" style={chatListCardNameStyle}>
            <p className="max-w-full overflow-hidden text-ellipsis font-bold text-[#2b2620]" style={chatListCardOpponentNameStyle}>
              {chat.opponentName}
            </p>
            <p className="min-w-full overflow-hidden text-ellipsis font-normal text-[#6e6a63]" style={chatListCardLastMessageStyle}>
              {chat.lastMessage}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end overflow-hidden" style={chatListCardMetaStyle}>
            <time className="whitespace-nowrap font-normal text-[#a39e96]" style={chatListCardDateStyle}>
              {chat.dateLabel}
            </time>
            {chat.unreadCount > 0 && (
              <span className="flex items-start justify-center rounded-full bg-[#ff7a1a] font-bold text-white" style={chatListCardUnreadStyle}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ChatListActionSheet({
  chat,
  onClose,
  onNotificationOff,
  onLeaveChat,
  onReportUser,
}: {
  readonly chat: ChatListItem;
  readonly onClose: () => void;
  readonly onNotificationOff: () => void;
  readonly onLeaveChat: () => void;
  readonly onReportUser: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 bg-[rgba(40,30,20,0.42)] [container-type:inline-size]" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${chat.opponentName} 채팅 메뉴`}
        className="absolute bottom-0 left-0 flex w-full flex-col items-start overflow-hidden rounded-tl-[22px] rounded-tr-[22px] bg-white [container-type:inline-size]"
        style={chatListActionSheetStyle}
        onClick={event => event.stopPropagation()}
      >
        <div className="flex w-full justify-center overflow-hidden" style={chatListActionSheetHandleAreaStyle}>
          <span className="h-1 w-10 rounded-[2px] bg-[#e6dccf]" aria-hidden="true" />
        </div>
        <ChatListActionSheetButton label="알림 끄기" onClick={onNotificationOff} />
        <ChatListActionSheetButton label="채팅방 나가기" danger onClick={onLeaveChat} />
        <ChatListActionSheetButton label="신고하기" danger onClick={onReportUser} />
        <div className="h-2 w-full shrink-0 bg-[#f4efe7]" />
        <button
          type="button"
          onClick={onClose}
          className="flex w-full shrink-0 items-start justify-center font-['Qling_Noto_Sans_KR'] font-bold text-[#8a857c] focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset"
          style={chatListActionSheetCancelStyle}
        >
          취소
        </button>
      </div>
    </div>
  );
}

function ChatListActionSheetButton({
  label,
  danger = false,
  onClick,
}: {
  readonly label: string;
  readonly danger?: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full shrink-0 items-center text-left focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset"
      style={chatListActionSheetButtonStyle}
    >
      <span className={danger ? 'font-medium text-[#e5484d]' : 'font-medium text-[#2b2620]'} style={chatListActionSheetTextStyle}>
        {label}
      </span>
    </button>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center overflow-hidden text-center [container-type:inline-size]" style={chatEmptyStateStyle}>
      <div className="relative shrink-0" style={chatEmptyAvatarGroupStyle} aria-hidden="true">
        <img src={emptyAvatarUrl} alt="" className="absolute" style={chatEmptyAvatarStyle} draggable={false} />
        <img src={emptyEyesUrl} alt="" className="absolute" style={chatEmptyEyesStyle} draggable={false} />
        <img src={emptyQuestionUrl} alt="" className="absolute" style={chatEmptyQuestionStyle} draggable={false} />
      </div>
      <div className="shrink-0" style={chatEmptyGapLargeStyle} />
      <h2 className="whitespace-nowrap font-black text-[#2b2620]" style={chatEmptyTitleStyle}>
        아직 시작된 채팅이 없어요
      </h2>
      <div className="shrink-0" style={chatEmptyGapSmallStyle} />
      <p className="text-center font-normal text-[#6e6a63]" style={chatEmptyDescriptionStyle}>
        답변에 코멘트를 받으면,<br />
        답변자가 먼저 채팅을 시작할 수 있어요.
      </p>
      <div className="shrink-0" style={chatEmptyGapTipStyle} />
      <div className="w-full rounded-[14px] border border-[#f1e7da] bg-white" style={chatEmptyTipStyle}>
        <p className="whitespace-pre-wrap text-center font-normal text-[#6e6a63]" style={chatEmptyTipTextStyle}>
          좋은 답변을 남기면 채팅으로 이어질 확률이<br />
          높아져요. 받은 고민에 답변을 달아보세요!
        </p>
      </div>
    </div>
  );
}

function blockStaticScroll(event: WheelEvent<HTMLElement> | TouchEvent<HTMLElement>) {
  const { preventDefault, stopPropagation } = event;
  preventDefault.call(event);
  stopPropagation.call(event);
}
