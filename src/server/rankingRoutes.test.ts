import test from 'node:test';
import assert from 'node:assert/strict';
import { registerRankingRoutes } from './rankingRoutes';

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

function createDb(userData: Record<string, unknown> | undefined = {}) {
  return {
    collection: () => ({
      doc: () => ({
        get: async () => ({
          data: () => userData,
        }),
      }),
    }),
  };
}

function captureRoute(options: {
  readonly userData?: Record<string, unknown>;
  readonly verifyIdToken?: () => Promise<{ uid: string }>;
  readonly result?: unknown;
} = {}) {
  const handlers: Array<(req: unknown, res: unknown, next: () => void) => unknown> = [];
  let called = false;
  const app = {
    get(path: string, ...routeHandlers: typeof handlers) {
      assert.equal(path, '/api/rankings');
      handlers.push(...routeHandlers);
    },
  };

  registerRankingRoutes(app as never, {
    auth: {
      verifyIdToken: options.verifyIdToken ?? (async () => ({ uid: 'viewer' })),
    } as never,
    db: createDb(options.userData) as never,
    getRankings: async () => {
      called = true;
      return (options.result ?? { monthly: [], total: [] }) as never;
    },
  });

  return { handlers, called: () => called };
}

test('ranking route requires active auth before returning rankings', async () => {
  const route = captureRoute({
    result: {
      monthly: [{ rank: 1, uid: 'user-1', nickname: '닉네임', heartCount: 3 }],
      total: [],
    },
  });
  const req = { headers: { authorization: 'Bearer token' } };
  const res = createRes();

  await route.handlers[0](req, res, () => undefined);
  await route.handlers[1](req, res, () => undefined);

  assert.equal(res.statusCode, 200);
  assert.equal(route.called(), true);
  assert.deepEqual(res.body, {
    monthly: [{ rank: 1, uid: 'user-1', nickname: '닉네임', heartCount: 3 }],
    total: [],
  });
});

test('ranking route blocks missing invalid and deleted users before service call', async () => {
  const missing = captureRoute();
  const missingRes = createRes();
  await missing.handlers[0]({ headers: {} } as never, missingRes as never, () => undefined);
  assert.equal(missingRes.statusCode, 401);
  assert.equal(missing.called(), false);

  const invalid = captureRoute({ verifyIdToken: async () => { throw new Error('bad'); } });
  const invalidRes = createRes();
  await invalid.handlers[0]({ headers: { authorization: 'Bearer bad' } } as never, invalidRes as never, () => undefined);
  assert.equal(invalidRes.statusCode, 401);
  assert.equal(invalid.called(), false);

  const deleted = captureRoute({ userData: { deleted: true } });
  const deletedRes = createRes();
  await deleted.handlers[0]({ headers: { authorization: 'Bearer token' } } as never, deletedRes as never, () => undefined);
  assert.equal(deletedRes.statusCode, 403);
  assert.equal(deleted.called(), false);
});

test('ranking route returns firebase unavailable when Admin db is absent', async () => {
  const handlers: Array<(req: unknown, res: unknown) => unknown> = [];
  registerRankingRoutes({
    get(path: string, handler: (req: unknown, res: unknown) => unknown) {
      assert.equal(path, '/api/rankings');
      handlers.push(handler);
    },
  } as never, {
    auth: {} as never,
    db: null,
  });

  const res = createRes();
  await handlers[0]({}, res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    error: {
      code: 'firebase_unavailable',
      message: 'Firebase Admin is not initialized.',
    },
  });
});
