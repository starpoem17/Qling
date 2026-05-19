import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const presentationalScreenFiles = [
  path.join(process.cwd(), 'src', 'screens', 'writeForm', 'WriteFormScreen.tsx'),
  path.join(process.cwd(), 'src', 'screens', 'writeForm', 'WriteReplySuccessScreen.tsx'),
  path.join(process.cwd(), 'src', 'screens', 'writeForm', 'WriteWorryScreen.tsx'),
  path.join(process.cwd(), 'src', 'screens', 'writeForm', 'WriteWorrySuccessScreen.tsx'),
] as const;

const forbiddenImportSources = [
  'src/firebase',
  'firebase/',
  'firebase-admin/',
  'firebase/firestore',
  'firebase/auth',
  'firebase/messaging',
  'services/worryPublication',
  'services/replyPublication',
  'services/drafts',
  'services/validation',
  'services/appShell',
  'src/server',
  'server/',
] as const;

function importedSources(source: string): string[] {
  const imports = source.matchAll(/import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g);
  return Array.from(imports, match => match[1] ?? '');
}

test('write-form presentational screen files have no forbidden production imports', () => {
  for (const file of presentationalScreenFiles) {
    const source = fs.readFileSync(file, 'utf8');

    for (const importSource of importedSources(source)) {
      for (const forbidden of forbiddenImportSources) {
        assert.equal(
          importSource.includes(forbidden),
          false,
          `${path.relative(process.cwd(), file)} imports forbidden source ${importSource}`,
        );
      }
    }
  }
});

test('write-form presentational screen emits draft and publish events only', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'writeForm', 'WriteWorryScreen.tsx'), 'utf8');

  assert.match(source, /props\.onDraftChange/);
  assert.match(source, /onClick=\{props\.onPublish\}/);
  assert.doesNotMatch(source, /validateDraftContent|publishWorryViaApi|publishReplyViaApi|setDraft|clearDraft/);
});

test('write-worry success screen exposes only confirm intent', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'writeForm', 'WriteWorrySuccessScreen.tsx'), 'utf8');

  assert.match(source, /onConfirm=\{props\.onConfirm\}/);
  assert.doesNotMatch(source, /setView|routeAfterWorrySuccessConfirmation|filterAlert|publishWorryViaApi/);
});

test('write-reply success screen exposes only confirm intent', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'screens', 'writeForm', 'WriteReplySuccessScreen.tsx'), 'utf8');

  assert.match(source, /onConfirm=\{props\.onConfirm\}/);
  assert.doesNotMatch(source, /setView|routeAfterReplySuccessConfirmation|filterAlert|publishReplyViaApi/);
});
