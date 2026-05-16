import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const screenRoot = path.join(process.cwd(), 'src', 'screens');

function listContractFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listContractFiles(fullPath);
    return entry.name === 'contract.ts' ? [fullPath] : [];
  });
}

const forbiddenImportSources = [
  'src/' + 'fire' + 'base',
  'fire' + 'base/',
  'fire' + 'base-admin/',
  'fire' + 'base/fire' + 'store',
  'fire' + 'base/' + 'au' + 'th',
  'fire' + 'base/' + 'mess' + 'aging',
  'src/services/',
  'server.ts',
  'src/server/',
  'apiClient',
  'production',
  'deleteMyAccount' + 'ViaApi',
  'push' + 'Registration',
  'read' + 'State',
  'publishWorry' + 'ViaApi',
  'publishReply' + 'ViaApi',
  'submitReply' + 'Feedback',
  'passDelivery' + 'ViaApi',
] as const;

function importedSources(source: string): string[] {
  const imports = source.matchAll(/import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g);
  return Array.from(imports, match => match[1] ?? '');
}

test('screen contract modules do not import provider, API, or service internals', () => {
  const files = listContractFiles(screenRoot);

  assert.ok(files.length >= 7, 'expected Phase 4 contract files');

  for (const file of files) {
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

test('screen contract modules remain contract-only and avoid design-only chrome fields', () => {
  const files = listContractFiles(screenRoot);
  const combined = files.map(file => fs.readFileSync(file, 'utf8')).join('\n');

  assert.doesNotMatch(combined, /React\.|JSX|useEffect|useState/);
  assert.doesNotMatch(combined, /statusBar|homeIndicator|delayMs/);
  assert.equal(combined.includes('\ub77c\ubbf8'), false);
  assert.equal(combined.includes('Lor' + 'em'), false);
  assert.equal(combined.includes('lor' + 'em'), false);
});
