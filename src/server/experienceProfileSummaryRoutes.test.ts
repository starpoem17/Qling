import test from 'node:test';
import assert from 'node:assert/strict';
import { registerExperienceProfileSummaryRoutes } from './experienceProfileSummaryRoutes';

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
  db?: unknown;
  runJobs?: (params: unknown) => Promise<unknown>;
} = {}) {
  const routes = new Map<string, Array<(req: unknown, res: unknown, next?: () => void) => unknown>>();
  registerExperienceProfileSummaryRoutes({
    post(path: string, ...handlers: Array<(req: unknown, res: unknown, next?: () => void) => unknown>) {
      routes.set(path, handlers);
    },
  } as never, {
    db: (options.db ?? {}) as never,
    provider: async () => ({ profileSummary: '취업 고민에 경험을 나눌 수 있어요.' }),
    runJobs: (options.runJobs ?? (async () => ({
      status: 'completed',
      checkedCount: 0,
      completedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      results: [],
    }))) as never,
  });
  return routes.get('/api/internal/experience-profile-summaries/run')!;
}

test('experience profile summary route requires internal secret', async () => {
  const oldSecret = process.env.INTERNAL_JOB_SECRET;
  delete process.env.INTERNAL_JOB_SECRET;
  const handlers = captureRoute();
  const res = createRes();

  await handlers[0]({ headers: {}, body: {} } as never, res as never, () => undefined);

  assert.equal(res.statusCode, 503);
  process.env.INTERNAL_JOB_SECRET = oldSecret;
});

test('experience profile summary route validates body and delegates limit', async () => {
  process.env.INTERNAL_JOB_SECRET = 'secret';
  let capturedLimit: number | undefined;
  const handlers = captureRoute({
    runJobs: async params => {
      capturedLimit = (params as { limit?: number }).limit;
      return {
        status: 'completed',
        checkedCount: 1,
        completedCount: 1,
        failedCount: 0,
        skippedCount: 0,
        results: [],
      };
    },
  });

  const invalidRes = createRes();
  await handlers[0]({ headers: { authorization: 'Bearer secret' }, body: { limit: 999 } } as never, invalidRes as never, () => undefined);
  await handlers[1]({ headers: { authorization: 'Bearer secret' }, body: { limit: 999 } } as never, invalidRes as never);
  assert.equal(invalidRes.statusCode, 400);

  const res = createRes();
  await handlers[0]({ headers: { authorization: 'Bearer secret' }, body: { limit: 3 } } as never, res as never, () => undefined);
  await handlers[1]({ headers: { authorization: 'Bearer secret' }, body: { limit: 3 } } as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.equal(capturedLimit, 3);
});

test('experience profile summary route returns firebase unavailable without db', async () => {
  process.env.INTERNAL_JOB_SECRET = 'secret';
  const routes = new Map<string, Array<(req: unknown, res: unknown, next?: () => void) => unknown>>();
  registerExperienceProfileSummaryRoutes({
    post(path: string, ...handlers: Array<(req: unknown, res: unknown, next?: () => void) => unknown>) {
      routes.set(path, handlers);
    },
  } as never, { db: null });

  const handlers = routes.get('/api/internal/experience-profile-summaries/run')!;
  const res = createRes();
  await handlers[0]({ headers: { authorization: 'Bearer secret' }, body: {} } as never, res as never, () => undefined);
  await handlers[1]({ headers: { authorization: 'Bearer secret' }, body: {} } as never, res as never);

  assert.equal(res.statusCode, 503);
});
