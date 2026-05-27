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
  console.log('Fetching users to reset exampleWorriesCreatedAt flag...');
  const usersSnap = await db.collection('users').get();
  
  const batch = db.batch();
  let count = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (data.exampleWorriesCreatedAt) {
      batch.update(doc.ref, {
        exampleWorriesCreatedAt: FieldValue.delete(),
      });
      count++;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully reset exampleWorriesCreatedAt for ${count} existing users.`);
    console.log('Next time they open the app, it will automatically generate the new example worries based on their interests.');
  } else {
    console.log('No users needed resetting (or no users had the flag set).');
  }
}

run().catch(console.error);
