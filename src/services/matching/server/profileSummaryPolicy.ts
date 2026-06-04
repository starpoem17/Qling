import type { ExperienceProfile } from './experienceProfile';

export type ProfileSummaryJobReason =
  | 'helped_count_delta'
  | 'top_topics_changed'
  | 'stale_7d'
  | 'moderation_event';

export function resolveProfileSummaryJobReason(params: {
  profile: ExperienceProfile;
  helpedCount: number;
  now: Date;
  moderationEvent?: boolean;
}): ProfileSummaryJobReason | null {
  if (params.moderationEvent) return 'moderation_event';

  const helpedSnapshot = params.profile.profileSummaryHelpedCountSnapshot;
  if (typeof helpedSnapshot === 'number' && params.helpedCount - helpedSnapshot >= 3) {
    return 'helped_count_delta';
  }

  const topicSnapshot = params.profile.profileSummaryTopTopicsSnapshot;
  if (topicSnapshot && !sameStringArray(topicSnapshot, params.profile.topTopics)) {
    return 'top_topics_changed';
  }

  const updatedAt = toDate(params.profile.profileSummaryUpdatedAt);
  if (!updatedAt || params.now.getTime() - updatedAt.getTime() >= 7 * 24 * 60 * 60 * 1000) {
    return 'stale_7d';
  }

  return null;
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}
