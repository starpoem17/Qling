import { Clover } from 'lucide-react';
import { PrimaryCTA } from '../shared/ui';
import type { WriteWorrySuccessScreenProps } from './contract';

export function WriteWorrySuccessScreen(props: WriteWorrySuccessScreenProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-10" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-worry-success-title"
        aria-describedby="write-worry-success-description"
        className="w-full max-w-[19.375rem] rounded-[1.375rem] bg-white px-6 py-8 text-center shadow-[var(--qling-shadow-modal)]"
      >
        <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center text-[#55bd57]" aria-hidden="true">
          <Clover className="h-10 w-10 fill-current" aria-hidden="true" />
        </div>
        <h1 id="write-worry-success-title" className="text-xl font-extrabold text-[var(--qling-color-text)]">
          고민 전송이 완료되었어요 !
        </h1>
        <p id="write-worry-success-description" className="mt-5 text-sm font-semibold text-[var(--qling-color-muted)]">
          답변이 오면 알려드릴게요
        </p>
        <div className="mt-11">
          <PrimaryCTA accessibilityLabel="고민 전송 완료 확인" onClick={props.onConfirm}>
            확인
          </PrimaryCTA>
        </div>
      </section>
    </div>
  );
}
