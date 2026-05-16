import test from 'node:test';
import assert from 'node:assert/strict';
import { AccountDeletionCleanupError, deleteMyAccount } from './deleteMyAccount';
import type { UserAccountRepository } from './types';

function createRepository(options: {
  failCleanupOnce?: boolean;
} = {}) {
  const profile: Record<string, unknown> = {
    uid: 'user-1',
    gender: 'female',
    interests: ['career'],
    helpedCount: 3,
    activeDeliveryCount: 2,
    createdAt: 'created-at',
    updatedAt: 'old-updated-at',
    lastActive: 'last-active',
    lastSeenAt: 'last-seen-at',
  };
  const tokens = new Set(['token-1', 'token-2']);
  const readStates = new Set(['delivery-1', 'reply-1']);
  const nicknameReservations = new Set(['user-1-normalized']);
  let cleanupFailuresRemaining = options.failCleanupOnce ? 1 : 0;
  const contentSentinel = {
    worries: [{ id: 'worry-1' }],
    deliveries: [{ id: 'delivery-1' }],
    replies: [{ id: 'reply-1' }],
    feedbacks: [{ id: 'feedback-1' }],
    moderationLogs: [{ id: 'moderation-1' }],
    pushLogs: [{ id: 'push-1' }],
  };
  const calls: string[] = [];

  const repository: UserAccountRepository = {
    async deleteUserAccountState(params) {
      calls.push(`deleteUserAccountState:${params.uid}`);
      if (cleanupFailuresRemaining > 0) {
        cleanupFailuresRemaining -= 1;
        return {
          status: 'failed',
          phase: 'delete_user_document',
          firebaseCode: 'permission-denied',
        };
      }
      const deletedTokenCount = tokens.size;
      const deletedReadStateCount = readStates.size;
      const deletedNicknameReservation = nicknameReservations.delete('user-1-normalized');
      tokens.clear();
      readStates.clear();
      delete profile.uid;
      return {
        status: 'success',
        deletedTokenCount,
        deletedReadStateCount,
        deletedNicknameReservation,
        completedPhases: ['load_user_profile', 'delete_user_document'],
      };
    },
  };

  return { repository, profile, tokens, readStates, nicknameReservations, contentSentinel, calls };
}

test('deleteMyAccount deletes profile/session state and removes tokens and nickname reservation', async () => {
  const harness = createRepository();
  const beforeContent = structuredClone(harness.contentSentinel);

  const result = await deleteMyAccount({
    uid: 'user-1',
    repository: harness.repository,
    clock: { now: () => 'deleted-at' },
  });

  assert.deepEqual(result, {
    status: 'deleted',
    deletedTokenCount: 2,
    deletedReadStateCount: 2,
    deletedNicknameReservation: true,
    completedPhases: ['load_user_profile', 'delete_user_document'],
  });
  assert.equal(harness.profile.uid, undefined);
  assert.equal(harness.tokens.size, 0);
  assert.equal(harness.readStates.size, 0);
  assert.equal(harness.nicknameReservations.size, 0);
  assert.deepEqual(harness.contentSentinel, beforeContent);
});

test('deleteMyAccount is idempotent for already deleted users and empty token collections', async () => {
  const harness = createRepository();

  await deleteMyAccount({
    uid: 'user-1',
    repository: harness.repository,
    clock: { now: () => 'first-delete' },
  });
  const result = await deleteMyAccount({
    uid: 'user-1',
    repository: harness.repository,
    clock: { now: () => 'second-delete' },
  });

  assert.deepEqual(result, {
    status: 'deleted',
    deletedTokenCount: 0,
    deletedReadStateCount: 0,
    deletedNicknameReservation: false,
    completedPhases: ['load_user_profile', 'delete_user_document'],
  });
  assert.equal(harness.tokens.size, 0);
});

test('deleteMyAccount reports account cleanup failure and retry removes remaining state', async () => {
  const harness = createRepository({ failCleanupOnce: true });

  await assert.rejects(
    deleteMyAccount({
      uid: 'user-1',
      repository: harness.repository,
      clock: { now: () => 'failed-delete' },
    }),
    (error) => error instanceof AccountDeletionCleanupError
      && error.phase === 'delete_user_document'
      && error.firebaseCode === 'permission-denied'
  );
  assert.equal(harness.tokens.size, 2);

  const result = await deleteMyAccount({
    uid: 'user-1',
    repository: harness.repository,
    clock: { now: () => 'retry-delete' },
  });

  assert.deepEqual(result, {
    status: 'deleted',
    deletedTokenCount: 2,
    deletedReadStateCount: 2,
    deletedNicknameReservation: true,
    completedPhases: ['load_user_profile', 'delete_user_document'],
  });
  assert.equal(harness.tokens.size, 0);
});

test('deleteMyAccount accepts only the verified uid parameter and repository exposes no content methods', async () => {
  const harness = createRepository();

  await deleteMyAccount({
    uid: 'verified-user',
    repository: harness.repository,
    clock: { now: () => 'deleted-at' },
  });

  assert.deepEqual(harness.calls, ['deleteUserAccountState:verified-user']);
  assert.deepEqual(Object.keys(harness.repository).sort(), ['deleteUserAccountState']);
});
