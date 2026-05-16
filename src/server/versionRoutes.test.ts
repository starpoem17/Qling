import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyQlingReleaseHeaders,
  getQlingReleaseInfo,
  registerVersionRoutes,
} from './versionRoutes';

function createRes() {
  return {
    headers: new Map<string, string>(),
    statusCode: 200,
    body: null as unknown,
    setHeader(name: string, value: string) {
      this.headers.set(name, value);
    },
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

test('release info uses safe env values with stable unknown fallback', () => {
  assert.deepEqual(getQlingReleaseInfo({
    QLING_RELEASE_SHA: ' abc123 ',
    QLING_BUILD_TIME: ' 2026-05-17T00:00:00.000Z ',
    NODE_ENV: 'production',
  } as NodeJS.ProcessEnv), {
    service: 'Qling',
    gitSha: 'abc123',
    buildTime: '2026-05-17T00:00:00.000Z',
    nodeEnv: 'production',
  });

  assert.deepEqual(getQlingReleaseInfo({} as NodeJS.ProcessEnv), {
    service: 'Qling',
    gitSha: 'unknown',
    buildTime: 'unknown',
    nodeEnv: 'development',
  });
});

test('release headers expose stable non-secret fields', () => {
  const res = createRes();

  applyQlingReleaseHeaders(res as never, {
    service: 'Qling',
    gitSha: 'sha-1',
    buildTime: 'time-1',
    nodeEnv: 'production',
  });

  assert.equal(res.headers.get('X-Qling-Release-Sha'), 'sha-1');
  assert.equal(res.headers.get('X-Qling-Build-Time'), 'time-1');
});

test('version route registers API release headers and stable version payload', async () => {
  const handlers: Array<{
    method: 'use' | 'get';
    path: string;
    handler: (...args: never[]) => unknown;
  }> = [];
  const app = {
    use(path: string, handler: (...args: never[]) => unknown) {
      handlers.push({ method: 'use', path, handler });
    },
    get(path: string, handler: (...args: never[]) => unknown) {
      handlers.push({ method: 'get', path, handler });
    },
  };
  const releaseInfo = {
    service: 'Qling' as const,
    gitSha: 'sha-2',
    buildTime: 'time-2',
    nodeEnv: 'production',
  };

  registerVersionRoutes(app as never, releaseInfo);

  const middleware = handlers.find(handler => handler.method === 'use');
  assert.equal(middleware?.path, '/api');
  const resWithHeaders = createRes();
  let nextCalled = false;
  await middleware?.handler({} as never, resWithHeaders as never, (() => { nextCalled = true; }) as never);
  assert.equal(nextCalled, true);
  assert.equal(resWithHeaders.headers.get('X-Qling-Release-Sha'), 'sha-2');
  assert.equal(resWithHeaders.headers.get('X-Qling-Build-Time'), 'time-2');

  const route = handlers.find(handler => handler.method === 'get');
  assert.equal(route?.path, '/api/version');
  const versionRes = createRes();
  await route?.handler({} as never, versionRes as never);
  assert.equal(versionRes.statusCode, 200);
  assert.deepEqual(versionRes.body, releaseInfo);
});
