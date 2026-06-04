import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';
import type { WorryCategory } from '@midnight-radio/domain';
import { createInitialExperienceProfile } from '../src/services/matching/server/experienceProfile';
import { mapInterestsToExperienceTopics } from '../src/services/matching/server/interestTopicMapping';
import { normalizeInterests } from '../src/services/userProfile/profileValidation';

const clientConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firestoreDatabaseId = '(default)';
if (fs.existsSync(clientConfigPath)) {
  const clientConfig = JSON.parse(fs.readFileSync(clientConfigPath, 'utf-8'));
  firestoreDatabaseId = clientConfig.firestoreDatabaseId || '(default)';
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT is required for the dev/admin backfill script.');
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = getFirestore(firestoreDatabaseId);
const apply = process.argv.includes('--apply');
const dryRun = !apply;
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) : null;
if (limit !== null && (!Number.isInteger(limit) || limit <= 0)) {
  throw new Error('--limit must be a positive integer, for example --limit=100');
}

async function run() {
  const usersSnap = await db.collection('users').get();
  let inspectedCount = 0;
  let skippedDeletedCount = 0;
  let skippedCompleteCount = 0;
  let updateCount = 0;
  let missingProfileStatusCount = 0;
  let missingExperienceProfileCount = 0;
  let noInterestCount = 0;
  const samples: Array<{
    uid: string;
    interests: string[];
    experienceTopics: string[];
    profileStatus: string;
  }> = [];
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of usersSnap.docs) {
    if (limit !== null && inspectedCount >= limit) break;
    inspectedCount += 1;
    const data = doc.data();
    if (data.deleted === true || data.status === 'deleted') {
      skippedDeletedCount += 1;
      continue;
    }
    if (data.profileStatus && data.experienceProfile) {
      skippedCompleteCount += 1;
      continue;
    }
    if (!data.profileStatus) missingProfileStatusCount += 1;
    if (!data.experienceProfile) missingExperienceProfileCount += 1;

    const interests = normalizeInterests(Array.isArray(data.interests) ? data.interests : []) as WorryCategory[];
    if (interests.length === 0) noInterestCount += 1;
    const experienceTopics = mapInterestsToExperienceTopics(interests);
    const experienceProfile = createInitialExperienceProfile(experienceTopics);
    const update = {
      profileStatus: data.profileStatus ?? 'cold_start',
      experienceProfile: data.experienceProfile ?? experienceProfile,
      updatedAt: FieldValue.serverTimestamp(),
    };

    updateCount += 1;
    if (samples.length < 10) {
      samples.push({
        uid: doc.id,
        interests,
        experienceTopics,
        profileStatus: update.profileStatus,
      });
    }
    if (dryRun) continue;

    batch.set(doc.ref, update, { merge: true });
    batchCount += 1;
    if (batchCount >= 400) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (!dryRun && batchCount > 0) {
    await batch.commit();
  }

  console.log(JSON.stringify({
    dryRun,
    apply,
    databaseId: firestoreDatabaseId,
    inspectedCount,
    skippedDeletedCount,
    skippedCompleteCount,
    updateCount,
    missingProfileStatusCount,
    missingExperienceProfileCount,
    noInterestCount,
    sampleCount: samples.length,
    samples,
  }, null, 2));
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
