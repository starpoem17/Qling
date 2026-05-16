import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirestoreUserAccountRepository } from './firestoreRepository';

class Ref {
  deleted = false;
  constructor(
    readonly path: string,
    private readonly db: FakeDb
  ) {}

  async get() {
    this.db.maybeFail(`get:${this.path}`);
    const data = this.db.docs.get(this.path);
    return {
      exists: data !== undefined,
      data: () => data,
    };
  }

  collection(name: string) {
    return {
      listDocuments: async () => {
        this.db.maybeFail(`list:${this.path}/${name}`);
        this.db.seenCollectionLists.add(`${this.path}/${name}`);
        return [...this.db.refs.values()]
          .filter(ref => ref.path.startsWith(`${this.path}/${name}/`));
      },
    };
  }
}

class FakeDb {
  docs = new Map<string, Record<string, unknown>>();
  refs = new Map<string, Ref>();
  deletedPaths: string[] = [];
  seenCollectionLists = new Set<string>();
  readonly existingEmptyCollections: Set<string>;

  constructor(
    seed: Record<string, Record<string, unknown>>,
    readonly failOperations = new Set<string>(),
    options: { existingEmptyCollections?: string[] } = {}
  ) {
    this.existingEmptyCollections = new Set(options.existingEmptyCollections ?? []);
    for (const [path, data] of Object.entries(seed)) {
      this.docs.set(path, data);
      this.ref(path);
    }
  }

  collection(name: string) {
    return {
      doc: (id: string) => this.ref(`${name}/${id}`),
    };
  }

  batch() {
    const deletes: Ref[] = [];
    return {
      delete: (ref: Ref) => {
        deletes.push(ref);
      },
      commit: async () => {
        if (deletes.length === 0) {
          throw Object.assign(new Error('empty batch commit'), { code: 'fake/empty-batch' });
        }
        for (const ref of deletes) {
          this.maybeFail(`delete:${ref.path}`);
        }
        for (const ref of deletes) {
          ref.deleted = true;
          this.deletedPaths.push(ref.path);
          this.docs.delete(ref.path);
        }
      },
    };
  }

  ref(path: string) {
    const existing = this.refs.get(path);
    if (existing) return existing;
    const ref = new Ref(path, this);
    this.refs.set(path, ref);
    return ref;
  }

  maybeFail(operation: string) {
    if (this.failOperations.has(operation)) {
      throw Object.assign(new Error(`failed ${operation}`), { code: 'fake/permission-denied' });
    }
  }
}

test('Firestore account repository deletes profile session state and nickname reservation', async () => {
  const db = new FakeDb({
    'users/user-1': { uid: 'user-1', normalizedNickname: 'rNickname' },
    'users/user-1/fcmTokens/token-1': { token: 'token-1' },
    'users/user-1/fcmTokens/token-2': { token: 'token-2' },
    'users/user-1/deliveryReadStates/delivery-1': {},
    'users/user-1/replyReadStates/reply-1': {},
    'nicknameReservations/rNickname': { uid: 'user-1' },
  });

  const result = await createFirestoreUserAccountRepository({ db: db as never })
    .deleteUserAccountState({ uid: 'user-1' });

  assert.deepEqual(result, {
    status: 'success',
    deletedTokenCount: 2,
    deletedReadStateCount: 2,
    deletedNicknameReservation: true,
    completedPhases: [
      'load_user_profile',
      'load_user_profile',
      'delete_fcm_tokens',
      'delete_delivery_read_states',
      'delete_reply_read_states',
      'delete_nickname_reservation',
      'delete_user_document',
      'verify_user_document_deleted',
      'verify_nickname_reservation_deleted',
    ],
  });
  assert.deepEqual(db.deletedPaths.sort(), [
    'nicknameReservations/rNickname',
    'users/user-1',
    'users/user-1/deliveryReadStates/delivery-1',
    'users/user-1/fcmTokens/token-1',
    'users/user-1/fcmTokens/token-2',
    'users/user-1/replyReadStates/reply-1',
  ].sort());
});

test('Firestore account repository cleanup is idempotent without nickname reservation', async () => {
  const db = new FakeDb({});

  const result = await createFirestoreUserAccountRepository({ db: db as never })
    .deleteUserAccountState({ uid: 'missing-user' });

  assert.deepEqual(result, {
    status: 'success',
    deletedTokenCount: 0,
    deletedReadStateCount: 0,
    deletedNicknameReservation: false,
    completedPhases: [
      'load_user_profile',
      'delete_fcm_tokens',
      'delete_delivery_read_states',
      'delete_reply_read_states',
      'delete_nickname_reservation',
      'delete_user_document',
      'verify_user_document_deleted',
      'verify_nickname_reservation_deleted',
    ],
  });
  assert.deepEqual(db.deletedPaths, ['users/missing-user']);
});

test('Firestore account repository deletes freshly re-onboarded starpoem profile and reservation', async () => {
  const db = new FakeDb({
    'users/m28rhnqrTtcQiT04Szff2HBSZ5q1': {
      uid: 'm28rhnqrTtcQiT04Szff2HBSZ5q1',
      nickname: 'starpoem',
      normalizedNickname: 'starpoem',
      gender: 'male',
      age: 22,
      interests: ['취업', '진로', '학업', '시험', '연애'],
    },
    'nicknameReservations/starpoem': {
      uid: 'm28rhnqrTtcQiT04Szff2HBSZ5q1',
      nickname: 'starpoem',
      normalizedNickname: 'starpoem',
    },
  });

  const result = await createFirestoreUserAccountRepository({ db: db as never })
    .deleteUserAccountState({ uid: 'm28rhnqrTtcQiT04Szff2HBSZ5q1' });

  assert.deepEqual(result, {
    status: 'success',
    deletedTokenCount: 0,
    deletedReadStateCount: 0,
    deletedNicknameReservation: true,
    completedPhases: [
      'load_user_profile',
      'load_user_profile',
      'delete_fcm_tokens',
      'delete_delivery_read_states',
      'delete_reply_read_states',
      'delete_nickname_reservation',
      'delete_user_document',
      'verify_user_document_deleted',
      'verify_nickname_reservation_deleted',
    ],
  });
  assert.deepEqual(db.deletedPaths.sort(), [
    'nicknameReservations/starpoem',
    'users/m28rhnqrTtcQiT04Szff2HBSZ5q1',
  ].sort());
  assert.equal(db.docs.has('users/m28rhnqrTtcQiT04Szff2HBSZ5q1'), false);
  assert.equal(db.docs.has('nicknameReservations/starpoem'), false);
});

test('Firestore account repository succeeds with each optional account subcollection missing', async () => {
  for (const uid of ['missing-fcm', 'missing-delivery-read-state', 'missing-reply-read-state']) {
    const db = new FakeDb({
      [`users/${uid}`]: { uid },
    });

    const result = await createFirestoreUserAccountRepository({ db: db as never })
      .deleteUserAccountState({ uid });

    assert.equal(result.status, 'success');
    assert.equal(result.deletedTokenCount, 0);
    assert.equal(result.deletedReadStateCount, 0);
    assert.equal(result.deletedNicknameReservation, false);
    assert.equal(db.docs.has(`users/${uid}`), false);
  }
});

test('delete_fcm_tokens succeeds when fcmTokens subcollection is missing', async () => {
  const db = new FakeDb({
    'users/user-1': { uid: 'user-1' },
    'users/user-1/deliveryReadStates/delivery-1': {},
    'users/user-1/replyReadStates/reply-1': {},
  });

  const result = await createFirestoreUserAccountRepository({ db: db as never })
    .deleteUserAccountState({ uid: 'user-1' });

  assert.equal(result.status, 'success');
  assert.equal(result.deletedTokenCount, 0);
  assert.equal(db.seenCollectionLists.has('users/user-1/fcmTokens'), true);
  assert.equal(db.deletedPaths.includes('users/user-1/deliveryReadStates/delivery-1'), true);
  assert.equal(db.deletedPaths.includes('users/user-1/replyReadStates/reply-1'), true);
  assert.equal(db.deletedPaths.includes('users/user-1'), true);
});

test('delete_fcm_tokens succeeds when fcmTokens subcollection exists but is empty', async () => {
  const db = new FakeDb({
    'users/user-1': { uid: 'user-1' },
  }, new Set(), {
    existingEmptyCollections: ['users/user-1/fcmTokens'],
  });

  const result = await createFirestoreUserAccountRepository({ db: db as never })
    .deleteUserAccountState({ uid: 'user-1' });

  assert.equal(result.status, 'success');
  assert.equal(result.deletedTokenCount, 0);
  assert.equal(db.existingEmptyCollections.has('users/user-1/fcmTokens'), true);
  assert.equal(db.deletedPaths.includes('users/user-1'), true);
});

test('delete_fcm_tokens deletes one token doc', async () => {
  const db = new FakeDb({
    'users/user-1': { uid: 'user-1' },
    'users/user-1/fcmTokens/token-1': { token: 'token-1' },
  });

  const result = await createFirestoreUserAccountRepository({ db: db as never })
    .deleteUserAccountState({ uid: 'user-1' });

  assert.equal(result.status, 'success');
  assert.equal(result.deletedTokenCount, 1);
  assert.equal(db.deletedPaths.includes('users/user-1/fcmTokens/token-1'), true);
});

test('delete_fcm_tokens deletes multiple token docs', async () => {
  const db = new FakeDb({
    'users/user-1': { uid: 'user-1' },
    'users/user-1/fcmTokens/token-1': { token: 'token-1' },
    'users/user-1/fcmTokens/token-2': { token: 'token-2' },
  });

  const result = await createFirestoreUserAccountRepository({ db: db as never })
    .deleteUserAccountState({ uid: 'user-1' });

  assert.equal(result.status, 'success');
  assert.equal(result.deletedTokenCount, 2);
  assert.equal(db.deletedPaths.includes('users/user-1/fcmTokens/token-1'), true);
  assert.equal(db.deletedPaths.includes('users/user-1/fcmTokens/token-2'), true);
});

test('delete_fcm_tokens reports phase only when an actual token delete fails', async () => {
  const missingDb = new FakeDb({
    'users/user-1': { uid: 'user-1' },
  });
  const missingResult = await createFirestoreUserAccountRepository({ db: missingDb as never })
    .deleteUserAccountState({ uid: 'user-1' });
  assert.equal(missingResult.status, 'success');

  const failingDb = new FakeDb({
    'users/user-2': { uid: 'user-2' },
    'users/user-2/fcmTokens/token-1': { token: 'token-1' },
  }, new Set(['delete:users/user-2/fcmTokens/token-1']));
  const failingResult = await createFirestoreUserAccountRepository({ db: failingDb as never })
    .deleteUserAccountState({ uid: 'user-2' });

  assert.deepEqual(failingResult, {
    status: 'failed',
    phase: 'delete_fcm_tokens',
    firebaseCode: 'fake/permission-denied',
  });
  assert.equal(failingDb.deletedPaths.includes('users/user-2'), false);
});

test('Firestore account repository succeeds when nickname reservation is missing', async () => {
  const db = new FakeDb({
    'users/user-1': { uid: 'user-1', normalizedNickname: 'missing-reservation' },
  });

  const result = await createFirestoreUserAccountRepository({ db: db as never })
    .deleteUserAccountState({ uid: 'user-1' });

  assert.equal(result.status, 'success');
  assert.equal(result.deletedNicknameReservation, false);
  assert.equal(db.docs.has('users/user-1'), false);
});

test('Firestore account repository does not delete nickname reservation owned by another uid', async () => {
  const db = new FakeDb({
    'users/user-1': { uid: 'user-1', normalizedNickname: 'shared-name' },
    'nicknameReservations/shared-name': { uid: 'other-user' },
  });

  const result = await createFirestoreUserAccountRepository({ db: db as never })
    .deleteUserAccountState({ uid: 'user-1' });

  assert.equal(result.status, 'success');
  assert.equal(result.deletedNicknameReservation, false);
  assert.equal(db.docs.has('users/user-1'), false);
  assert.deepEqual(db.docs.get('nicknameReservations/shared-name'), { uid: 'other-user' });
});

test('Firestore account repository reports sanitized failure phase and code', async () => {
  const db = new FakeDb({
    'users/user-1': { uid: 'user-1' },
  }, new Set(['delete:users/user-1']));

  const result = await createFirestoreUserAccountRepository({ db: db as never })
    .deleteUserAccountState({ uid: 'user-1' });

  assert.deepEqual(result, {
    status: 'failed',
    phase: 'delete_user_document',
    firebaseCode: 'fake/permission-denied',
  });
});
