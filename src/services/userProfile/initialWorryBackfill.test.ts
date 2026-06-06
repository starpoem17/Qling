import test from 'node:test';
import assert from 'node:assert/strict';
import {
  backfillInitialWorriesForNewUser,
  refillWorryInboxForUser,
} from './initialWorryBackfill';
import type {
  InitialWorryBackfillCandidate,
  InitialWorryBackfillRepository,
} from './initialWorryBackfill';

test('initial worry backfill ranks existing worries by interest overlap and recency', async () => {
  const committed: InitialWorryBackfillCandidate[][] = [];
  const repository: InitialWorryBackfillRepository = {
    async fetchCandidateWorries() {
      return [
        { id: 'old-one-overlap', authorUid: 'author1', matchingCategories: ['직장'], createdAt: { seconds: 1 } },
        { id: 'new-two-overlap', authorUid: 'author2', matchingCategories: ['직장', '취업'], createdAt: { seconds: 2 } },
        { id: 'own-worry', authorUid: 'new-user', matchingCategories: ['직장', '취업'], createdAt: { seconds: 10 } },
        { id: 'no-overlap', authorUid: 'author3', matchingCategories: ['가족'], createdAt: { seconds: 20 } },
        { id: 'new-one-overlap', authorUid: 'author4', matchingCategories: ['직장'], createdAt: { seconds: 3 } },
      ];
    },
    async commitInitialDeliveriesForNewUser(params) {
      committed.push([...params.candidates]);
      const selected = params.candidates.slice(0, params.targetCount);
      return {
        status: 'completed',
        createdCount: selected.length,
        deliveryIds: selected.map(candidate => `${candidate.id}_new-user`),
        worryIds: selected.map(candidate => candidate.id),
      };
    },
  };

  const result = await backfillInitialWorriesForNewUser({
    uid: 'new-user',
    gender: 'female',
    interests: ['직장', '취업'],
    repository,
    targetCount: 2,
  });

  assert.deepEqual(committed[0].slice(0, 2).map(candidate => candidate.id), ['new-two-overlap', 'new-one-overlap']);
  assert.deepEqual(result.worryIds, ['new-two-overlap', 'new-one-overlap']);
});

test('initial worry backfill completes without commit when no existing worry matches interests', async () => {
  let committed = false;
  const repository: InitialWorryBackfillRepository = {
    async fetchCandidateWorries() {
      return [
        { id: 'family', authorUid: 'author', matchingCategories: ['가족'], createdAt: { seconds: 1 } },
      ];
    },
    async commitInitialDeliveriesForNewUser() {
      committed = true;
      throw new Error('unused');
    },
  };

  const result = await backfillInitialWorriesForNewUser({
    uid: 'new-user',
    gender: 'female',
    interests: ['직장'],
    repository,
  });

  assert.equal(committed, false);
  assert.deepEqual(result, {
    status: 'completed',
    createdCount: 0,
    deliveryIds: [],
    worryIds: [],
  });
});

test('worry inbox refill asks repository to fill only below target active count', async () => {
  let receivedTargetActiveDeliveryCount = 0;
  let receivedReason = '';
  const repository: InitialWorryBackfillRepository = {
    async fetchCandidateWorries() {
      return [
        { id: 'worry1', authorUid: 'author1', matchingCategories: ['직장'], createdAt: { seconds: 3 } },
        { id: 'worry2', authorUid: 'author2', matchingCategories: ['직장'], createdAt: { seconds: 2 } },
        { id: 'worry3', authorUid: 'author3', matchingCategories: ['직장'], createdAt: { seconds: 1 } },
      ];
    },
    async commitInitialDeliveriesForNewUser(params) {
      receivedTargetActiveDeliveryCount = params.targetActiveDeliveryCount ?? 0;
      receivedReason = params.reason;
      const currentActiveDeliveryCount = 4;
      const selected = params.candidates.slice(0, Math.max(0, receivedTargetActiveDeliveryCount - currentActiveDeliveryCount));
      return {
        status: 'completed',
        createdCount: selected.length,
        deliveryIds: selected.map(candidate => `${candidate.id}_user`),
        worryIds: selected.map(candidate => candidate.id),
      };
    },
  };

  const result = await refillWorryInboxForUser({
    uid: 'user',
    gender: 'female',
    interests: ['직장'],
    repository,
    targetActiveDeliveryCount: 5,
  });

  assert.equal(receivedTargetActiveDeliveryCount, 5);
  assert.equal(receivedReason, 'inbox_refill');
  assert.deepEqual(result.worryIds, ['worry1']);
});
