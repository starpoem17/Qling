import test from 'node:test';
import assert from 'node:assert/strict';
import { runInternalJob, type InternalJobFetch } from './internalJobRunner';

function createFetch(response: { ok: boolean; status: number; text: string }) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fetchImpl: InternalJobFetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return {
      ok: response.ok,
      status: response.status,
      text: async () => response.text,
    } as Response;
  };
  return { calls, fetchImpl };
}

test('runInternalJob posts internal route with bearer secret and JSON body', async () => {
  const { calls, fetchImpl } = createFetch({
    ok: true,
    status: 200,
    text: '{"status":"completed"}',
  });
  const logs: string[] = [];

  const result = await runInternalJob({
    endpoint: '/api/internal/recalculate-experience-profiles',
    rawBody: '{"limit":50}',
    baseUrl: 'https://example.com',
    secret: 'internal-secret',
    fetchImpl,
    stdout: { log: value => logs.push(value) },
  });

  assert.deepEqual(result, {
    statusCode: 200,
    endpoint: '/api/internal/recalculate-experience-profiles',
    response: { status: 'completed' },
  });
  assert.equal(calls[0].url, 'https://example.com/api/internal/recalculate-experience-profiles');
  assert.equal(calls[0].init?.method, 'POST');
  assert.deepEqual(calls[0].init?.headers, {
    Authorization: 'Bearer internal-secret',
    'Content-Type': 'application/json',
  });
  assert.equal(calls[0].init?.body, '{"limit":50}');
  assert.ok(!logs.join('\n').includes('internal-secret'));
});

test('runInternalJob validates configuration before calling fetch', async () => {
  const { calls, fetchImpl } = createFetch({ ok: true, status: 200, text: '{}' });

  await assert.rejects(
    () => runInternalJob({
      endpoint: '/api/internal/recalculate-experience-profiles',
      baseUrl: undefined,
      secret: 'internal-secret',
      fetchImpl,
    }),
    /QLING_INTERNAL_BASE_URL/,
  );
  await assert.rejects(
    () => runInternalJob({
      endpoint: '/api/public/not-allowed',
      baseUrl: 'https://example.com',
      secret: 'internal-secret',
      fetchImpl,
    }),
    /Usage/,
  );
  await assert.rejects(
    () => runInternalJob({
      endpoint: '/api/internal/recalculate-experience-profiles',
      rawBody: '{',
      baseUrl: 'https://example.com',
      secret: 'internal-secret',
      fetchImpl,
    }),
    /valid JSON/,
  );
  assert.equal(calls.length, 0);
});

test('runInternalJob logs failed response without leaking secret', async () => {
  const { fetchImpl } = createFetch({
    ok: false,
    status: 503,
    text: '{"error":"firebase_unavailable"}',
  });
  const errors: string[] = [];

  await assert.rejects(
    () => runInternalJob({
      endpoint: '/api/internal/experience-profile-summaries/run',
      baseUrl: 'https://example.com',
      secret: 'internal-secret',
      fetchImpl,
      stderr: { error: value => errors.push(value) },
    }),
    /HTTP 503/,
  );

  assert.ok(errors.join('\n').includes('firebase_unavailable'));
  assert.ok(!errors.join('\n').includes('internal-secret'));
});
