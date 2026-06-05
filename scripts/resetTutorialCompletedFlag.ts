import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

const clientConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firestoreDatabaseId = '(default)';
if (fs.existsSync(clientConfigPath)) {
  const clientConfig = JSON.parse(fs.readFileSync(clientConfigPath, 'utf-8'));
  firestoreDatabaseId = clientConfig.firestoreDatabaseId || '(default)';
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT is required for the dev/admin script.');
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = getFirestore(firestoreDatabaseId);

async function run() {
  console.log('Fetching users to reset tutorialCompletedAt flag...');
  const usersSnap = await db.collection('users').get();

  let batch = db.batch();
  let pendingWrites = 0;
  let count = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (!('tutorialCompletedAt' in data)) continue;

    batch.update(doc.ref, {
      tutorialCompletedAt: FieldValue.delete(),
    });
    pendingWrites++;
    count++;

    if (pendingWrites === 450) {
      await batch.commit();
      batch = db.batch();
      pendingWrites = 0;
    }
  }

  if (pendingWrites > 0) {
    await batch.commit();
  }

  if (count > 0) {
    console.log(`Successfully reset tutorialCompletedAt for ${count} existing users.`);
  } else {
    console.log('No users needed resetting.');
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
