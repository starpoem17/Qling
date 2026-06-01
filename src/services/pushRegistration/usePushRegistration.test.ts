import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pushDisabledStorageKey,
  readPushDisabledForCurrentDeviceFromStorage,
  writePushDisabledForCurrentDeviceToStorage,
  type PushDisabledStorageLike,
} from './usePushRegistration';

class MemoryStorage implements PushDisabledStorageLike {
  values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

test('current-device push opt-out persists by user id', () => {
  const storage = new MemoryStorage();
  const user = { uid: 'user-1' };

  writePushDisabledForCurrentDeviceToStorage(storage, user, true);

  assert.equal(storage.getItem(pushDisabledStorageKey('user-1')), 'true');
  assert.equal(readPushDisabledForCurrentDeviceFromStorage(storage, user), true);
  assert.equal(readPushDisabledForCurrentDeviceFromStorage(storage, { uid: 'user-2' }), false);
});

test('current-device push opt-in removes persisted opt-out', () => {
  const storage = new MemoryStorage();
  const user = { uid: 'user-1' };
  storage.setItem(pushDisabledStorageKey('user-1'), 'true');

  writePushDisabledForCurrentDeviceToStorage(storage, user, false);

  assert.equal(storage.getItem(pushDisabledStorageKey('user-1')), null);
  assert.equal(readPushDisabledForCurrentDeviceFromStorage(storage, user), false);
});
