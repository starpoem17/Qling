import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const presentationalScreenPath = path.join(
  process.cwd(),
  'src',
  'screens',
  'receivedWorries',
  'ReceivedWorriesScreen.tsx',
);
const containerPath = path.join(
  process.cwd(),
  'src',
  'screens',
  'receivedWorries',
  'ReceivedWorriesContainer.tsx',
);

const forbiddenImportSources = [
  'src/firebase',
  'firebase/',
  'server',
  'services/deliveries',
  'services/readState',
  'services/homeWorryFeed',
  'services/appShell',
] as const;

const allowedContainerServiceImports = [
  '../../services/deliveries/apiClient',
  '../../services/deliveries/uiPolicy',
  '../../services/homeWorryFeed',
  '../../services/readState/apiClient',
  '../../services/appShell/prdNavigationPolicy',
] as const;

function importedSources(source: string): string[] {
  const imports = source.matchAll(/import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g);
  return Array.from(imports, match => match[1] ?? '');
}

test('received-worries presentational screen has no forbidden production imports', () => {
  const source = fs.readFileSync(presentationalScreenPath, 'utf8');

  for (const importSource of importedSources(source)) {
    for (const forbidden of forbiddenImportSources) {
      assert.equal(
        importSource.includes(forbidden),
        false,
        `ReceivedWorriesScreen imports forbidden source ${importSource}`,
      );
    }
  }
});

test('received-worries container keeps service imports in the allowed boundary', () => {
  const source = fs.readFileSync(containerPath, 'utf8');
  const serviceImports = importedSources(source).filter(importSource => importSource.includes('../../services/'));

  assert.deepEqual(serviceImports.sort(), [...allowedContainerServiceImports].sort());
  assert.doesNotMatch(source, /firebase\/firestore|firestore\.rules|src\/server|server\.ts/);
});

test('received-worries top-left eye is presentational and my-page action is explicit', () => {
  const source = fs.readFileSync(presentationalScreenPath, 'utf8');
  const sharedHeaderSource = fs.readFileSync(path.join(process.cwd(), 'src/screens/shared/QlingPeekHeader.tsx'), 'utf8');

  assert.match(sharedHeaderSource, /role="presentation"/);
  assert.match(sharedHeaderSource, /aria-hidden="true"/);
  assert.match(sharedHeaderSource, /aria-label="마이페이지 열기"/);
  assert.match(source, /QlingPeekHeader/);
  assert.match(source, /onOpenMyPage=\{props\.onOpenMyPage\}/);
  assert.doesNotMatch(source, /10:46|status bar|battery|network|home indicator/);
});

test('received-worries presentational pass event emits only delivery id', () => {
  const source = fs.readFileSync(presentationalScreenPath, 'utf8');

  assert.match(source, /props\.onPass\(item\.deliveryId\)/);
  assert.doesNotMatch(source, /onPass\(event/);
});

test('received-worries presentational pass click is isolated from card body open', () => {
  const source = fs.readFileSync(presentationalScreenPath, 'utf8');

  assert.equal((source.match(/event\.stopPropagation\(\)/g) ?? []).length, 1);
  assert.match(source, /props\.onOpen\(\{ deliveryId: item\.deliveryId, worryId: item\.worryId \}\)/);
  assert.match(source, /props\.onPass\(item\.deliveryId\)/);
});

test('received-worries presentational screen has no pass confirmation modal or dialog', () => {
  const source = fs.readFileSync(presentationalScreenPath, 'utf8');

  assert.doesNotMatch(source, /confirm\(/);
  assert.doesNotMatch(source, /dialog/i);
  assert.doesNotMatch(source, /modal/i);
});

test('received-worries loading empty and privacy source stay PRD-scoped', () => {
  const source = fs.readFileSync(presentationalScreenPath, 'utf8');
  const contractSource = fs.readFileSync(path.join(process.cwd(), 'src/screens/receivedWorries/contract.ts'), 'utf8');

  assert.match(source, /FigmaTabLoading/);
  assert.doesNotMatch(source, /skeleton|placeholder/i);
  assert.match(source, /<EmptyState title=\{props\.state\.message\}/);
  for (const forbidden of ['nickname', 'gender', 'age', 'interests', 'senderUid', 'authorUid', 'publisher']) {
    assert.doesNotMatch(contractSource, new RegExp(`\\b${forbidden}\\b`), `contract includes forbidden privacy field ${forbidden}`);
  }
});

test('received-worries presentational pass disabled state is keyed by delivery id', () => {
  const source = fs.readFileSync(presentationalScreenPath, 'utf8');

  assert.match(source, /passingDeliveryIds\.has\(item\.deliveryId\)/);
  assert.match(source, /disabled=\{isPassing\}/);
});
