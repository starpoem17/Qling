import test from 'node:test';
import assert from 'node:assert/strict';
import { createExamplesForUser } from './createExamplesForUser';
import type { ExampleWorriesRepository, SelectedExampleSeed } from './types';

function seed(id: string, content: string, categories: string[]) {
  return {
    id,
    content,
    summaryText: content,
    summaryStatus: 'original' as const,
    summaryGeneratedBy: 'none' as const,
    categories,
    status: 'active' as const,
  };
}

function createRepo(options: {
  stateExists?: boolean;
  interests?: string[];
  activeDeliveryCount?: number;
  throwOnCommit?: boolean;
} = {}) {
  const commits: Array<{ uid: string; seeds: SelectedExampleSeed[] }> = [];
  const repo: ExampleWorriesRepository = {
    readUserProfile: async uid => ({
      uid,
      interests: options.interests ?? ['career'],
      activeDeliveryCount: options.activeDeliveryCount,
      exampleWorriesCreatedAt: options.stateExists ? new Date() : undefined,
      exampleWorrySeedIds: options.stateExists ? ['seed1'] : undefined,
      exampleDeliveryIds: options.stateExists ? ['delivery1'] : undefined,
    }),
    listSelectableSeeds: async () => [
      seed('seed1', 'one', ['career']),
      seed('seed2', 'two', ['career']),
      seed('seed3', 'three', ['career']),
      seed('seed4', 'four', ['career']),
      seed('seed5', 'five', ['career']),
      seed('seed6', 'six', ['career']),
      { ...seed('inactive', 'off', ['career']), status: 'inactive' },
    ],
    createExamplesOnce: async params => {
      commits.push({ uid: params.uid, seeds: params.seeds });
      if (options.throwOnCommit) throw new Error('boom');
      return {
        status: 'created',
        uid: params.uid,
        worryIds: params.seeds.map(seed => `example_${params.uid}_${seed.id}`),
        deliveryIds: params.seeds.map(seed => `example_${params.uid}_${seed.id}_${params.uid}`),
        seedIds: params.seeds.map(seed => seed.id),
      };
    },
    listDueFeedbackJobs: async () => [],
    listScheduledFeedbackJobs: async () => [],
    processFeedbackJob: async () => ({ jobId: 'job', replyId: 'reply', status: 'skipped' }),
    listAnsweredExampleRepliesWithoutFeedback: async () => [],
    scheduleImmediateFeedbackJobForReply: async () => ({ jobId: 'job', replyId: 'reply', status: 'skipped' }),
  };
  return { repo, commits };
}

test('creates examples once with max five matching active seeds', async () => {
  const { repo, commits } = createRepo();
  const result = await createExamplesForUser({ uid: 'user1', repository: repo });

  assert.equal(result.status, 'created');
  assert.deepEqual(result.status === 'created' ? result.seedIds : [], ['seed1', 'seed2', 'seed3', 'seed4', 'seed5']);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].seeds.length, 5);
});

test('repeated call and interest edits after creation are idempotent', async () => {
  const { repo, commits } = createRepo({ stateExists: true, interests: ['career', 'health'] });
  const result = await createExamplesForUser({ uid: 'user1', repository: repo });

  assert.equal(result.status, 'idempotent');
  assert.deepEqual(result.status === 'idempotent' ? result.seedIds : [], ['seed1']);
  assert.equal(commits.length, 0);
});

test('real active deliveries suppress example creation and mark examples completed empty', async () => {
  const { repo, commits } = createRepo({ activeDeliveryCount: 2 });
  const result = await createExamplesForUser({ uid: 'user1', repository: repo });

  assert.equal(result.status, 'created');
  assert.deepEqual(result.status === 'created' ? result.seedIds : ['not-created'], []);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].seeds.length, 0);
});

test('empty matching seeds fall back to active examples through repository', async () => {
  const { repo, commits } = createRepo({ interests: ['health'] });
  const result = await createExamplesForUser({ uid: 'user1', repository: repo });

  assert.equal(result.status, 'created');
  assert.deepEqual(result.status === 'created' ? result.seedIds : [], ['seed1', 'seed2', 'seed3', 'seed4', 'seed5']);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].seeds.length, 5);
});

test('commit failure returns error without pretending partial creation succeeded', async () => {
  const { repo } = createRepo({ throwOnCommit: true });
  const result = await createExamplesForUser({ uid: 'user1', repository: repo });

  assert.equal(result.status, 'server_error');
  assert.equal(result.status === 'server_error' ? result.code : '', 'transaction_aborted');
});
