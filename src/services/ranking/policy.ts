import type {
  RankingEntry,
  RankingFeedbackDoc,
  RankingPeriod,
  RankingReplyDoc,
  RankingResponse,
  RankingUserDoc,
  ViewerRankingEntry,
} from './types';
import { normalizeProfileColor } from '../userProfile/profileValidation';

const RANKING_LIMIT = 10;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type RankableUser = RankingUserDoc & { readonly uid: string; readonly nickname: string };

type RankingMetrics = {
  readonly heartCount: number;
  readonly replyCount: number;
  readonly adoptedCount: number;
};

export function composeRankingResponse(params: {
  readonly users: readonly RankingUserDoc[];
  readonly feedbacks: readonly RankingFeedbackDoc[];
  readonly replies?: readonly RankingReplyDoc[];
  readonly viewerUid?: string;
  readonly now: Date;
}): RankingResponse {
  const activeUsers = params.users.filter(isRankableUser);
  const usersByUid = new Map(activeUsers.map(user => [user.uid, user]));
  const monthRange = kstMonthRange(params.now);
  const previousMonthRange = kstPreviousMonthRange(params.now);
  const replies = params.replies ?? [];

  const monthlyMetrics = metricsForPeriod({
    usersByUid,
    feedbacks: params.feedbacks,
    replies,
    start: monthRange.start,
    end: monthRange.end,
    heartSource: 'feedbacks',
  });
  const previousMonthlyMetrics = metricsForPeriod({
    usersByUid,
    feedbacks: params.feedbacks,
    replies,
    start: previousMonthRange.start,
    end: previousMonthRange.end,
    heartSource: 'feedbacks',
  });
  const totalMetrics = metricsForPeriod({
    usersByUid,
    feedbacks: params.feedbacks,
    replies,
    end: null,
    heartSource: 'users',
  });
  const previousTotalMetrics = metricsForPeriod({
    usersByUid,
    feedbacks: params.feedbacks,
    replies,
    end: monthRange.start,
    heartSource: 'feedbacks',
  });

  return {
    monthly: composePeriod({
      activeUsers,
      metricsByUid: monthlyMetrics,
      previousMetricsByUid: previousMonthlyMetrics,
      viewerUid: params.viewerUid,
    }),
    total: composePeriod({
      activeUsers,
      metricsByUid: totalMetrics,
      previousMetricsByUid: previousTotalMetrics,
      viewerUid: params.viewerUid,
    }),
    season: seasonFor(params.now),
  };
}

function metricsForPeriod(params: {
  readonly usersByUid: ReadonlyMap<string, RankableUser>;
  readonly feedbacks: readonly RankingFeedbackDoc[];
  readonly replies: readonly RankingReplyDoc[];
  readonly start?: Date;
  readonly end: Date | null;
  readonly heartSource: 'feedbacks' | 'users';
}): Map<string, RankingMetrics> {
  const metrics = new Map<string, { heartCount: number; replyCount: number; adoptedCount: number }>();
  for (const uid of params.usersByUid.keys()) {
    metrics.set(uid, { heartCount: 0, replyCount: 0, adoptedCount: 0 });
  }

  for (const feedback of params.feedbacks) {
    if (feedback.type !== 'like' || feedback.helpedCountApplied !== true) continue;
    if (typeof feedback.replierUid !== 'string' || !params.usersByUid.has(feedback.replierUid)) continue;
    const createdAt = toDate(feedback.createdAt);
    if (!isInRange(createdAt, params.start, params.end)) continue;
    const current = metrics.get(feedback.replierUid);
    if (!current) continue;
    current.adoptedCount += 1;
    if (params.heartSource === 'feedbacks') current.heartCount += 1;
  }

  for (const reply of params.replies) {
    if (!isActiveHumanReply(reply)) continue;
    if (typeof reply.replierUid !== 'string' || !params.usersByUid.has(reply.replierUid)) continue;
    const createdAt = toDate(reply.createdAt);
    if (!isInRange(createdAt, params.start, params.end)) continue;
    const current = metrics.get(reply.replierUid);
    if (current) current.replyCount += 1;
  }

  if (params.heartSource === 'users') {
    for (const [uid, user] of params.usersByUid) {
      const current = metrics.get(uid);
      if (current) current.heartCount = numericHeartCount(user.helpedCount);
    }
  }

  return metrics;
}

function composePeriod(params: {
  readonly activeUsers: readonly RankableUser[];
  readonly metricsByUid: ReadonlyMap<string, RankingMetrics>;
  readonly previousMetricsByUid: ReadonlyMap<string, RankingMetrics>;
  readonly viewerUid?: string;
}): RankingPeriod {
  const allEntries = rankEntries(params.activeUsers.map(user => ({
    uid: user.uid,
    nickname: displayNickname(user),
    profileColor: normalizeProfileColor(user.profileColor),
    ...(params.metricsByUid.get(user.uid) ?? emptyMetrics()),
  })), { includeZeroHeartEntries: true });

  const previousEntries = rankEntries(params.activeUsers.map(user => ({
    uid: user.uid,
    nickname: displayNickname(user),
    profileColor: normalizeProfileColor(user.profileColor),
    ...(params.previousMetricsByUid.get(user.uid) ?? emptyMetrics()),
  })), { includeZeroHeartEntries: true });
  const previousRankByUid = new Map(previousEntries.map(entry => [entry.uid, entry.rank]));
  const entriesWithDelta = allEntries.map(entry => ({
    ...entry,
    rankDelta: (previousRankByUid.get(entry.uid) ?? entry.rank) - entry.rank,
  }));
  const viewerBase = params.viewerUid
    ? entriesWithDelta.find(entry => entry.uid === params.viewerUid)
    : undefined;

  return {
    entries: entriesWithDelta.filter(entry => entry.heartCount > 0).slice(0, RANKING_LIMIT),
    viewer: viewerBase ? withPercentile(viewerBase, params.activeUsers.length) : null,
  };
}

function isRankableUser(user: RankingUserDoc): user is RankableUser {
  return typeof user.uid === 'string'
    && user.uid.trim().length > 0
    && typeof user.nickname === 'string'
    && user.nickname.trim().length > 0
    && user.deleted !== true
    && user.status !== 'deleted'
    && user.inactive !== true;
}

function displayNickname(user: RankingUserDoc | undefined): string {
  return typeof user?.nickname === 'string' ? user.nickname.trim() : '';
}

function numericHeartCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function rankEntries(
  entries: Array<Omit<RankingEntry, 'rank' | 'rankDelta'>>,
  options: { readonly includeZeroHeartEntries: boolean },
): RankingEntry[] {
  const sorted = entries
    .filter(entry => options.includeZeroHeartEntries || entry.heartCount > 0)
    .sort((a, b) => {
      const hearts = b.heartCount - a.heartCount;
      if (hearts !== 0) return hearts;
      const nickname = a.nickname.localeCompare(b.nickname, 'ko');
      if (nickname !== 0) return nickname;
      return a.uid.localeCompare(b.uid);
    });

  let previousHeartCount: number | null = null;
  let previousRank = 0;

  return sorted.map((entry, index) => {
    const rank = previousHeartCount === entry.heartCount ? previousRank : index + 1;
    previousHeartCount = entry.heartCount;
    previousRank = rank;
    return { rank, rankDelta: 0, ...entry };
  });
}

function emptyMetrics(): RankingMetrics {
  return { heartCount: 0, replyCount: 0, adoptedCount: 0 };
}

function withPercentile(entry: RankingEntry, activeUserCount: number): ViewerRankingEntry {
  return {
    ...entry,
    percentile: activeUserCount > 0 ? Math.max(1, Math.ceil((entry.rank / activeUserCount) * 100)) : 0,
  };
}

function kstMonthRange(now: Date): { start: Date; end: Date } {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1) - KST_OFFSET_MS),
    end: new Date(Date.UTC(year, month + 1, 1) - KST_OFFSET_MS),
  };
}

function kstPreviousMonthRange(now: Date): { start: Date; end: Date } {
  const current = kstMonthRange(now);
  const currentStartKst = new Date(current.start.getTime() + KST_OFFSET_MS);
  const year = currentStartKst.getUTCFullYear();
  const month = currentStartKst.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month - 1, 1) - KST_OFFSET_MS),
    end: current.start,
  };
}

function seasonFor(now: Date): RankingResponse['season'] {
  const range = kstMonthRange(now);
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  return {
    monthLabel: `${kstNow.getUTCMonth() + 1}월 시즌`,
    daysUntilMonthEnd: Math.max(0, Math.ceil((range.end.getTime() - now.getTime()) / DAY_MS)),
  };
}

function isActiveHumanReply(reply: RankingReplyDoc): boolean {
  return reply.status === 'active'
    && !reply.hiddenAt
    && reply.isAiGenerated !== true;
}

function isInRange(createdAt: Date | null, start: Date | undefined, end: Date | null): boolean {
  if (!createdAt) return false;
  if (start && createdAt < start) return false;
  if (end && createdAt >= end) return false;
  return true;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    const converted = value.toDate();
    return converted instanceof Date ? converted : null;
  }
  return null;
}
