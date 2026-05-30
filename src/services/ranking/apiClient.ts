import type { RankingResponse } from './types';

export async function fetchRankings(params: {
  readonly getIdToken: () => Promise<string>;
  readonly fetchImpl?: typeof fetch;
}): Promise<RankingResponse> {
  const token = await params.getIdToken();
  const response = await (params.fetchImpl ?? fetch)('/api/rankings', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message ?? '순위를 불러오지 못했습니다.');
  }

  return body as RankingResponse;
}
