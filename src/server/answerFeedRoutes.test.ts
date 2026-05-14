import test from 'node:test';
import assert from 'node:assert/strict';
import { registerAnswerFeedRoutes } from './answerFeedRoutes';

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

function createDb(data: Record<string, unknown> | undefined = {}) {
  return {
    collection: () => ({
      doc: () => ({
        get: async () => ({
          data: () => data,
        }),
      }),
    }),
  };
}

test('answer feed route requires Firebase auth and uses verified uid', async () => {
  const handlers: Array<(req: unknown, res: unknown, next: () => void) => unknown> = [];
  let capturedParams: unknown = null;
  registerAnswerFeedRoutes({
    get(path: string, ...routeHandlers: typeof handlers) {
      assert.equal(path, '/api/me/answer-feed');
      handlers.push(...routeHandlers);
    },
  } as never, {
    auth: { verifyIdToken: async () => ({ uid: 'recipient' }) } as never,
    db: createDb({}) as never,
    service: {
      getAnswerFeed: async params => {
        capturedParams = params;
        return [{
          id: 'delivery1',
          deliveryId: 'delivery1',
          worryId: 'worry1',
          authorUid: 'author',
          recipientUid: 'recipient',
          originalContent: 'content',
          refinedContent: 'content',
          categories: [],
          createdAt: null,
          status: 'active',
          source: 'prd_delivery',
          hasUnread: true,
        }];
      },
    },
  });

  const req = {
    headers: { authorization: 'Bearer token' },
    body: { uid: 'body-user' },
  };
  const res = createRes();
  await handlers[0](req, res, () => undefined);
  await handlers[1](req, res, () => undefined);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(capturedParams, { uid: 'recipient' });
  assert.deepEqual(res.body, {
    items: [{
      id: 'delivery1',
      deliveryId: 'delivery1',
      worryId: 'worry1',
      authorUid: 'author',
      recipientUid: 'recipient',
      originalContent: 'content',
      refinedContent: 'content',
      categories: [],
      createdAt: null,
      status: 'active',
      source: 'prd_delivery',
      hasUnread: true,
    }],
  });
});

test('answer feed route maps auth and service errors', async () => {
  const missingHandlers: Array<(req: unknown, res: unknown, next: () => void) => unknown> = [];
  registerAnswerFeedRoutes({
    get(_path: string, ...routeHandlers: typeof missingHandlers) {
      missingHandlers.push(...routeHandlers);
    },
  } as never, {
    auth: { verifyIdToken: async () => ({ uid: 'recipient' }) } as never,
    db: createDb({}) as never,
    service: { getAnswerFeed: async () => [] },
  });
  const missingRes = createRes();
  await missingHandlers[0]({ headers: {} } as never, missingRes as never, () => undefined);
  assert.equal(missingRes.statusCode, 401);

  const failingHandlers: Array<(req: unknown, res: unknown, next: () => void) => unknown> = [];
  registerAnswerFeedRoutes({
    get(_path: string, ...routeHandlers: typeof failingHandlers) {
      failingHandlers.push(...routeHandlers);
    },
  } as never, {
    auth: { verifyIdToken: async () => ({ uid: 'recipient' }) } as never,
    db: createDb({}) as never,
    service: {
      getAnswerFeed: async () => {
        throw new Error('failed');
      },
    },
  });
  const failingRes = createRes();
  const failingReq = { headers: { authorization: 'Bearer token' } };
  await failingHandlers[0](failingReq as never, failingRes as never, () => undefined);
  await failingHandlers[1](failingReq as never, failingRes as never, () => undefined);
  assert.equal(failingRes.statusCode, 500);
  assert.deepEqual(failingRes.body, {
    error: {
      code: 'answer_feed_failed',
      message: '답변 피드를 불러오지 못했습니다.',
    },
  });
});

test('answer feed route returns firebase unavailable when Admin db is absent', async () => {
  const handlers: Array<(req: unknown, res: unknown) => unknown> = [];
  registerAnswerFeedRoutes({
    get(path: string, handler: (req: unknown, res: unknown) => unknown) {
      assert.equal(path, '/api/me/answer-feed');
      handlers.push(handler);
    },
  } as never, {
    auth: {} as never,
    db: null,
  });

  const res = createRes();
  await handlers[0]({}, res);
  assert.equal(res.statusCode, 500);
});
