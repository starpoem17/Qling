import test from 'node:test';
import assert from 'node:assert/strict';
import { AccountDeletionCleanupError } from '../services/userAccount';
import { registerUserAccountRoutes } from './userAccountRoutes';
import { applyQlingReleaseHeaders } from './versionRoutes';
import type { deleteMyAccount } from '../services/userAccount';

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

function captureRoute(options: {
  verifyIdToken?: () => Promise<{ uid: string }>;
  deleteUser?: (uid: string) => Promise<void>;
  deleteAccount?: typeof deleteMyAccount;
} = {}) {
  const handlers: Array<(req: unknown, res: unknown) => unknown> = [];
  const calls: unknown[] = [];
  const app = {
    post(path: string, handler: (req: unknown, res: unknown) => unknown) {
      assert.equal(path, '/api/users/me/delete');
      handlers.push(handler);
    },
  };
  const repository = {
    deleteUserAccountState: async () => ({
      status: 'success' as const,
      deletedTokenCount: 0,
      deletedReadStateCount: 0,
      deletedNicknameReservation: false,
      completedPhases: [],
    }),
  };
  const clock = { now: () => 'now' };

  registerUserAccountRoutes(app as never, {
    db: {} as never,
    auth: {
      verifyIdToken: options.verifyIdToken ?? (async () => ({ uid: 'verified-user' })),
      deleteUser: options.deleteUser ?? (async uid => { calls.push(`deleteAuth:${uid}`); }),
    } as never,
    repository,
    clock,
    deleteAccount: options.deleteAccount ?? (async params => {
      calls.push(params);
      return {
        status: 'deleted',
        deletedTokenCount: 0,
        deletedReadStateCount: 0,
        deletedNicknameReservation: false,
        completedPhases: [],
      };
    }),
  });

  return { handler: handlers[0], calls };
}

test('delete account route maps missing and invalid auth', async () => {
  const missing = captureRoute();
  const missingRes = createRes();
  await missing.handler({ headers: {}, body: { confirm: true } } as never, missingRes as never);
  assert.equal(missingRes.statusCode, 401);
  assert.deepEqual(missingRes.body, { error: { code: 'auth_missing', message: '로그인이 필요합니다.' } });
  assert.deepEqual(missing.calls, []);

  const invalid = captureRoute({
    verifyIdToken: async () => { throw new Error('bad token'); },
  });
  const invalidRes = createRes();
  await invalid.handler({ headers: { authorization: 'Bearer bad' }, body: { confirm: true } } as never, invalidRes as never);
  assert.equal(invalidRes.statusCode, 401);
  assert.deepEqual(invalidRes.body, { error: { code: 'auth_invalid', message: '로그인 정보를 확인할 수 없습니다.' } });
  assert.deepEqual(invalid.calls, []);
});

test('delete account route requires exact confirmation body', async () => {
  for (const body of [undefined, {}, { confirm: false }]) {
    const route = captureRoute();
    const res = createRes();
    await route.handler({ headers: { authorization: 'Bearer token' }, body } as never, res as never);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      error: {
        code: 'confirmation_required',
        message: '계정 삭제 확인이 필요합니다.',
      },
    });
    assert.deepEqual(route.calls, []);
  }
});

test('delete account route uses verified uid and ignores spoofed body identity fields', async () => {
  const route = captureRoute({
    verifyIdToken: async () => ({ uid: 'verified-user' }),
  });
  const res = createRes();
  await route.handler({
    headers: { authorization: 'Bearer token' },
    body: {
      confirm: true,
      uid: 'attacker',
      userId: 'attacker',
      authorUid: 'attacker',
      replierUid: 'attacker',
      targetUid: 'attacker',
    },
  } as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { status: 'deleted' });
  assert.equal(route.calls.length, 2);
  assert.equal((route.calls[0] as { uid: string }).uid, 'verified-user');
  assert.equal(route.calls[1], 'deleteAuth:verified-user');
});

test('delete account route returns 200 for already deleted service result', async () => {
  const route = captureRoute({
    deleteAccount: async () => ({
      status: 'deleted',
      deletedTokenCount: 0,
      deletedReadStateCount: 0,
      deletedNicknameReservation: false,
      completedPhases: [],
    }),
  });
  const res = createRes();
  await route.handler({ headers: { authorization: 'Bearer token' }, body: { confirm: true } } as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { status: 'deleted' });
});

test('delete account route deletes Firestore account state before Firebase Auth user', async () => {
  const route = captureRoute();
  const res = createRes();
  await route.handler({ headers: { authorization: 'Bearer token' }, body: { confirm: true } } as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.equal((route.calls[0] as { uid: string }).uid, 'verified-user');
  assert.equal(route.calls[1], 'deleteAuth:verified-user');
});

test('delete account route fails closed when Firebase Auth deletion fails', async () => {
  const route = captureRoute({
    deleteUser: async () => {
      const error = new Error('auth delete failed') as Error & { code: string };
      error.code = 'auth/internal-error';
      throw error;
    },
  });
  const res = createRes();
  await route.handler({ headers: { authorization: 'Bearer token' }, body: { confirm: true } } as never, res as never);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    error: {
      code: 'account_deletion_auth_failed',
      message: '계정 삭제 처리 중 문제가 발생했습니다.',
    },
  });
  assert.equal((route.calls[0] as { uid: string }).uid, 'verified-user');
});

test('delete account route treats missing Auth user as idempotent deletion success', async () => {
  const route = captureRoute({
    deleteUser: async () => {
      const error = new Error('user not found') as Error & { code: string };
      error.code = 'auth/user-not-found';
      throw error;
    },
  });
  const res = createRes();
  await route.handler({ headers: { authorization: 'Bearer token' }, body: { confirm: true } } as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { status: 'deleted' });
  assert.equal((route.calls[0] as { uid: string }).uid, 'verified-user');
});

test('delete account route maps storage failure', async () => {
  const route = captureRoute({
    deleteAccount: async () => { throw new AccountDeletionCleanupError('delete_nickname_reservation', 'permission-denied'); },
  });
  const res = createRes();
  await route.handler({ headers: { authorization: 'Bearer token' }, body: { confirm: true } } as never, res as never);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    error: {
      code: 'account_deletion_cleanup_failed',
      phase: 'delete_nickname_reservation',
      firebaseCode: 'permission-denied',
      message: '계정 삭제 처리 중 문제가 발생했습니다.',
    },
  });
});

test('delete account route includes cleanup phase and step when available', async () => {
  const route = captureRoute({
    deleteAccount: async () => {
      throw new AccountDeletionCleanupError('delete_fcm_tokens', 'permission-denied', 'list_token_docs');
    },
  });
  const res = createRes();
  await route.handler({ headers: { authorization: 'Bearer token' }, body: { confirm: true } } as never, res as never);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    error: {
      code: 'account_deletion_cleanup_failed',
      phase: 'delete_fcm_tokens',
      step: 'list_token_docs',
      firebaseCode: 'permission-denied',
      message: '계정 삭제 처리 중 문제가 발생했습니다.',
    },
  });
});

test('delete account route includes read-state cleanup phase and step on failures', async () => {
  const route = captureRoute({
    deleteAccount: async () => {
      throw new AccountDeletionCleanupError(
        'delete_delivery_read_states',
        'permission-denied',
        'commit_delivery_read_state_deletes'
      );
    },
  });
  const res = createRes();
  applyQlingReleaseHeaders(res as never, {
    service: 'Qling',
    gitSha: 'sha-read-state',
    buildTime: 'time-read-state',
    nodeEnv: 'production',
  });

  await route.handler({ headers: { authorization: 'Bearer token' }, body: { confirm: true } } as never, res as never);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    error: {
      code: 'account_deletion_cleanup_failed',
      phase: 'delete_delivery_read_states',
      step: 'commit_delivery_read_state_deletes',
      firebaseCode: 'permission-denied',
      message: '계정 삭제 처리 중 문제가 발생했습니다.',
    },
  });
  assert.equal(res.headers.get('X-Qling-Release-Sha'), 'sha-read-state');
  assert.equal(res.headers.get('X-Qling-Build-Time'), 'time-read-state');
});
