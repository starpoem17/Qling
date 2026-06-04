import { useState } from 'react';
import { cn } from '../../lib/utils';

export interface ReportUserScreenProps {
  onBack: () => void;
  onSubmit: (reason: string, description: string) => void;
  isSubmitting: boolean;
  submitError: string | null;
  targetNickname: string;
}

const REPORT_REASONS = [
  '욕설 · 비방',
  '음란성 · 부적절한 내용',
  '스팸 · 광고',
  '사기 · 사칭',
  '개인정보 요구',
  '기타',
];

export function ReportUserScreen({
  onBack,
  onSubmit,
  isSubmitting,
  submitError,
  targetNickname,
}: ReportUserScreenProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = () => {
    if (!selectedReason || isSubmitting) return;
    onSubmit(selectedReason, description);
  };

  return (
    <section className="-mx-[var(--qling-space-shell-x)] -mb-[var(--qling-space-scroll-bottom)] -mt-6 h-dvh overflow-hidden bg-[#ff8b3d]">
      <div className="mx-auto flex h-full w-full max-w-[480px] flex-col bg-[#ff8b3d]">
        {/* Top Bar Area */}
        <div className="relative h-[115px] shrink-0 w-full z-20 bg-[#ff8b3d]">
          <button
            type="button"
            onClick={onBack}
            aria-label="뒤로가기"
            className="absolute left-[14px] top-[49px] h-[44px] w-[28px] rounded-full transition-colors focus:outline-none focus:ring-2 hover:bg-white/20 focus:ring-white z-10"
          >
            <span aria-hidden="true" className="absolute left-[8px] top-0 font-['Qling_Figma_Inter'] text-[32px] font-semibold leading-[38px] text-white">
              ‹
            </span>
          </button>
          
          <h1 className="absolute left-0 top-[60px] w-full text-center text-[17px] font-extrabold leading-[21px] tracking-[-0.34px] font-sans text-white pointer-events-none">
            신고하기
          </h1>
        </div>

        {/* Report Content Area */}
        <div className="flex-1 w-full bg-[#fff5eb] rounded-t-[24px] overflow-hidden flex flex-col relative z-10 shadow-[0_-4px_16px_rgb(0_0_0/0.05)] pt-8 px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              {/* Headings */}
              <div className="mb-6">
                <h2 className="text-[20px] font-bold text-[#2a2a2a] mb-2 leading-tight">
                  신고 사유를 선택해 주세요
                </h2>
                <p className="text-[13px] text-[#9a9a9a] font-medium tracking-tight">
                  허위 신고 시 서비스 이용이 제한될 수 있어요.
                </p>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="mb-4 text-[13px] font-bold text-red-500 bg-red-50 p-3 rounded-xl">
                  {submitError}
                </div>
              )}

              {/* Radio List */}
              <div className="flex flex-col gap-[10px] mb-6">
                {REPORT_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={cn(
                        "w-full flex items-center justify-between px-[18px] py-4 bg-white rounded-xl border text-left transition-colors",
                        isSelected ? "border-[#ff8b3d]" : "border-[#f0e8df]"
                      )}
                    >
                      <span className={cn(
                        "text-[15px] font-semibold",
                        isSelected ? "text-[#2a2a2a]" : "text-[#4a4a4a]"
                      )}>
                        {reason}
                      </span>
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors",
                        isSelected ? "border-[#ff8b3d]" : "border-[#d8d8d8]"
                      )}>
                        {isSelected && (
                          <div className="w-[10px] h-[10px] rounded-full bg-[#ff8b3d]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Textarea */}
              <div className="mb-6">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="상세 내용을 입력해 주세요. (선택)"
                  className="w-full h-[160px] bg-white rounded-xl border border-[#f0e8df] p-4 text-[14px] text-[#2a2a2a] placeholder:text-[#b8b8b8] resize-none focus:outline-none focus:border-[#ff8b3d] transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-auto pt-4 shrink-0">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className="w-full bg-[#ff8b3d] text-white font-bold text-[16px] py-[16px] rounded-[16px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity active:scale-[0.98]"
              >
                {isSubmitting ? '처리 중...' : '신고 제출'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
