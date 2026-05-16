import type { WorryCategory } from '@midnight-radio/domain';
import { normalizeInterests } from './profileValidation';
import type { UpdateInterestsResult, UserProfileRepository } from './types';

export const INTERESTS_UPDATE_MESSAGES = {
  required: '관심 분야를 1개 이상 선택해주세요.',
} as const;

export type InterestsValidationResult =
  | { readonly valid: true; readonly interests: readonly WorryCategory[] }
  | { readonly valid: false; readonly error: keyof typeof INTERESTS_UPDATE_MESSAGES; readonly message: string };

export function validateEditableInterests(values: readonly string[]): InterestsValidationResult {
  const interests = normalizeInterests(values);
  if (interests.length === 0) {
    return {
      valid: false,
      error: 'required',
      message: INTERESTS_UPDATE_MESSAGES.required,
    };
  }
  return { valid: true, interests };
}

export async function updateMyInterests(params: {
  readonly uid: string;
  readonly interests: readonly string[];
  readonly repository: Pick<UserProfileRepository, 'updateInterests'>;
}): Promise<UpdateInterestsResult> {
  const validation = validateEditableInterests(params.interests);
  if (validation.valid === false) {
    return {
      status: 'invalid',
      code: validation.error,
      message: validation.message,
    };
  }

  return params.repository.updateInterests({
    uid: params.uid,
    interests: validation.interests,
  });
}
