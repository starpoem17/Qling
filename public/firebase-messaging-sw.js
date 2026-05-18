importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// [Qling] FCM Service Worker Config
firebase.initializeApp({
  apiKey: "AIzaSyBmdlpPtjyKntCCjy52ItRzAU4f8FZHk-A",
  authDomain: "qling-hyu.firebaseapp.com",
  projectId: "qling-hyu",
  storageBucket: "qling-hyu.firebasestorage.app",
  messagingSenderId: "576941881401",
  appId: "1:576941881401:web:50232374b29f0d44c735e8"
});

const messaging = firebase.messaging();
const DEFAULT_NOTIFICATION_TITLE = '📻 Qling';
const DEFAULT_NOTIFICATION_BODY = '새로운 소식이 도착했습니다.';
const DEFAULT_NOTIFICATION_URL = '/';

function normalizeNotificationUrl(candidateUrl) {
  try {
    return new URL(candidateUrl || DEFAULT_NOTIFICATION_URL, self.location.origin).toString();
  } catch {
    return new URL(DEFAULT_NOTIFICATION_URL, self.location.origin).toString();
  }
}

// Fallback-only background notification handler.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || DEFAULT_NOTIFICATION_TITLE;
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || DEFAULT_NOTIFICATION_BODY,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'qling-notification',
    renotify: true,
    requireInteraction: true,
    data: { url: normalizeNotificationUrl(payload.data?.url) }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const targetUrl = normalizeNotificationUrl(event.notification.data?.url);
    const windowClients = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    const exactClient = windowClients.find((client) => client.url === targetUrl);
    if (exactClient) {
      await exactClient.focus();
      return;
    }

    const sameOriginClient = windowClients.find((client) => {
      try {
        return new URL(client.url).origin === self.location.origin;
      } catch {
        return false;
      }
    });

    if (sameOriginClient) {
      if (typeof sameOriginClient.navigate === 'function') {
        await sameOriginClient.navigate(targetUrl);
      }
      await sameOriginClient.focus();
      return;
    }

    await clients.openWindow(targetUrl);
  })());
});
