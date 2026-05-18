import { Clover } from 'lucide-react';
import { PrimaryCTA } from '../shared/ui';
import type { WriteReplySuccessScreenProps } from './contract';

export function WriteReplySuccessScreen(props: WriteReplySuccessScreenProps) {
  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-black/35 px-10" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-reply-success-title"
        aria-describedby="write-reply-success-description"
        className="absolute top-[251px] w-full max-w-[19.375rem] rounded-[1.5rem] bg-white px-6 py-8 text-center shadow-[var(--qling-shadow-modal)]"
      >
        <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center text-[#55bd57]" aria-hidden="true">
          <Clover className="h-10 w-10 fill-current" aria-hidden="true" />
        </div>
        <h1 id="write-reply-success-title" className="text-[19px] font-bold text-[#1a1a1e]">
          답변 전송이 완료되었어요 !
        </h1>
        <p id="write-reply-success-description" className="mt-5 text-sm font-bold leading-6 text-[#6e7076]">
          따뜻한 의견을 공유해주셔서 감사해요
        </p>
        <div className="mt-11">
          <PrimaryCTA accessibilityLabel="답변 전송 완료 확인" onClick={props.onConfirm}>
            확인
          </PrimaryCTA>
        </div>
      </section>
    </div>
  );
}
