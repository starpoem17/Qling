import type { ExperienceProfile, ExperienceProfileStatus } from './experienceProfile';

export type ExperienceProfileSummaryProvider = (input: {
  uid: string;
  profile: ExperienceProfile;
  helpedCount: number;
  profileStatus: ExperienceProfileStatus;
}) => Promise<unknown>;

export function normalizeProfileSummaryProviderOutput(value: unknown): { status: 'valid'; summary: string } | { status: 'invalid' } {
  const raw = typeof value === 'string'
    ? value
    : value && typeof value === 'object' && typeof (value as { profileSummary?: unknown }).profileSummary === 'string'
      ? (value as { profileSummary: string }).profileSummary
      : '';
  if (/[\n\r]/.test(raw)) return { status: 'invalid' };
  const summary = raw.trim().replace(/\s+/g, ' ');
  const length = Array.from(summary).length;
  if (length < 10 || length > 80) {
    return { status: 'invalid' };
  }
  return { status: 'valid', summary };
}
