import test from 'node:test';
import assert from 'node:assert/strict';
import { getRankingsOnServer } from './server';
import { rebuildCurrentRankingSnapshot } from './snapshotJob';
import type { MaterializedRankingSnapshot } from './types';

const materializedSnapshot: MaterializedRankingSnapshot = {
  monthly: {
    allEntries: [
      entry('top', 1, 4),
      entry('viewer', 2, 1),
    ],
  },
  total: {
    allEntries: [
      entry('top', 1, 8),
      entry('viewer', 2, 2),
    ],
  },
  season: {
    monthLabel: '6월 시즌',
    daysUntilMonthEnd: 20,
  },
  activeUserCount: 2,
};

test('server rankings use current snapshot without scanning source collections', async () => {
  const readCollections: string[] = [];
  const db = {
    collection(name: string) {
      readCollections.push(name);
      assert.equal(name, 'rankingSnapshots');
      return {
        doc(id: string) {
          assert.equal(id, 'current');
          return {
            get: async () => ({
              exists: true,
              data: () => ({ snapshot: materializedSnapshot }),
            }),
          };
        },
      };
    },
  };

  const result = await getRankingsOnServer({
    db: db as never,
    viewerUid: 'viewer',
  });

  assert.deepEqual(readCollections, ['rankingSnapshots']);
  assert.equal(result.total.entries[0]?.uid, 'top');
  assert.equal(result.total.viewer?.uid, 'viewer');
  assert.equal(result.total.viewer?.percentile, 100);
});

test('server rankings fall back to full scan when snapshot is missing', async () => {
  const readCollections: string[] = [];
  const db = {
    collection(name: string) {
      readCollections.push(name);
      if (name === 'rankingSnapshots') {
        return {
          doc: () => ({
            get: async () => ({
              exists: false,
              data: () => undefined,
            }),
          }),
        };
      }
      return {
        get: async () => ({
          docs: sourceDocs[name] ?? [],
        }),
      };
    },
  };

  const result = await getRankingsOnServer({
    db: db as never,
    viewerUid: 'viewer',
    now: new Date('2026-06-07T00:00:00.000Z'),
  });

  assert.deepEqual(readCollections, ['rankingSnapshots', 'users', 'feedbacks', 'replies']);
  assert.equal(result.total.viewer?.uid, 'viewer');
});

test('ranking snapshot rebuild stores materialized full rankings', async () => {
  let written: unknown = null;
  const db = {
    collection(name: string) {
      assert.equal(name, 'rankingSnapshots');
      return {
        doc(id: string) {
          assert.equal(id, 'current');
          return {
            set: async (value: unknown) => {
              written = value;
            },
          };
        },
      };
    },
  };

  const result = await rebuildCurrentRankingSnapshot({
    db: db as never,
    now: new Date('2026-06-07T00:00:00.000Z'),
    getRankings: async () => materializedSnapshot,
  });

  assert.deepEqual(result, {
    status: 'completed',
    generatedAt: '2026-06-07T00:00:00.000Z',
    monthlyEntryCount: 2,
    totalEntryCount: 2,
  });
  assert.deepEqual(written, {
    snapshot: materializedSnapshot,
    generatedAt: new Date('2026-06-07T00:00:00.000Z'),
    source: 'manual_rebuild',
    schemaVersion: 1,
  });
});

const sourceDocs = {
  users: [
    doc('top', { nickname: '상위', helpedCount: 3 }),
    doc('viewer', { nickname: '나', helpedCount: 1 }),
  ],
  feedbacks: [],
  replies: [],
} satisfies Record<string, Array<{ id: string; data: () => Record<string, unknown> }>>;

function doc(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  };
}

function entry(uid: string, rank: number, heartCount: number) {
  return {
    rank,
    uid,
    nickname: uid,
    heartCount,
    profileColor: '#FF8B3D',
    replyCount: 0,
    adoptedCount: 0,
    rankDelta: 0,
  };
}
