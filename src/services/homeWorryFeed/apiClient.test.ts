import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchPrdAnswerFeedViaApi } from './apiClient';

const user = {
  getIdToken: async () => 'token',
};

test('answer feed API client fetches authenticated endpoint response', async () => {
  let capturedUrl = '';
  let capturedAuth = '';
  const result = await fetchPrdAnswerFeedViaApi({
    user: user as never,
    fetchImpl: async (url, init) => {
      capturedUrl = String(url);
      capturedAuth = String((init?.headers as Record<string, string>).Authorization);
      return new Response(JSON.stringify({
        items: [{
          id: 'delivery1',
          deliveryId: 'delivery1',
          worryId: 'worry1',
          authorUid: 'author',
          recipientUid: 'recipient',
          originalContent: 'content',
          refinedContent: 'content',
          categories: ['진로'],
          createdAt: { seconds: 1 },
          status: 'active',
          source: 'prd_delivery',
          hasUnread: true,
        }],
      }), { status: 200 });
    },
  });

  assert.equal(capturedUrl, '/api/me/answer-feed');
  assert.equal(capturedAuth, 'Bearer token');
  assert.equal(result.status, 'ok');
  assert.equal(result.status === 'ok' ? result.items[0].deliveryId : '', 'delivery1');
  assert.deepEqual(result.status === 'ok' ? result.items[0].createdAt : null, { seconds: 1 });
});

test('answer feed API client maps endpoint failure', async () => {
  const result = await fetchPrdAnswerFeedViaApi({
    user: user as never,
    fetchImpl: async () => new Response(JSON.stringify({
      error: { code: 'auth_invalid', message: 'bad token' },
    }), { status: 401 }),
  });

  assert.deepEqual(result, {
    status: 'failed',
    code: 'auth_invalid',
    reason: 'bad token',
  });
});

test('answer feed API client rejects malformed success response', async () => {
  const result = await fetchPrdAnswerFeedViaApi({
    user: user as never,
    fetchImpl: async () => new Response(JSON.stringify({
      items: [{ deliveryId: 'missing-fields' }],
    }), { status: 200 }),
  });

  assert.deepEqual(result, {
    status: 'failed',
    reason: '답변 피드 응답을 해석할 수 없습니다.',
  });
});
