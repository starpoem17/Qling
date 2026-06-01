import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { FigmaTopBar, ErrorState } from '../shared/ui';

export interface ChatMessage {
  messageId: string;
  content: string;
  isMine: boolean;
  createdAtStr: string;
}

export function ChatRoomScreen({
  loading,
  error,
  messages,
  opponent,
  onBack,
  onSendMessage,
}: {
  readonly loading: boolean;
  readonly error: string | null;
  readonly messages: ChatMessage[];
  readonly opponent: { nickname: string; profileColor: string } | null;
  readonly onBack: () => void;
  readonly onSendMessage: (content: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasScale = 'calc(min(100vw, var(--qling-mobile-canvas-max-width)) / 393px)';

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

  if (loading) {
    return (
      <section className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#fff1d1]">
        <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
          <div className="relative h-[852px] w-[393px] shrink-0 origin-top bg-[#fff1d1]" style={{ transform: `scale(${canvasScale})` }}>
             <FigmaTopBar title="채팅" onBack={onBack} backLabel="뒤로가기" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#fff1d1]">
        <div className="mx-auto flex h-full w-full max-w-[480px] justify-center overflow-hidden">
          <div className="relative h-[852px] w-[393px] shrink-0 origin-top bg-[#fff1d1]" style={{ transform: `scale(${canvasScale})` }}>
            <FigmaTopBar title="채팅" onBack={onBack} backLabel="뒤로가기" />
            <div className="pt-[127px] px-[24px]">
              <ErrorState title="오류" message={error} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="-mx-[var(--qling-space-shell-x)] -mt-6 min-h-full overflow-hidden bg-[#fff1d1] pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto flex w-full max-w-[480px] justify-center overflow-visible">
        <div
          className="relative min-h-[852px] w-[393px] shrink-0 origin-top bg-[#fff1d1] flex flex-col"
          style={{ transform: `scale(${canvasScale})` }}
        >
          <FigmaTopBar title={opponent?.nickname || '대화방'} onBack={onBack} backLabel="뒤로가기" />
          
          <div className="flex-1 overflow-y-auto pt-[127px] pb-[80px] px-[24px] scrollbar-hide">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[14px] font-bold text-[#b8b8b8]">
                첫 메시지를 보내보세요!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map(msg => (
                  <div key={msg.messageId} className={cn('flex flex-col', msg.isMine ? 'items-end' : 'items-start')}>
                    {!msg.isMine && (
                       <div className="flex items-center gap-2 mb-1">
                         <div className="w-[30px] h-[30px] rounded-full" style={{ backgroundColor: opponent?.profileColor }} />
                         <span className="text-[12px] font-bold text-[#2a2a2a]">{opponent?.nickname}</span>
                       </div>
                    )}
                    <div className={cn(
                      'max-w-[70%] rounded-[18px] px-4 py-[10px] text-[14px] font-bold leading-[21px] tracking-[-0.42px]',
                      msg.isMine ? 'bg-[#ff8b3d] text-white rounded-tr-sm' : 'bg-white text-[#2a2a2a] rounded-tl-sm shadow-[0_4px_4px_rgb(0_0_0/0.1)]'
                    )}>
                      {msg.content}
                    </div>
                    <span className="mt-1 text-[10px] text-[#b8b8b8]">{msg.createdAtStr}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 w-full bg-white px-4 py-3 shadow-[0_-4px_10px_rgb(0_0_0/0.05)]">
            {sendError && (
              <div className="mb-2 text-center text-[12px] font-bold text-[var(--qling-color-danger)]">
                {sendError}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="메시지를 입력하세요"
                className="flex-1 rounded-full border border-[#c2c4c8] bg-[#f8f9fa] px-4 py-2 text-[14px] outline-none focus:border-[#ff8b3d] focus:ring-1 focus:ring-[#ff8b3d]"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || isSending}
                className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#ff8b3d] text-white disabled:bg-[#c2c4c8]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
