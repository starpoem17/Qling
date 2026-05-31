export const PROFILE_COLOR_OPTIONS = [
  '#FF8B3D',
  '#FFB36B',
  '#FFD24A',
  '#B8D968',
  '#7FD6A8',
  '#6FA8F0',
  '#B49BE8',
  '#F2A6C2',
  '#FF8585',
  '#4FB8C9',
] as const;

export type ProfileColor = (typeof PROFILE_COLOR_OPTIONS)[number];

export const DEFAULT_PROFILE_COLOR: ProfileColor = '#FF8B3D';

const PROFILE_COLOR_SET = new Set<string>(PROFILE_COLOR_OPTIONS);

export function isValidProfileColor(value: unknown): value is ProfileColor {
  return typeof value === 'string' && PROFILE_COLOR_SET.has(value);
}

export function normalizeProfileColor(value: unknown): ProfileColor {
  return isValidProfileColor(value) ? value : DEFAULT_PROFILE_COLOR;
}
