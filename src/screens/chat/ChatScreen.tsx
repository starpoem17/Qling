import { useState, type TouchEvent, type WheelEvent } from 'react';
import { cn } from '../../lib/utils';
import { profileImageUrlForColor } from '../shared/ui';
import { FigmaTabLoading } from '../shared/FigmaTabLoading';
import { filterChatsByOpponentName } from './chatListSearch';

const searchIconUrl = new URL('../../../assets/chat/search_icon.svg', import.meta.url).href;
const myPageIconUrl = new URL('../../../assets/chat/my_page_icon.svg', import.meta.url).href;
const moreVerticalUrl = new URL('../../../assets/chat/more_vertical.svg', import.meta.url).href;
const emptyAvatarUrl = new URL('../../../assets/chat/empty_avatar.svg', import.meta.url).href;
const emptyEyesUrl = new URL('../../../assets/chat/empty_eyes.svg', import.meta.url).href;
const emptyQuestionUrl = new URL('../../../assets/chat/empty_question.svg', import.meta.url).href;

export interface ChatListItem {
  chatId: string;
  opponentUid: string;
  opponentName: string;
  opponentColor: string;
  lastMessage: string;
  dateLabel: string;
  unreadCount: number;
  moderationBlocked?: boolean;
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
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';
  const screenClassName = '-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d]';
  const canvasClassName = 'relative h-[852px] w-[393px] shrink-0 origin-top overflow-hidden bg-[#ff8b3d] qling-figma-font';
  const visibleChats = filterChatsByOpponentName(chats ?? [], searchQuery);
  const selectedMenuChat = visibleChats.find(chat => chat.chatId === openMenuId) ?? null;

  return (
    <section className={screenClassName} onClick={() => setOpenMenuId(null)}>
      <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
        <div className={canvasClassName} style={{ transform: `scale(${canvasScale})` }}>
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
              className="absolute left-0 top-[136px] flex h-[716px] w-full touch-none overscroll-none items-center justify-center overflow-hidden rounded-t-[30px]"
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
      </div>
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
        className="absolute left-[327px] top-[20px] h-[49px] w-[49px] rounded-full transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <img src={myPageIconUrl} alt="" aria-hidden="true" className="absolute left-3 top-[13px] h-[25px] w-[25px]" draggable={false} />
      </button>
      <label className="absolute left-4 top-[75px] flex h-10 w-[361px] items-center gap-2 rounded-[14px] bg-white/[0.22] px-3">
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
      className="relative flex w-full cursor-pointer flex-col items-start gap-[10px] overflow-visible rounded-[16px] border border-[#f1e7da] bg-white p-[14px] text-left shadow-[0_4px_4px_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2"
    >
      <div className="flex w-full items-center gap-2 overflow-hidden">
        <span className="shrink-0 overflow-hidden rounded-full bg-[#ffe7d2] px-[9px] py-[3px] text-[10.5px] font-black leading-[15px] text-[#f26c0f]">
          {chat.worryCategory || '기타'}
        </span>
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-normal leading-[18px] text-[#6e6a63]">
          {chat.worryTitle || '게시글 정보 불러오는 중...'}
        </span>
        <div className="relative h-[22px] w-[22px] shrink-0">
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

      <div className="relative flex w-full items-center gap-[10px] overflow-hidden">
        <div className="relative h-[38px] w-[38px] shrink-0">
          <img
            src={profileImageUrlForColor(chat.opponentColor || '#ff8b3d')}
            alt="프로필"
            className="h-[38px] w-[38px] rounded-full object-cover"
            draggable={false}
          />
          <span className="absolute left-[27px] top-[28px] h-[13px] w-[13px] rounded-full border-[1.6px] border-[#fff4e8] bg-[#3fc36b]" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[3px] overflow-hidden whitespace-nowrap">
          <p className={cn(
            "max-w-full overflow-hidden text-ellipsis text-[14.5px] font-bold leading-5",
            chat.moderationBlocked ? 'text-[#8a3a27]' : 'text-[#2b2620]'
          )}>
            {chat.opponentName}
          </p>
          <p className={cn(
            "min-w-full overflow-hidden text-ellipsis text-[13px] font-normal leading-[18px]",
            chat.moderationBlocked ? 'font-semibold text-[#e5484d]' : 'text-[#6e6a63]'
          )}>
            {chat.lastMessage}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-[6px] overflow-hidden">
          <time className="whitespace-nowrap text-[11px] font-normal leading-[15px] text-[#a39e96]">
            {chat.dateLabel}
          </time>
          {chat.unreadCount > 0 && (
            <span className="flex min-w-[20px] items-start justify-center rounded-full bg-[#ff7a1a] px-[6px] py-[2px] text-[11px] font-bold leading-[15px] text-white">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
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
    <div className="absolute inset-0 z-40 bg-[rgba(40,30,20,0.42)]" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${chat.opponentName} 채팅 메뉴`}
        className="absolute bottom-0 left-0 flex h-[284px] w-full flex-col items-start overflow-hidden rounded-tl-[22px] rounded-tr-[22px] bg-white pb-[26px] pt-[10px]"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex w-full justify-center overflow-hidden pb-2">
          <span className="h-1 w-10 rounded-[2px] bg-[#e6dccf]" aria-hidden="true" />
        </div>
        <ChatListActionSheetButton label="알림 끄기" onClick={onNotificationOff} />
        <ChatListActionSheetButton label="채팅방 나가기" danger onClick={onLeaveChat} />
        <ChatListActionSheetButton label="신고하기" danger onClick={onReportUser} />
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
      className="flex w-full shrink-0 items-center px-5 py-[15px] text-left focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-inset"
    >
      <span className={danger ? 'text-[15px] font-medium leading-[22px] text-[#e5484d]' : 'text-[15px] font-medium leading-[22px] text-[#2b2620]'}>
        {label}
      </span>
    </button>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex h-[305px] w-[301px] flex-col items-center justify-center overflow-hidden text-center">
      <div className="relative h-[76.58px] w-[80.76px] shrink-0" aria-hidden="true">
        <img src={emptyAvatarUrl} alt="" className="absolute left-0 top-[3.58px] h-[73px] w-[74px]" draggable={false} />
        <img src={emptyEyesUrl} alt="" className="absolute left-[21.43px] top-[28.9px] h-[23.84px] w-[31.43px]" draggable={false} />
        <img src={emptyQuestionUrl} alt="" className="absolute left-[45.96px] top-0 h-[65.303px] w-[34.802px]" draggable={false} />
      </div>
      <div className="h-[21px] shrink-0" />
      <h2 className="whitespace-nowrap text-[18px] font-black leading-[26px] text-[#2b2620]">
        아직 시작된 채팅이 없어요
      </h2>
      <div className="h-[10px] shrink-0" />
      <p className="text-center text-[13.5px] font-normal leading-5 text-[#6e6a63]">
        답변에 코멘트를 받으면,<br />
        답변자가 먼저 채팅을 시작할 수 있어요.
      </p>
      <div className="h-[22px] shrink-0" />
      <div className="w-full rounded-[14px] border border-[#f1e7da] bg-white px-[15px] py-[13px]">
        <p className="whitespace-pre-wrap text-center text-[12.5px] font-normal leading-[18px] text-[#6e6a63]">
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
