import { CircleUserRound } from 'lucide-react';

type QlingPeekHeaderProps = {
  isCollapsed: boolean;
  maskIdPrefix: string;
  onOpenMyPage: () => void;
  eyeTestId?: string;
};

export function QlingPeekHeader(props: QlingPeekHeaderProps) {
  return (
    <header
      className={`${props.isCollapsed ? 'h-[16px]' : 'h-[100px]'} overflow-hidden bg-[#ff8b3d] transition-[height] duration-[320ms] ease-in-out motion-reduce:transition-none`}
      data-header-state={props.isCollapsed ? 'collapsed' : 'expanded'}
    >
      <div className="relative mx-auto h-[100px] w-full max-w-[393px]">
        <div
          role="presentation"
          aria-hidden="true"
          data-testid={props.eyeTestId}
          className="absolute left-8 top-[46px] h-[39px] w-12"
        >
          <svg width="48" height="39" viewBox="0 0 48 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.7228 19.3387C21.8778 35.5589 16.8647 38.1786 10.8719 38.1786C4.87903 38.1786 -0.373688 34.667 0.0208912 19.3387C0.415471 4.01042 4.87903 0.49884 10.8719 0.49884C16.8647 0.49884 21.5678 3.11859 21.7228 19.3387Z" fill="#FFF5EB" />
            <mask id={`${props.maskIdPrefix}-left-eye-mask`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="23" height="39">
              <path d="M22.2634 19.0893C22.4222 35.5242 17.2843 38.1786 11.1424 38.1786C5.00044 38.1786 -0.382987 34.6205 0.0214111 19.0893C0.425809 3.55806 5.00044 0 11.1424 0C17.2843 0 22.1045 2.65443 22.2634 19.0893Z" fill="#FFF5EB" />
            </mask>
            <g mask={`url(#${props.maskIdPrefix}-left-eye-mask)`}>
              <path d="M25.8168 19.8501C25.8168 27.528 22.0964 33.7521 17.507 33.7521C12.9177 33.7521 9.19727 30.2247 9.19727 19.8501C9.19727 12.1723 12.9177 5.94812 17.507 5.94812C22.0964 5.94812 25.8168 12.1723 25.8168 19.8501Z" fill="#1A1A1A" />
            </g>
            <path d="M47.9969 19.3387C48.1591 35.5589 42.9128 38.1786 36.6412 38.1786C30.3696 38.1786 24.8726 34.667 25.2855 19.3387C25.6985 4.01042 30.3696 0.49884 36.6412 0.49884C42.9128 0.49884 47.8346 3.11859 47.9969 19.3387Z" fill="#FFF5EB" />
            <mask id={`${props.maskIdPrefix}-right-eye-mask`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="25" y="0" width="23" height="39">
              <path d="M47.9958 19.0893C48.1546 35.5242 43.0168 38.1786 36.8748 38.1786C30.7329 38.1786 25.3494 34.6205 25.7538 19.0893C26.1582 3.55806 30.7329 0 36.8748 0C43.0168 0 47.8369 2.65443 47.9958 19.0893Z" fill="#FFF5EB" />
            </mask>
            <g mask={`url(#${props.maskIdPrefix}-right-eye-mask)`}>
              <path d="M51.5492 19.8501C51.5492 27.528 47.8288 33.7521 43.2395 33.7521C38.6501 33.7521 34.9297 30.2247 34.9297 19.8501C34.9297 12.1723 38.6501 5.94812 43.2395 5.94812C47.8288 5.94812 51.5492 12.1723 51.5492 19.8501Z" fill="#1A1A1A" />
            </g>
          </svg>
        </div>
        <button
          type="button"
          aria-label="마이페이지 열기"
          onClick={props.onOpenMyPage}
          className="absolute left-[333.5px] top-[53.5px] flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <CircleUserRound className="h-[25px] w-[25px]" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
