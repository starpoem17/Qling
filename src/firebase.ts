import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
// @ts-ignore
import firebaseConfig from '@/firebase-applet-config.json';

export const isDevRuntime = typeof import.meta.env !== 'undefined' && import.meta.env.DEV;

export const firebaseRuntimeConfig = {
  projectId: firebaseConfig.projectId,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export function logFirestoreListenerError(label: string, error: unknown) {
  const firebaseError = error as { code?: unknown; message?: unknown };
  console.error(label, {
    code: typeof firebaseError.code === 'string' ? firebaseError.code : 'unknown',
    message: typeof firebaseError.message === 'string' ? firebaseError.message : String(error),
    error,
  });
}

if (isDevRuntime) {
  console.info('[Firebase diagnostics] runtime config', firebaseRuntimeConfig);
}

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
