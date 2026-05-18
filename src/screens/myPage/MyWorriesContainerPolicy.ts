import type { MyWorryListItem } from '../../services/myWorries';
import { routeToAnswerCheck, type AppRouteState } from '../../services/appShell/prdNavigationPolicy';
import type { MyWorryListItemProps } from './contract';

export function stateForMyWorries(params: {
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly itemCount: number;
}) {
  if (params.error) return { status: 'error' as const, message: params.error, canRetry: false };
  if (params.isLoading) return { status: 'loading' as const, label: '작성한 고민을 불러오고 있습니다.' };
  if (params.itemCount === 0) return { status: 'empty' as const, message: '첫 고민을 남겨보세요.' };
  return { status: 'ready' as const };
}

export function routeForMyWorryAnswerCheck(params: {
  readonly item: MyWorryListItemProps;
  readonly worries: readonly MyWorryListItem[];
}): { readonly selectedWorry: MyWorryListItem; readonly route: AppRouteState } | null {
  const selectedWorry = params.worries.find(worry => worry.id === params.item.worryId);
  if (!selectedWorry) return null;
  return {
    selectedWorry,
    route: routeToAnswerCheck({ worryId: selectedWorry.id }),
  };
}
