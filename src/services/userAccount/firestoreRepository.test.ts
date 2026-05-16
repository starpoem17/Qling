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
    const data = this.db.docs.get(this.path);
    return {
      exists: data !== undefined,
      data: () => data,
    };
  }

  collection(name: string) {
    return {
      listDocuments: async () => [...this.db.refs.values()]
        .filter(ref => ref.path.startsWith(`${this.path}/${name}/`)),
    };
  }
}

class FakeDb {
  docs = new Map<string, Record<string, unknown>>();
  refs = new Map<string, Ref>();
  deletedPaths: string[] = [];

  constructor(seed: Record<string, Record<string, unknown>>) {
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
    deletedTokenCount: 2,
    deletedReadStateCount: 2,
    deletedNicknameReservation: true,
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
    deletedTokenCount: 0,
    deletedReadStateCount: 0,
    deletedNicknameReservation: false,
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
    deletedTokenCount: 0,
    deletedReadStateCount: 0,
    deletedNicknameReservation: true,
  });
  assert.deepEqual(db.deletedPaths.sort(), [
    'nicknameReservations/starpoem',
    'users/m28rhnqrTtcQiT04Szff2HBSZ5q1',
  ].sort());
  assert.equal(db.docs.has('users/m28rhnqrTtcQiT04Szff2HBSZ5q1'), false);
  assert.equal(db.docs.has('nicknameReservations/starpoem'), false);
});
