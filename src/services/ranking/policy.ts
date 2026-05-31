import type { RankingEntry, RankingFeedbackDoc, RankingResponse, RankingUserDoc } from './types';
import { normalizeProfileColor } from '../userProfile/profileValidation';

const RANKING_LIMIT = 15;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function composeRankingResponse(params: {
  readonly users: readonly RankingUserDoc[];
  readonly feedbacks: readonly RankingFeedbackDoc[];
  readonly now: Date;
}): RankingResponse {
  const activeUsers = params.users.filter(isRankableUser);
  const usersByUid = new Map(activeUsers.map(user => [user.uid, user]));

  const monthlyCounts = new Map<string, number>();
  const monthRange = kstMonthRange(params.now);
  for (const feedback of params.feedbacks) {
    if (feedback.type !== 'like' || feedback.helpedCountApplied !== true) continue;
    if (typeof feedback.replierUid !== 'string' || !usersByUid.has(feedback.replierUid)) continue;
    const createdAt = toDate(feedback.createdAt);
    if (!createdAt || createdAt < monthRange.start || createdAt >= monthRange.end) continue;
    monthlyCounts.set(feedback.replierUid, (monthlyCounts.get(feedback.replierUid) ?? 0) + 1);
  }

  return {
    monthly: rankEntries([...monthlyCounts].map(([uid, heartCount]) => ({
      uid,
      nickname: displayNickname(usersByUid.get(uid)),
      profileColor: normalizeProfileColor(usersByUid.get(uid)?.profileColor),
      heartCount,
    }))),
    total: rankEntries(activeUsers.map(user => ({
      uid: user.uid,
      nickname: displayNickname(user),
      profileColor: normalizeProfileColor(user.profileColor),
      heartCount: numericHeartCount(user.helpedCount),
    })).filter(entry => entry.heartCount > 0)),
  };
}

function isRankableUser(user: RankingUserDoc) {
  return typeof user.uid === 'string'
    && user.uid.trim().length > 0
    && typeof user.nickname === 'string'
    && user.nickname.trim().length > 0
    && user.deleted !== true
    && user.status !== 'deleted'
    && user.inactive !== true;
}

function displayNickname(user: RankingUserDoc | undefined) {
  return typeof user?.nickname === 'string' ? user.nickname.trim() : '';
}

function numericHeartCount(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function rankEntries(entries: Array<Omit<RankingEntry, 'rank'>>) {
  const sorted = entries
    .filter(entry => entry.heartCount > 0)
    .sort((a, b) => {
      const hearts = b.heartCount - a.heartCount;
      if (hearts !== 0) return hearts;
      const nickname = a.nickname.localeCompare(b.nickname, 'ko');
      if (nickname !== 0) return nickname;
      return a.uid.localeCompare(b.uid);
    });

  let previousHeartCount: number | null = null;
  let previousRank = 0;

  return sorted.slice(0, RANKING_LIMIT).map((entry, index) => {
    const rank = previousHeartCount === entry.heartCount ? previousRank : index + 1;
    previousHeartCount = entry.heartCount;
    previousRank = rank;
    return { rank, ...entry };
  });
}

function kstMonthRange(now: Date) {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1) - KST_OFFSET_MS),
    end: new Date(Date.UTC(year, month + 1, 1) - KST_OFFSET_MS),
  };
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    const converted = value.toDate();
    return converted instanceof Date ? converted : null;
  }
  return null;
}
