import type express from 'express';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { parseBearerToken } from './auth';
import { AccountDeletionCleanupError, deleteMyAccount } from '../services/userAccount';
import {
  createFirestoreUserAccountRepository,
  createServerTimestampClock,
} from '../services/userAccount/firestoreRepository';
import type { UserAccountClock, UserAccountRepository } from '../services/userAccount/types';

function deletionAuthError(res: express.Response, status: 401, code: string, message: string) {
  res.status(status).json({ error: { code, message } });
}

function accountDeletionFailure(
  res: express.Response,
  code: 'account_deletion_cleanup_failed' | 'account_deletion_auth_failed',
  error: unknown,
  uid: string
) {
  console.error('Account deletion failed:', {
    code,
    uid,
    errorCode: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: unknown }).code : undefined,
    errorMessage: error instanceof Error ? error.message : String(error),
  });
  const phase = error instanceof AccountDeletionCleanupError ? error.phase : undefined;
  const firebaseCode = error instanceof AccountDeletionCleanupError ? error.firebaseCode : undefined;
  res.status(500).json({
    error: {
      code,
      ...(phase ? { phase } : {}),
      ...(firebaseCode ? { firebaseCode } : {}),
      message: '계정 삭제 처리 중 문제가 발생했습니다.',
    },
  });
}

function isAuthUserNotFound(error: unknown) {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: unknown }).code === 'auth/user-not-found';
}

async function requireDeletionAuth(req: express.Request, res: express.Response, auth: Pick<Auth, 'verifyIdToken'>) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    deletionAuthError(res, 401, 'auth_missing', '로그인이 필요합니다.');
    return null;
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    deletionAuthError(res, 401, 'auth_invalid', '로그인 정보를 확인할 수 없습니다.');
    return null;
  }
}

export function registerUserAccountRoutes(app: express.Express, deps: {
  db: Firestore | null;
  auth: Pick<Auth, 'verifyIdToken' | 'deleteUser'>;
  repository?: UserAccountRepository;
  clock?: UserAccountClock;
  deleteAccount?: typeof deleteMyAccount;
}): void {
  if (!deps.db && !deps.repository) {
    app.post('/api/users/me/delete', (_req, res) => {
      res.status(500).json({
        error: {
          code: 'firebase_unavailable',
          message: 'Firebase Admin is not initialized.',
        },
      });
    });
    return;
  }

  app.post('/api/users/me/delete', async (req, res) => {
    const uid = await requireDeletionAuth(req, res, deps.auth);
    if (!uid) return;

    if (req.body?.confirm !== true) {
      res.status(400).json({
        error: {
          code: 'confirmation_required',
          message: '계정 삭제 확인이 필요합니다.',
        },
      });
      return;
    }

    const repository = deps.repository ?? createFirestoreUserAccountRepository({ db: deps.db as Firestore });
    const clock = deps.clock ?? createServerTimestampClock();
    const deleteAccount = deps.deleteAccount ?? deleteMyAccount;

    try {
      await deleteAccount({ uid, repository, clock });
    } catch (error) {
      accountDeletionFailure(res, 'account_deletion_cleanup_failed', error, uid);
      return;
    }

    try {
      await deps.auth.deleteUser(uid);
    } catch (error) {
      if (!isAuthUserNotFound(error)) {
        accountDeletionFailure(res, 'account_deletion_auth_failed', error, uid);
        return;
      }
    }

    res.status(200).json({ status: 'deleted' });
  });
}
