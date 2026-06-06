import type express from 'express';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { createRequireActiveFirebaseAuth, parseBearerToken, type ActiveAuthenticatedRequest } from './auth';
import { completeOnboarding, reserveNickname } from '../services/userProfile/onboardingProfile';
import { updateMyInterests } from '../services/userProfile/profileInterests';
import { validateAge, validateNickname, isValidGender, isValidProfileColor, normalizeInterests } from '../services/userProfile/profileValidation';
import { createUserProfileFirestoreRepository } from '../services/userProfile/firestoreRepository';
import { backfillInitialWorriesForNewUser, type InitialWorryBackfillRepository } from '../services/userProfile/initialWorryBackfill';
import {
  createInitialWorryBackfillFirestoreRepository,
  refillWorryInboxForFirestoreUser,
} from '../services/userProfile/initialWorryBackfillFirestoreRepository';
import type { UserProfileRepository } from '../services/userProfile/types';

function sendServiceResult(res: express.Response, result: { status: string; code?: string; message?: string }) {
  if (result.status === 'available' || result.status === 'completed') {
    res.status(200).json(result);
    return;
  }
  if (result.status === 'duplicate') {
    res.status(409).json(result);
    return;
  }
  if (result.status === 'invalid') {
    res.status(400).json({ error: { code: result.code, message: result.message } });
    return;
  }
  res.status(409).json({ error: { code: result.code, message: result.message } });
}

function createRequireVerifiedFirebaseAuth(auth: Pick<Auth, 'verifyIdToken'>): express.RequestHandler {
  return async (req, res, next) => {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ error: { code: 'auth_missing', message: '로그인이 필요합니다.' } });
      return;
    }

    try {
      const decoded = await auth.verifyIdToken(token);
      (req as ActiveAuthenticatedRequest).auth = { uid: decoded.uid };
      next();
    } catch {
      res.status(401).json({ error: { code: 'auth_invalid', message: '로그인 정보를 확인할 수 없습니다.' } });
    }
  };
}

export function registerUserProfileRoutes(app: express.Express, deps: {
  readonly db: Firestore | null;
  readonly auth: Pick<Auth, 'verifyIdToken'>;
  readonly repository?: UserProfileRepository;
  readonly initialWorryBackfillRepository?: InitialWorryBackfillRepository;
  readonly refillWorryInbox?: (params: { uid: string }) => Promise<{
    readonly createdCount: number;
    readonly deliveryIds: readonly string[];
  }>;
}): void {
  if (!deps.db && !deps.repository) {
    app.post('/api/users/me/nickname-reservation', (_req, res) => {
      res.status(503).json({ error: { code: 'firebase_unavailable', message: 'Firebase Admin is not initialized.' } });
    });
    app.post('/api/users/me/onboarding-profile', (_req, res) => {
      res.status(503).json({ error: { code: 'firebase_unavailable', message: 'Firebase Admin is not initialized.' } });
    });
    app.patch('/api/users/me/interests', (_req, res) => {
      res.status(503).json({ error: { code: 'firebase_unavailable', message: 'Firebase Admin is not initialized.' } });
    });
    app.post('/api/users/me/worry-inbox-refill', (_req, res) => {
      res.status(503).json({ error: { code: 'firebase_unavailable', message: 'Firebase Admin is not initialized.' } });
    });
    return;
  }

  const requireVerifiedAuth = createRequireVerifiedFirebaseAuth(deps.auth);
  const requireActiveAuth = createRequireActiveFirebaseAuth({
    auth: deps.auth,
    db: deps.db as Firestore,
  });

  const repository = deps.repository ?? createUserProfileFirestoreRepository({ db: deps.db as Firestore });
  const initialWorryBackfillRepository = deps.initialWorryBackfillRepository
    ?? (deps.repository ? null : createInitialWorryBackfillFirestoreRepository({ db: deps.db as Firestore }));
  const refillWorryInbox = deps.refillWorryInbox
    ?? (({ uid }: { uid: string }) => refillWorryInboxForFirestoreUser({ db: deps.db as Firestore, uid }));

  app.post('/api/users/me/nickname-reservation', requireVerifiedAuth, async (req, res) => {
    const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname : '';
    const authReq = req as ActiveAuthenticatedRequest;
    sendServiceResult(res, await reserveNickname({
      uid: authReq.auth.uid,
      nickname,
      repository,
    }));
  });

  app.post('/api/users/me/onboarding-profile', requireVerifiedAuth, async (req, res) => {
    const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname : '';
    const nicknameValidation = validateNickname(nickname);
    const ageValidation = validateAge(String(req.body?.age ?? ''));
    const gender = typeof req.body?.gender === 'string' && isValidGender(req.body.gender) ? req.body.gender : '';
    const interests = normalizeInterests(Array.isArray(req.body?.interests) ? req.body.interests : []);
    const profileColor = isValidProfileColor(req.body?.profileColor) ? req.body.profileColor : '';

    if (!nicknameValidation.valid || !ageValidation.valid || !gender || interests.length === 0 || !profileColor) {
      res.status(400).json({
        error: {
          code: 'invalid_profile',
          message: '온보딩 필수 입력값을 확인해주세요.',
        },
      });
      return;
    }

    const authReq = req as ActiveAuthenticatedRequest;
    const result = await completeOnboarding({
      uid: authReq.auth.uid,
      draft: {
        nickname,
        gender,
        age: String(ageValidation.age),
        interests,
        profileColor,
      },
      repository,
    });

    if (result.status !== 'completed') {
      sendServiceResult(res, result);
      return;
    }

    if (!initialWorryBackfillRepository) {
      res.status(200).json(result);
      return;
    }

    try {
      const backfill = await backfillInitialWorriesForNewUser({
        uid: authReq.auth.uid,
        gender,
        interests,
        repository: initialWorryBackfillRepository,
      });
      res.status(200).json({
        ...result,
        initialDeliveryCount: backfill.createdCount,
        initialDeliveryIds: backfill.deliveryIds,
      });
    } catch (error) {
      console.error('Initial worry backfill failed:', error);
      res.status(200).json({
        ...result,
        initialDeliveryCount: 0,
        initialDeliveryBackfillStatus: 'failed',
      });
    }
  });

  app.patch('/api/users/me/interests', requireActiveAuth, async (req, res) => {
    const authReq = req as ActiveAuthenticatedRequest;
    const result = await updateMyInterests({
      uid: authReq.auth.uid,
      interests: Array.isArray(req.body?.interests) ? req.body.interests : [],
      repository,
    });

    if (result.status === 'updated') {
      res.status(200).json(result);
      return;
    }

    res.status(400).json({ error: { code: result.code, message: result.message } });
  });

  app.post('/api/users/me/worry-inbox-refill', requireActiveAuth, async (req, res) => {
    const authReq = req as ActiveAuthenticatedRequest;
    try {
      const result = await refillWorryInbox({
        uid: authReq.auth.uid,
      });
      res.status(200).json({
        status: 'completed',
        refillDeliveryCount: result.createdCount,
        refillDeliveryIds: result.deliveryIds,
      });
    } catch (error) {
      console.error('Worry inbox refill failed:', error);
      res.status(500).json({
        error: {
          code: 'worry_inbox_refill_failed',
          message: '받은 고민을 불러오는 중 문제가 발생했습니다.',
        },
      });
    }
  });
}
