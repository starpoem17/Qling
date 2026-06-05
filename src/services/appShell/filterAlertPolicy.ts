const suppressedFilterAlertFragments = [
  '채팅방을 생성하고 있습니다',
] as const;

export function shouldRenderFilterAlert(message: string | null): message is string {
  if (!message) return false;
  return !suppressedFilterAlertFragments.some(fragment => message.includes(fragment));
}
