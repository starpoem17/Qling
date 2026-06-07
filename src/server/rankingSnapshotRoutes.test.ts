import test from 'node:test';
import assert from 'node:assert/strict';
import { registerRankingSnapshotRoutes } from './rankingSnapshotRoutes';

function createRes() {
  return {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

function captureRoute(options: {
  readonly db?: unknown;
  readonly rebuildSnapshot?: (params: unknown) => Promise<unknown>;
} = {}) {
  const handlers: Array<(req: unknown, res: unknown, next?: () => void) => unknown> = [];
  registerRankingSnapshotRoutes({
    post(path: string, ...routeHandlers: typeof handlers) {
      assert.equal(path, '/api/internal/ranking-snapshots/rebuild');
      handlers.push(...routeHandlers);
    },
  } as never, {
    db: (options.db ?? {}) as never,
    rebuildSnapshot: options.rebuildSnapshot as never,
  });
  return handlers;
}

test('ranking snapshot route requires internal secret before rebuild', async () => {
  const oldSecret = process.env.INTERNAL_JOB_SECRET;
  delete process.env.INTERNAL_JOB_SECRET;
  const handlers = captureRoute();
  const res = createRes();

  await handlers[0]({ headers: {} } as never, res as never, () => undefined);

  assert.equal(res.statusCode, 503);
  if (oldSecret === undefined) {
    delete process.env.INTERNAL_JOB_SECRET;
  } else {
    process.env.INTERNAL_JOB_SECRET = oldSecret;
  }
});

test('ranking snapshot route delegates rebuild after internal auth', async () => {
  const oldSecret = process.env.INTERNAL_JOB_SECRET;
  process.env.INTERNAL_JOB_SECRET = 'secret';
  let delegated = false;
  const handlers = captureRoute({
    rebuildSnapshot: async () => {
      delegated = true;
      return {
        status: 'completed',
        generatedAt: '2026-06-07T00:00:00.000Z',
        monthlyEntryCount: 1,
        totalEntryCount: 1,
      };
    },
  });
  const res = createRes();

  await handlers[0]({ headers: { authorization: 'Bearer secret' } } as never, res as never, () => undefined);
  await handlers[1]({ headers: { authorization: 'Bearer secret' } } as never, res as never);

  assert.equal(delegated, true);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    status: 'completed',
    generatedAt: '2026-06-07T00:00:00.000Z',
    monthlyEntryCount: 1,
    totalEntryCount: 1,
  });

  if (oldSecret === undefined) {
    delete process.env.INTERNAL_JOB_SECRET;
  } else {
    process.env.INTERNAL_JOB_SECRET = oldSecret;
  }
});
