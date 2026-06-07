import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import {
  FieldValue,
  getFirestore,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

const CONFIRM = process.argv.includes('--confirm');
const DRY_RUN = !CONFIRM;
const BATCH_WRITE_LIMIT = 450;
const SAMPLE_LIMIT = 30;

dotenv.config({ path: '.env.local' });
dotenv.config();

const db = initializeFirestore();

type UserCounterDiff = {
  uid: string;
  currentActiveDeliveryCount: number;
  nextActiveDeliveryCount: number;
  currentHelpedCount: number;
  nextHelpedCount: number;
};

function initializeFirestore(): Firestore {
  const clientConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let firestoreDatabaseId = '(default)';
  if (fs.existsSync(clientConfigPath)) {
    const clientConfig = JSON.parse(fs.readFileSync(clientConfigPath, 'utf-8'));
    firestoreDatabaseId = clientConfig.firestoreDatabaseId || '(default)';
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_FILE is required for the admin reconciliation script.');
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(readServiceAccount()),
    });
  }

  console.log(`Firestore database: ${firestoreDatabaseId}`);
  return getFirestore(firestoreDatabaseId);
}

function readServiceAccount(): object {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_FILE);
    return JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_FILE is required.');
  }

  try {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (error) {
    throw new Error([
      'FIREBASE_SERVICE_ACCOUNT must be a single-line JSON string.',
      'If you have a multi-line service account JSON file, set FIREBASE_SERVICE_ACCOUNT_FILE instead.',
      error instanceof Error ? error.message : String(error),
    ].join(' '));
  }
}

function numberField(doc: QueryDocumentSnapshot<FirebaseFirestore.DocumentData>, fieldName: string): number {
  const value = doc.data()[fieldName];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function incrementCount(map: Map<string, number>, uid: unknown) {
  if (typeof uid !== 'string' || uid.length === 0) return;
  map.set(uid, (map.get(uid) ?? 0) + 1);
}

async function activeDeliveryCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const snap = await db.collection('deliveries').where('status', '==', 'active').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.isExample === true || data.isAiRecipient === true) continue;
    incrementCount(counts, data.recipientUid);
  }
  return counts;
}

async function helpedCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const snap = await db
    .collection('feedbacks')
    .where('type', '==', 'like')
    .where('helpedCountApplied', '==', true)
    .get();
  for (const doc of snap.docs) {
    incrementCount(counts, doc.data().replierUid);
  }
  return counts;
}

async function collectDiffs(): Promise<UserCounterDiff[]> {
  const [usersSnap, activeCounts, helpedCountMap] = await Promise.all([
    db.collection('users').get(),
    activeDeliveryCounts(),
    helpedCounts(),
  ]);

  const diffs: UserCounterDiff[] = [];
  for (const userDoc of usersSnap.docs) {
    const currentActiveDeliveryCount = numberField(userDoc, 'activeDeliveryCount');
    const currentHelpedCount = numberField(userDoc, 'helpedCount');
    const nextActiveDeliveryCount = activeCounts.get(userDoc.id) ?? 0;
    const nextHelpedCount = helpedCountMap.get(userDoc.id) ?? 0;

    if (
      currentActiveDeliveryCount === nextActiveDeliveryCount
      && currentHelpedCount === nextHelpedCount
    ) {
      continue;
    }

    diffs.push({
      uid: userDoc.id,
      currentActiveDeliveryCount,
      nextActiveDeliveryCount,
      currentHelpedCount,
      nextHelpedCount,
    });
  }

  return diffs;
}

function printPlan(diffs: UserCounterDiff[]) {
  console.log(`Mode: ${DRY_RUN ? 'dry-run' : 'CONFIRM UPDATE'}`);
  console.log(`users with counter diffs: ${diffs.length}`);
  for (const diff of diffs.slice(0, SAMPLE_LIMIT)) {
    console.log([
      `  - ${diff.uid}`,
      `activeDeliveryCount ${diff.currentActiveDeliveryCount} -> ${diff.nextActiveDeliveryCount}`,
      `helpedCount ${diff.currentHelpedCount} -> ${diff.nextHelpedCount}`,
    ].join(' | '));
  }
  if (diffs.length > SAMPLE_LIMIT) {
    console.log(`  ... and ${diffs.length - SAMPLE_LIMIT} more`);
  }
}

async function applyDiffs(diffs: UserCounterDiff[]) {
  if (DRY_RUN) {
    console.log('[dry-run] no user counters were updated.');
    return;
  }

  let batch = db.batch();
  let pendingWrites = 0;
  let updatedCount = 0;
  for (const diff of diffs) {
    batch.set(db.collection('users').doc(diff.uid), {
      activeDeliveryCount: diff.nextActiveDeliveryCount,
      helpedCount: diff.nextHelpedCount,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    pendingWrites += 1;
    updatedCount += 1;

    if (pendingWrites >= BATCH_WRITE_LIMIT) {
      await batch.commit();
      console.log(`updated ${updatedCount}/${diffs.length} users`);
      batch = db.batch();
      pendingWrites = 0;
    }
  }

  if (pendingWrites > 0) {
    await batch.commit();
    console.log(`updated ${updatedCount}/${diffs.length} users`);
  }
}

async function run() {
  const diffs = await collectDiffs();
  printPlan(diffs);
  await applyDiffs(diffs);
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
