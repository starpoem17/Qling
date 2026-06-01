import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createProductionPushRegistrationAdapters, isInstalledPWA } from './adapters';
import { createPushRegistrationLifecycle } from './internalLifecycle';
import type { PushRegistrationStatus, PushRegistrationUser } from './types';

export const pushDisabledStorageKey = (uid: string) => `qling_push_disabled_${uid}`;

export interface PushDisabledStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const getLocalStorage = (): PushDisabledStorageLike | null => (
  typeof localStorage === 'undefined' ? null : localStorage
);

export const readPushDisabledForCurrentDeviceFromStorage = (
  storage: PushDisabledStorageLike | null,
  user: PushRegistrationUser | null
) => {
  if (!user || !storage) return false;
  return storage.getItem(pushDisabledStorageKey(user.uid)) === 'true';
};

export const writePushDisabledForCurrentDeviceToStorage = (
  storage: PushDisabledStorageLike | null,
  user: PushRegistrationUser | null,
  disabled: boolean
) => {
  if (!user || !storage) return;
  if (disabled) {
    storage.setItem(pushDisabledStorageKey(user.uid), 'true');
    return;
  }
  storage.removeItem(pushDisabledStorageKey(user.uid));
};

export function usePushRegistration({
  user,
  loading,
}: {
  user: PushRegistrationUser | null;
  loading: boolean;
}) {
  const adapters = useMemo(() => createProductionPushRegistrationAdapters(), []);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    adapters.isNotificationSupported() ? adapters.getNotificationPermission() : 'denied'
  );
  const [pushRegistrationStatus, setPushRegistrationStatus] = useState<PushRegistrationStatus>('idle');
  const [fcmDebugToken, setFcmDebugToken] = useState<string>('');
  const [pushDisabledForCurrentDevice, setPushDisabledForCurrentDevice] = useState(false);
  const pushRegistrationStatusRef = useRef(pushRegistrationStatus);
  const installedPwaAttemptedUidRef = useRef<string | null>(null);

  useEffect(() => {
    pushRegistrationStatusRef.current = pushRegistrationStatus;
  }, [pushRegistrationStatus]);

  useEffect(() => {
    setPushDisabledForCurrentDevice(readPushDisabledForCurrentDeviceFromStorage(getLocalStorage(), user));
  }, [user]);

  const lifecycle = useMemo(() => createPushRegistrationLifecycle({
    adapters,
    state: {
      getPushRegistrationStatus: () => pushRegistrationStatusRef.current,
      setNotificationPermission,
      setPushRegistrationStatus,
      setFcmDebugToken,
    },
  }), [adapters]);

  const requestNotificationPermission = useCallback(
    () => {
      writePushDisabledForCurrentDeviceToStorage(getLocalStorage(), user, false);
      setPushDisabledForCurrentDevice(false);
      return lifecycle.requestNotificationPermission(user);
    },
    [lifecycle, user]
  );

  const disablePushRegistrationForCurrentDevice = useCallback(async () => {
    writePushDisabledForCurrentDeviceToStorage(getLocalStorage(), user, true);
    setPushDisabledForCurrentDevice(Boolean(user));
    await lifecycle.cleanupStoredPushToken();
    setPushDisabledForCurrentDevice(Boolean(user));
    installedPwaAttemptedUidRef.current = null;
  }, [lifecycle, user]);

  const resetPushRegistrationOnSignOut = useCallback(async () => {
    await lifecycle.cleanupStoredPushToken();
    setPushDisabledForCurrentDevice(false);
    installedPwaAttemptedUidRef.current = null;
  }, [lifecycle, user]);

  useEffect(() => {
    const { lastKnownFcmToken } = adapters.readStoredMetadata();
    if (lastKnownFcmToken) {
      setFcmDebugToken(lastKnownFcmToken);
    }
  }, [adapters]);

  useEffect(() => {
    if (!adapters.isNotificationSupported()) return;

    const syncNotificationPermissionState = async () => {
      const permission = adapters.getNotificationPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        await lifecycle.cleanupStoredPushToken();
        return;
      }

      if (user) {
        if (readPushDisabledForCurrentDeviceFromStorage(getLocalStorage(), user)) {
          setPushDisabledForCurrentDevice(true);
          return;
        }
        await lifecycle.maybeRecoverPushRegistration(user, 'app-foreground');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncNotificationPermissionState();
      }
    };

    void syncNotificationPermissionState();
    const handleFocus = () => {
      void syncNotificationPermissionState();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [adapters, lifecycle, user]);

  useEffect(() => {
    if (!user || loading || notificationPermission !== 'granted') {
      return;
    }

    if (pushDisabledForCurrentDevice) {
      return;
    }

    void lifecycle.maybeRecoverPushRegistration(user, 'signed-in-stable');
  }, [user, loading, notificationPermission, lifecycle, pushDisabledForCurrentDevice]);

  useEffect(() => {
    if (!user || loading || notificationPermission !== 'granted' || !isInstalledPWA()) {
      return;
    }

    if (pushDisabledForCurrentDevice) {
      return;
    }

    if (installedPwaAttemptedUidRef.current === user.uid) {
      return;
    }

    installedPwaAttemptedUidRef.current = user.uid;
    void lifecycle.maybeRecoverPushRegistration(user, 'installed-pwa-initial');
  }, [user, loading, notificationPermission, lifecycle, pushDisabledForCurrentDevice]);

  return {
    notificationPermission,
    pushRegistrationStatus,
    pushDisabledForCurrentDevice,
    fcmDebugToken,
    requestNotificationPermission,
    disablePushRegistrationForCurrentDevice,
    resetPushRegistrationOnSignOut,
  };
}
