export function shouldMarkRepliesForWorryRead(params: {
  readonly hasUser: boolean;
  readonly worryId: string | null;
}): boolean {
  return params.hasUser && Boolean(params.worryId);
}
