const activeIndicatorUrl = new URL('../../../assets/loading/figma-progress-active.svg', import.meta.url).href;
const trackUrl = new URL('../../../assets/loading/figma-progress-track.svg', import.meta.url).href;

export function FigmaTabLoading({ label }: { readonly label: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className="absolute left-1/2 top-[306px] h-10 w-10 -translate-x-1/2"
      data-testid="figma-tab-loading-indicator"
    >
      <span className="block h-full w-full animate-spin" aria-hidden="true">
        <span className="absolute flex inset-[52.65%_0.66%_0.02%_63.31%] items-center justify-center">
          <span className="block h-[11.6075px] w-[17.1763px] rotate-[100deg]">
            <img alt="" className="block h-full w-full" src={activeIndicatorUrl} draggable={false} />
          </span>
        </span>
        <span className="absolute flex inset-[-7.83%_-5.34%_-7.56%_-7.84%] items-center justify-center">
          <span className="block h-[38.9169px] w-[40.0038px] rotate-[100deg]">
            <img alt="" className="block h-full w-full" src={trackUrl} draggable={false} />
          </span>
        </span>
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
