import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createProductionPushRegistrationAdapters, isInstalledPWA } from './adapters';
import { createPushRegistrationLifecycle } from './internalLifecycle';
import type { PushRegistrationStatus, PushRegistrationUser } from './types';

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
  const pushRegistrationStatusRef = useRef(pushRegistrationStatus);
  const installedPwaAttemptedUidRef = useRef<string | null>(null);

  useEffect(() => {
    pushRegistrationStatusRef.current = pushRegistrationStatus;
  }, [pushRegistrationStatus]);

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
      if (user) {
        localStorage.removeItem(`qling_push_disabled_${user.uid}`);
      }
      return lifecycle.requestNotificationPermission(user);
    },
    [lifecycle, user]
  );

  const resetPushRegistrationOnSignOut = useCallback(async () => {
    if (user) {
      localStorage.setItem(`qling_push_disabled_${user.uid}`, 'true');
    }
    await lifecycle.cleanupStoredPushToken();
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
        if (localStorage.getItem(`qling_push_disabled_${user.uid}`) === 'true') {
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

    if (localStorage.getItem(`qling_push_disabled_${user.uid}`) === 'true') {
      return;
    }

    void lifecycle.maybeRecoverPushRegistration(user, 'signed-in-stable');
  }, [user, loading, notificationPermission, lifecycle]);

  useEffect(() => {
    if (!user || loading || notificationPermission !== 'granted' || !isInstalledPWA()) {
      return;
    }

    if (localStorage.getItem(`qling_push_disabled_${user.uid}`) === 'true') {
      return;
    }

    if (installedPwaAttemptedUidRef.current === user.uid) {
      return;
    }

    installedPwaAttemptedUidRef.current = user.uid;
    void lifecycle.maybeRecoverPushRegistration(user, 'installed-pwa-initial');
  }, [user, loading, notificationPermission, lifecycle]);

  return {
    notificationPermission,
    pushRegistrationStatus,
    fcmDebugToken,
    requestNotificationPermission,
    resetPushRegistrationOnSignOut,
  };
}
