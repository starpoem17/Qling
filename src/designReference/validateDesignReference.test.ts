import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { validateDesignReferenceMap } from '../../scripts/validateDesignReference.mjs';

function loadMap() {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'design/reference/screen-map.json'), 'utf8'));
}

function cloneMap() {
  return structuredClone(loadMap());
}

function validate(map: unknown) {
  return validateDesignReferenceMap(map, { root: process.cwd() });
}

function assertFailsWith(map: unknown, pattern: RegExp) {
  const result = validate(map);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), pattern);
}

test('design reference validator accepts the checked-in screen map', () => {
  const result = validate(loadMap());

  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.screenCount, 19);
  assert.equal(result.pngCount, 19);
});

test('design reference validator rejects missing reference PNGs', () => {
  const map = cloneMap();
  map.screens[0].reference.screenshots[0] = 'design/reference/pngs/screens/01-missing.png';

  assertFailsWith(map, new RegExp('missing reference PNG: design/reference/pngs/screens/01-missing\\.png'));
});

test('design reference validator rejects missing production files', () => {
  const map = cloneMap();
  map.screens[5].production.screen = 'src/screens/receivedWorries/MissingScreen.tsx';

  assertFailsWith(map, new RegExp('production\\.screen: points to a missing path: src/screens/receivedWorries/MissingScreen\\.tsx'));
});

test('design reference validator rejects wildcard misuse outside guardrails', () => {
  const map = cloneMap();
  map.screens[5].production.mapping = 'src/screens/receivedWorries/*.ts';

  assertFailsWith(map, /production\.mapping: must not contain wildcard/);
});

test('design reference validator rejects screen 11 as required production mapping', () => {
  const map = cloneMap();
  map.screens.push({
    id: '11',
    slug: 'screen-11',
    reference: {
      screenshots: ['design/reference/pngs/screens/01-splash.png']
    },
    production: {
      screen: 'src/screens/loadingShell/LoadingShellScreen.tsx',
      container: null,
      contract: 'src/screens/loadingShell/contract.ts',
      mapping: null
    },
    sharedDependencies: ['src/screens/shared/ui.tsx'],
    allowedEditScope: ['src/screens/shared/ui.tsx'],
    mustNotEditForPixelWork: ['src/services/**'],
    statesToCheck: ['misuse'],
    notes: {
      previewOnly: 'fixture misuse'
    },
    verification: {
      commands: ['npm run validate:design-reference']
    }
  });

  assertFailsWith(map, /screen 11 must live only in unusedScreens/);
});

test('design reference validator rejects legacy screenshots paths', () => {
  const map = cloneMap();
  map.screens[0].reference.screenshots[0] = 'design/reference/screenshots/splash.png';

  assertFailsWith(map, new RegExp('legacy screenshot path is forbidden|must start with design/reference/pngs/screens/'));
});
