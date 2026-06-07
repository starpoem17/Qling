import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import {
  FieldPath,
  Timestamp,
  getFirestore,
  type DocumentReference,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

const CUTOFF = new Date('2026-06-04T17:00:00+09:00');
const FORCED_WORRY_IDS = [
  '8ryDcWBdU5fgAA3O11Gb',
  'aXmB7Hh4IvLbnyZCxvSx',
];
const CONFIRM = process.argv.includes('--confirm');
const DRY_RUN = !CONFIRM;
const QUERY_IN_LIMIT = 10;
const GET_ALL_LIMIT = 300;
const BATCH_DELETE_LIMIT = 450;
const SAMPLE_LIMIT = 20;

dotenv.config({ path: '.env.local' });
dotenv.config();

const db = initializeFirestore();

type AnyDoc = QueryDocumentSnapshot<FirebaseFirestore.DocumentData>;

type DeleteGroup = {
  label: string;
  refs: DocumentReference[];
  countOnly?: number;
};

function initializeFirestore(): Firestore {
  const clientConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let firestoreDatabaseId = '(default)';
  if (fs.existsSync(clientConfigPath)) {
    const clientConfig = JSON.parse(fs.readFileSync(clientConfigPath, 'utf-8'));
    firestoreDatabaseId = clientConfig.firestoreDatabaseId || '(default)';
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_FILE is required for the admin cleanup script.');
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

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0))];
}

function stringField(doc: AnyDoc, fieldName: string): string | null {
  const value = doc.data()[fieldName];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function uniqueRefs(refs: DocumentReference[]): DocumentReference[] {
  const seen = new Set<string>();
  const result: DocumentReference[] = [];
  for (const ref of refs) {
    if (seen.has(ref.path)) continue;
    seen.add(ref.path);
    result.push(ref);
  }
  return result;
}

async function docsByFieldIn(collectionName: string, fieldName: string, values: string[]): Promise<AnyDoc[]> {
  const docs: AnyDoc[] = [];
  for (const valuesChunk of chunk(uniqueStrings(values), QUERY_IN_LIMIT)) {
    if (valuesChunk.length === 0) continue;
    const snap = await db.collection(collectionName).where(fieldName, 'in', valuesChunk).get();
    docs.push(...snap.docs);
  }
  return docs;
}

async function docsByDocumentIds(collectionName: string, ids: string[]): Promise<AnyDoc[]> {
  const docs: AnyDoc[] = [];
  for (const idChunk of chunk(uniqueStrings(ids), GET_ALL_LIMIT)) {
    if (idChunk.length === 0) continue;
    const snap = await db
      .collection(collectionName)
      .where(FieldPath.documentId(), 'in', idChunk.slice(0, QUERY_IN_LIMIT))
      .get();
    docs.push(...snap.docs);

    for (const restChunk of chunk(idChunk.slice(QUERY_IN_LIMIT), QUERY_IN_LIMIT)) {
      if (restChunk.length === 0) continue;
      const restSnap = await db.collection(collectionName).where(FieldPath.documentId(), 'in', restChunk).get();
      docs.push(...restSnap.docs);
    }
  }
  return docs;
}

async function messageRefsForChats(chatDocs: AnyDoc[]): Promise<DocumentReference[]> {
  const refs: DocumentReference[] = [];
  for (const chatDoc of chatDocs) {
    const messagesSnap = await chatDoc.ref.collection('messages').get();
    refs.push(...messagesSnap.docs.map(doc => doc.ref));
  }
  return refs;
}

function readStateCandidateRefs(deliveryDocs: AnyDoc[], replyDocs: AnyDoc[]): DocumentReference[] {
  const refs: DocumentReference[] = [];
  for (const deliveryDoc of deliveryDocs) {
    const recipientUid = stringField(deliveryDoc, 'recipientUid');
    if (!recipientUid) continue;
    refs.push(db.collection('users').doc(recipientUid).collection('deliveryReadStates').doc(deliveryDoc.id));
  }
  for (const replyDoc of replyDocs) {
    const authorUid = stringField(replyDoc, 'authorUid');
    if (!authorUid) continue;
    refs.push(db.collection('users').doc(authorUid).collection('replyReadStates').doc(replyDoc.id));
  }
  return refs;
}

async function existingRefs(refs: DocumentReference[]): Promise<DocumentReference[]> {
  const existing: DocumentReference[] = [];
  for (const refsChunk of chunk(uniqueRefs(refs), GET_ALL_LIMIT)) {
    const docs = await db.getAll(...refsChunk);
    existing.push(...docs.filter(doc => doc.exists).map(doc => doc.ref));
  }
  return existing;
}

async function collectDeleteGroups(): Promise<DeleteGroup[]> {
  const cutoffTimestamp = Timestamp.fromDate(CUTOFF);
  const worriesSnap = await db
    .collection('worries')
    .where('createdAt', '<', cutoffTimestamp)
    .orderBy('createdAt', 'asc')
    .get();
  const cutoffWorryDocs = worriesSnap.docs.filter(doc => doc.data().isExample !== true);
  const forcedWorryDocs = await docsByDocumentIds('worries', FORCED_WORRY_IDS);
  const forcedWorryIds = new Set(forcedWorryDocs.map(doc => doc.id));
  const worryDocs = uniqueDocs([...cutoffWorryDocs, ...forcedWorryDocs]);
  const excludedExampleWorryCount = worriesSnap.docs
    .filter(doc => doc.data().isExample === true && !forcedWorryIds.has(doc.id))
    .length;
  const worryIds = worryDocs.map(doc => doc.id);

  const deliveryDocs = await docsByFieldIn('deliveries', 'worryId', worryIds);
  const deliveryIds = deliveryDocs.map(doc => doc.id);
  const replyDocs = await docsByFieldIn('replies', 'worryId', worryIds);
  const replyIds = replyDocs.map(doc => doc.id);
  const batchDocs = await docsByFieldIn('deliveryBatches', 'worryId', worryIds);
  const summaryFailureDocs = await docsByFieldIn('summaryFailureLogs', 'worryId', worryIds);

  const feedbackDocs = uniqueDocs([
    ...await docsByFieldIn('feedbacks', 'replyId', replyIds),
    ...await docsByFieldIn('feedbacks', 'worryId', worryIds),
    ...await docsByFieldIn('feedbacks', 'deliveryId', deliveryIds),
  ]);
  const feedbackIds = feedbackDocs.map(doc => doc.id);

  const chatDocs = uniqueDocs([
    ...await docsByFieldIn('chats', 'replyId', replyIds),
    ...await docsByFieldIn('chats', 'worryId', worryIds),
  ]);
  const chatIds = chatDocs.map(doc => doc.id);
  const chatMessageRefs = await messageRefsForChats(chatDocs);

  const chatContextJobDocs = await docsByFieldIn('chatContextModerationJobs', 'chatId', chatIds);
  const exampleFeedbackJobDocs = uniqueDocs([
    ...await docsByFieldIn('exampleFeedbackJobs', 'replyId', replyIds),
    ...await docsByDocumentIds('exampleFeedbackJobs', replyIds),
  ]);
  const passReplacementAttemptDocs = uniqueDocs([
    ...await docsByFieldIn('passReplacementAttempts', 'worryId', worryIds),
    ...await docsByFieldIn('passReplacementAttempts', 'passedDeliveryId', deliveryIds),
    ...await docsByFieldIn('passReplacementAttempts', 'createdDeliveryId', deliveryIds),
    ...await docsByDocumentIds('passReplacementAttempts', deliveryIds),
  ]);

  const pushLogDocs = await docsByFieldIn('pushLogs', 'sourceId', [
    ...worryIds,
    ...deliveryIds,
    ...replyIds,
    ...feedbackIds,
  ]);

  const directModerationLogIds = uniqueStrings([
    ...worryDocs.map(doc => stringField(doc, 'moderationLogId')),
    ...replyDocs.map(doc => stringField(doc, 'moderationLogId')),
    ...feedbackDocs.map(doc => stringField(doc, 'commentModerationLogId')),
    ...chatDocs.map(doc => stringField(doc, 'lastContextModerationLogId')),
    ...chatDocs.map(doc => stringField(doc, 'moderationBlockedLogId')),
  ]);
  const moderationLogDocs = uniqueDocs([
    ...await docsByFieldIn('moderationLogs', 'targetId', [
      ...worryIds,
      ...deliveryIds,
      ...replyIds,
      ...chatIds,
      ...feedbackIds,
    ]),
    ...await docsByDocumentIds('moderationLogs', directModerationLogIds),
  ]);
  const moderationLogIds = uniqueStrings([
    ...directModerationLogIds,
    ...moderationLogDocs.map(doc => doc.id),
  ]);

  const experienceSignalDocs = uniqueDocs([
    ...await docsByFieldIn('experienceSignals', 'worryId', worryIds),
    ...await docsByFieldIn('experienceSignals', 'deliveryId', deliveryIds),
    ...await docsByFieldIn('experienceSignals', 'replyId', replyIds),
    ...await docsByFieldIn('experienceSignals', 'feedbackId', feedbackIds),
    ...await docsByFieldIn('experienceSignals', 'moderationLogId', moderationLogIds),
  ]);
  const readStateDocs = await existingRefs(readStateCandidateRefs(deliveryDocs, replyDocs));

  return [
    { label: 'forced worries', refs: forcedWorryDocs.map(doc => doc.ref) },
    { label: 'excluded example worries', refs: [], countOnly: excludedExampleWorryCount },
    { label: 'chat messages', refs: chatMessageRefs },
    { label: 'chats', refs: chatDocs.map(doc => doc.ref) },
    { label: 'chatContextModerationJobs', refs: chatContextJobDocs.map(doc => doc.ref) },
    { label: 'exampleFeedbackJobs', refs: exampleFeedbackJobDocs.map(doc => doc.ref) },
    { label: 'passReplacementAttempts', refs: passReplacementAttemptDocs.map(doc => doc.ref) },
    { label: 'pushLogs', refs: pushLogDocs.map(doc => doc.ref) },
    { label: 'moderationLogs', refs: moderationLogDocs.map(doc => doc.ref) },
    { label: 'experienceSignals', refs: experienceSignalDocs.map(doc => doc.ref) },
    { label: 'read states', refs: readStateDocs },
    { label: 'feedbacks', refs: feedbackDocs.map(doc => doc.ref) },
    { label: 'replies', refs: replyDocs.map(doc => doc.ref) },
    { label: 'deliveries', refs: deliveryDocs.map(doc => doc.ref) },
    { label: 'deliveryBatches', refs: batchDocs.map(doc => doc.ref) },
    { label: 'summaryFailureLogs', refs: summaryFailureDocs.map(doc => doc.ref) },
    { label: 'matched worries', refs: worryDocs.map(doc => doc.ref) },
  ];
}

function uniqueDocs(docs: AnyDoc[]): AnyDoc[] {
  const seen = new Set<string>();
  const result: AnyDoc[] = [];
  for (const doc of docs) {
    if (seen.has(doc.ref.path)) continue;
    seen.add(doc.ref.path);
    result.push(doc);
  }
  return result;
}

function printPlan(groups: DeleteGroup[], refs: DocumentReference[]) {
  console.log(`Cutoff: ${CUTOFF.toISOString()} / KST before 2026-06-04 17:00:00`);
  console.log(`Mode: ${DRY_RUN ? 'dry-run' : 'CONFIRM DELETE'}`);
  console.log('delete plan:');
  for (const group of groups) {
    const count = typeof group.countOnly === 'number' ? group.countOnly : uniqueRefs(group.refs).length;
    console.log(`  ${group.label}: ${count}`);
  }
  console.log(`  total unique docs: ${refs.length}`);
  for (const ref of refs.slice(0, SAMPLE_LIMIT)) {
    console.log(`  - ${ref.path}`);
  }
  if (refs.length > SAMPLE_LIMIT) {
    console.log(`  ... and ${refs.length - SAMPLE_LIMIT} more`);
  }
}

async function commitDeletes(refs: DocumentReference[]) {
  if (DRY_RUN) {
    console.log('[dry-run] no documents were deleted.');
    return;
  }

  let deletedCount = 0;
  for (const refsChunk of chunk(refs, BATCH_DELETE_LIMIT)) {
    const batch = db.batch();
    for (const ref of refsChunk) {
      batch.delete(ref);
    }
    await batch.commit();
    deletedCount += refsChunk.length;
    console.log(`deleted ${deletedCount}/${refs.length} docs`);
  }
}

async function run() {
  const groups = await collectDeleteGroups();
  const refs = uniqueRefs(groups.flatMap(group => group.refs));
  printPlan(groups, refs);
  await commitDeletes(refs);
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
