const chatStartDotUrl = new URL('../../../assets/chat/chat_start_dot.svg', import.meta.url).href;

export function ChatStartConfirmationPopup({
  onCancel,
  onConfirm,
  isProcessing = false,
  idPrefix = 'my-answers-chat-start-confirmation',
}: {
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly isProcessing?: boolean;
  readonly idPrefix?: string;
}) {
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;

  return (
    <>
      <div className="absolute inset-0 z-40 bg-[rgba(40,30,20,0.42)]" aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="absolute left-1/2 top-[251px] z-50 h-[288px] w-[310px] -translate-x-1/2 rounded-[24px] bg-white shadow-[0_12px_20px_rgba(0,0,0,0.18)]"
      >
        <img
          src={chatStartDotUrl}
          alt=""
          className="absolute left-[125px] top-[26px] h-[60px] w-[60px]"
          aria-hidden="true"
        />
        <h2
          id={titleId}
          className="absolute left-1/2 top-[119.5px] flex -translate-x-1/2 -translate-y-1/2 flex-col justify-center whitespace-nowrap text-center font-['Qling_Noto_Sans_KR_Black'] text-[19px] font-black leading-normal tracking-[-0.38px] text-[#1a1a1e]"
        >
          채팅을 시작할까요?
        </h2>
        <p
          id={descriptionId}
          className="absolute left-1/2 top-[141px] w-[262px] -translate-x-1/2 text-center font-['Qling_Noto_Sans_KR'] text-[13px] font-normal leading-[19px] text-[#6e6a63]"
        >
          <span className="block">채팅을 시작하면 서로의 닉네임을 볼 수 있고</span>
          <span className="block">상대방에게 채팅 시작 알림이 전송됩니다.</span>
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="absolute left-[30px] top-[201px] h-[52px] w-[120px] rounded-[12px] border border-[#b8b8b8] bg-white text-[15px] font-bold leading-normal tracking-[-0.15px] text-[#b8b8b8] focus:outline-none focus:ring-2 focus:ring-[#b8b8b8] focus:ring-offset-2"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          aria-busy={isProcessing || undefined}
          disabled={isProcessing}
          className="absolute left-[160px] top-[201px] h-[52px] w-[120px] rounded-[12px] bg-[#ff8b3d] text-[15px] font-bold leading-normal tracking-[-0.15px] text-white focus:outline-none focus:ring-2 focus:ring-[#ff8b3d] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
        >
          확인
        </button>
      </section>
    </>
  );
}
