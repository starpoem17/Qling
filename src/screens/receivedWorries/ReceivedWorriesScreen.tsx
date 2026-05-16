import { Loader2, MessageSquare, XCircle } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { ReceivedWorriesScreenProps } from './contract';

export function ReceivedWorriesScreen(props: ReceivedWorriesScreenProps) {
  const passingDeliveryIds = new Set(props.passingDeliveryIds);

  if (props.state.status === 'loading') {
    return (
      <div className="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-[#E9EDC9]">
        <Loader2 className="w-12 h-12 text-[#D4A373] mx-auto mb-3 animate-spin" />
        <p className="text-[#8B8B6B]">{props.state.label}</p>
      </div>
    );
  }

  if (props.state.status === 'error') {
    return (
      <div className="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-[#E9EDC9]">
        <XCircle className="w-12 h-12 text-[#E07A5F] mx-auto mb-3" />
        <p className="text-[#8B8B6B]">{props.state.message}</p>
      </div>
    );
  }

  if (props.state.status === 'empty') {
    return (
      <div className="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-[#E9EDC9]">
        <MessageSquare className="w-12 h-12 text-[#E9EDC9] mx-auto mb-3" />
        <p className="text-[#8B8B6B]">{props.state.message}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {props.items.map(item => {
        const isPassing = passingDeliveryIds.has(item.deliveryId);

        return (
          <article
            key={item.deliveryId}
            onClick={() => props.onOpen({ deliveryId: item.deliveryId, worryId: item.worryId })}
            className={`bg-white p-6 rounded-2xl shadow-sm border relative group cursor-pointer ${
              item.isUnread ? 'border-[#E07A5F] bg-[#FFF8F1]' : 'border-[#FAEDCD]'
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-[#FAEDCD] text-[#D4A373] text-[10px] font-bold rounded-lg border border-[#E9EDC9]">
                {item.category}
              </span>
              <time className="text-[#8B8B6B] text-xs" dateTime={item.receivedAt.isoValue}>
                · {item.receivedAt.label}
              </time>
            </div>
            <p className="text-[#5A5A40] leading-relaxed mb-6 whitespace-pre-wrap font-medium">
              {item.bodyText ?? item.previewText}
            </p>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                type="button"
                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  props.onReply({ deliveryId: item.deliveryId, worryId: item.worryId });
                }}
                className="min-w-0 py-3 bg-[#FDFCF8] text-[#8B8B6B] font-medium border border-[#E9EDC9] rounded-xl hover:bg-[#FAEDCD] hover:text-[#5A5A40] transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> 다정하게 답장해주기
              </button>
              <button
                type="button"
                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  props.onPass(item.deliveryId);
                }}
                disabled={isPassing}
                className="px-4 py-3 bg-white text-[#8B8B6B] font-bold border border-[#E9EDC9] rounded-xl hover:bg-[#FDFCF8] hover:text-[#5A5A40] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                title="패스"
              >
                {isPassing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-4 h-4" />}
                <span className="hidden sm:inline">패스</span>
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
