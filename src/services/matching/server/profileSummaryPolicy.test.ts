import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeExperienceProfile } from './experienceProfile';
import { resolveProfileSummaryJobReason } from './profileSummaryPolicy';

const now = new Date('2026-06-03T00:00:00.000Z');

test('profile summary policy queues for helped delta top topic changes stale summaries and moderation events', () => {
  assert.equal(resolveProfileSummaryJobReason({
    profile: normalizeExperienceProfile({ profileSummaryHelpedCountSnapshot: 1, profileSummaryUpdatedAt: now }),
    helpedCount: 4,
    now,
  }), 'helped_count_delta');

  assert.equal(resolveProfileSummaryJobReason({
    profile: normalizeExperienceProfile({
      topTopics: ['취업'],
      profileSummaryTopTopicsSnapshot: ['진로'],
      profileSummaryUpdatedAt: now,
    }),
    helpedCount: 0,
    now,
  }), 'top_topics_changed');

  assert.equal(resolveProfileSummaryJobReason({
    profile: normalizeExperienceProfile({ profileSummaryUpdatedAt: new Date('2026-05-25T00:00:00.000Z') }),
    helpedCount: 0,
    now,
  }), 'stale_7d');

  assert.equal(resolveProfileSummaryJobReason({
    profile: normalizeExperienceProfile({ profileSummaryUpdatedAt: now }),
    helpedCount: 0,
    now,
    moderationEvent: true,
  }), 'moderation_event');
});

test('profile summary policy returns null when no regeneration condition is met', () => {
  assert.equal(resolveProfileSummaryJobReason({
    profile: normalizeExperienceProfile({
      topTopics: ['취업'],
      profileSummaryTopTopicsSnapshot: ['취업'],
      profileSummaryHelpedCountSnapshot: 5,
      profileSummaryUpdatedAt: now,
    }),
    helpedCount: 6,
    now,
  }), null);
});
