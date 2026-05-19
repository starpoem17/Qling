import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_MAP_PATH = 'design/reference/screen-map.json';
const REQUIRED_REFERENCE_IDS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
const REFERENCE_ROOT = 'design/reference/pngs/screens/';
const LEGACY_SCREENSHOT_ROOT = 'design/reference/screenshots/';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasWildcard(value) {
  return typeof value === 'string' && value.includes('*');
}

function isScreen11(value) {
  return value === 11 || value === '11' || value === 'screen-11' || value === 'screen 11';
}

function pathExists(pathValue, root, exists = existsSync) {
  return exists(resolve(root, pathValue));
}

function addPathError(errors, context, message) {
  errors.push(`${context}: ${message}`);
}

function validateTrackedPath(pathValue, context, options) {
  const { root, errors, allowNull = false, allowWildcard = false, mustExist = true } = options;

  if (pathValue === null) {
    if (!allowNull) addPathError(errors, context, 'must not be null.');
    return;
  }
  if (pathValue === undefined) {
    addPathError(errors, context, 'is required.');
    return;
  }
  if (typeof pathValue !== 'string' || pathValue.trim() === '') {
    addPathError(errors, context, 'must be a non-empty string when present.');
    return;
  }
  if (pathValue.includes(LEGACY_SCREENSHOT_ROOT)) {
    addPathError(errors, context, `must not use legacy ${LEGACY_SCREENSHOT_ROOT} paths: ${pathValue}`);
  }
  if (hasWildcard(pathValue) && !allowWildcard) {
    addPathError(errors, context, `must not contain wildcard '*': ${pathValue}`);
    return;
  }
  if (!hasWildcard(pathValue) && mustExist && !pathExists(pathValue, root, options.exists)) {
    addPathError(errors, context, `points to a missing path: ${pathValue}`);
  }
}

function validateStringArray(value, context, options) {
  if (!Array.isArray(value) || value.length === 0) {
    options.errors.push(`${context} must be a non-empty array.`);
    return [];
  }

  value.forEach((entry, index) => {
    validateTrackedPath(entry, `${context}[${index}]`, options);
  });
  return value;
}

function validateReferenceScreenshots(screen, label, state) {
  const screenshots = screen.reference?.screenshots;
  if (!Array.isArray(screenshots) || screenshots.length === 0) {
    state.errors.push(`${label}.reference.screenshots must be a non-empty array for reference-backed screens.`);
    return [];
  }

  for (const [index, screenshot] of screenshots.entries()) {
    const context = `${label}.reference.screenshots[${index}]`;
    if (typeof screenshot !== 'string') {
      state.errors.push(`${context}: must be a string.`);
      continue;
    }
    if (screenshot.includes(LEGACY_SCREENSHOT_ROOT)) {
      state.errors.push(`${context}: legacy screenshot path is forbidden: ${screenshot}`);
    }
    if (!screenshot.startsWith(REFERENCE_ROOT)) {
      state.errors.push(`${context}: must start with ${REFERENCE_ROOT}: ${screenshot}`);
    }
    if (!screenshot.endsWith('.png')) {
      state.errors.push(`${context}: must end with .png: ${screenshot}`);
    }
    if (hasWildcard(screenshot)) {
      state.errors.push(`${context}: wildcard is forbidden in reference PNG paths: ${screenshot}`);
      continue;
    }
    if (!pathExists(screenshot, state.root, state.exists)) {
      state.errors.push(`${context}: missing reference PNG: ${screenshot}`);
    }
  }

  return screenshots.filter(pathValue => typeof pathValue === 'string');
}

function validateProduction(screen, label, state) {
  if (!isObject(screen.production)) {
    state.errors.push(`${label}.production must be an object.`);
    return;
  }

  validateTrackedPath(screen.production.screen, `${label}.production.screen`, { ...state, allowNull: false, allowWildcard: false });
  validateTrackedPath(screen.production.container, `${label}.production.container`, { ...state, allowNull: true, allowWildcard: false });
  validateTrackedPath(screen.production.contract, `${label}.production.contract`, { ...state, allowNull: false, allowWildcard: false });
  validateTrackedPath(screen.production.mapping, `${label}.production.mapping`, { ...state, allowNull: true, allowWildcard: false });
}

function validateUnusedScreens(map, state) {
  if (!Array.isArray(map.unusedScreens) || map.unusedScreens.length === 0) {
    state.errors.push('unusedScreens must contain screen 11 as no-reference/unused.');
    return;
  }

  const screen11Entries = map.unusedScreens.filter(entry => isObject(entry) && isScreen11(entry.id));
  if (screen11Entries.length !== 1) {
    state.errors.push('unusedScreens must contain exactly one screen 11 entry.');
    return;
  }

  const screen11 = screen11Entries[0];
  if (screen11.status !== 'unused') {
    state.errors.push('unusedScreens[screen 11].status must be "unused".');
  }
  if (Array.isArray(screen11.reference?.screenshots) && screen11.reference.screenshots.length > 0) {
    state.errors.push('unusedScreens[screen 11].reference.screenshots must stay empty/absent.');
  }
  const production = screen11.production;
  if (isObject(production) && ['screen', 'container', 'contract', 'mapping'].some(field => production[field])) {
    state.errors.push('unusedScreens[screen 11].production must not contain route/screen/container/contract/mapping paths.');
  }
}

export function validateDesignReferenceMap(map, options = {}) {
  const state = {
    root: options.root ?? process.cwd(),
    exists: options.exists ?? existsSync,
    errors: []
  };
  const seenIds = new Set();
  const seenPngs = new Set();

  if (!isObject(map)) {
    return { ok: false, errors: ['screen-map root must be an object.'], screenCount: 0, pngCount: 0 };
  }

  if (map.referenceRoot !== 'design/reference/pngs/screens') {
    state.errors.push('referenceRoot must be design/reference/pngs/screens.');
  }
  if (map.sourceOfTruth?.prd !== 'docs/PRD.md') {
    state.errors.push('sourceOfTruth.prd must be docs/PRD.md.');
  }
  if (map.sourceOfTruth?.designPngs !== 'design/reference/pngs/screens/*.png') {
    state.errors.push('sourceOfTruth.designPngs must be design/reference/pngs/screens/*.png.');
  }
  if (typeof map.sourceOfTruth?.note !== 'string' || !map.sourceOfTruth.note.includes('preview-only')) {
    state.errors.push('sourceOfTruth.note must state that reference fixtures are preview-only hints.');
  }
  if (!Array.isArray(map.previewOnlySources) || map.previewOnlySources.length === 0) {
    state.errors.push('previewOnlySources must be a non-empty array.');
  } else {
    const previewPaths = new Set();
    map.previewOnlySources.forEach((source, index) => {
      if (!isObject(source)) {
        state.errors.push(`previewOnlySources[${index}] must be an object.`);
        return;
      }
      previewPaths.add(source.path);
      validateTrackedPath(source.path, `previewOnlySources[${index}].path`, { ...state, allowWildcard: false });
      if (typeof source.scope !== 'string' || !source.scope.includes('preview')) {
        state.errors.push(`previewOnlySources[${index}].scope must identify preview-only scope.`);
      }
      if (typeof source.note !== 'string' || !source.note.includes('production')) {
        state.errors.push(`previewOnlySources[${index}].note must distinguish preview fixture from production source.`);
      }
    });
    if (!previewPaths.has('design/reference/src')) {
      state.errors.push('previewOnlySources must include design/reference/src when that fixture exists.');
    }
  }

  validateUnusedScreens(map, state);

  if (!Array.isArray(map.screens) || map.screens.length === 0) {
    state.errors.push('screens must be a non-empty array.');
  } else {
    for (const [index, screen] of map.screens.entries()) {
      const label = `screens[${index}]${screen?.id ? `(${screen.id})` : ''}`;
      if (!isObject(screen)) {
        state.errors.push(`screens[${index}] must be an object.`);
        continue;
      }

      if (isScreen11(screen.id) || isScreen11(screen.number) || screen.slug === '11' || screen.slug === 'screen-11' || screen.slug === 'no-reference') {
        state.errors.push(`${label}: screen 11 must live only in unusedScreens and must not be a reference-backed screen.`);
      }

      if (typeof screen.id !== 'string' || !/^\d{2}$/.test(screen.id)) {
        state.errors.push(`${label}.id must be a zero-padded string like "01".`);
      } else {
        if (seenIds.has(screen.id)) state.errors.push(`${label}.id duplicates screen ${screen.id}.`);
        seenIds.add(screen.id);
      }
      if (typeof screen.slug !== 'string' || screen.slug.trim() === '') {
        state.errors.push(`${label}.slug must be a non-empty string.`);
      }

      const screenshots = validateReferenceScreenshots(screen, label, state);
      screenshots.forEach(pathValue => seenPngs.add(pathValue));

      if (Array.isArray(screen.reference?.css)) {
        screen.reference.css.forEach((pathValue, pathIndex) => {
          validateTrackedPath(pathValue, `${label}.reference.css[${pathIndex}]`, { ...state, allowWildcard: false });
        });
      }

      validateProduction(screen, label, state);
      validateStringArray(screen.sharedDependencies, `${label}.sharedDependencies`, { ...state, allowWildcard: false });
      validateStringArray(screen.allowedEditScope, `${label}.allowedEditScope`, { ...state, allowWildcard: false });
      validateStringArray(screen.mustNotEditForPixelWork, `${label}.mustNotEditForPixelWork`, { ...state, allowWildcard: true, mustExist: false });

      if (!Array.isArray(screen.statesToCheck) || screen.statesToCheck.length === 0 || screen.statesToCheck.some(stateValue => typeof stateValue !== 'string' || stateValue.trim() === '')) {
        state.errors.push(`${label}.statesToCheck must contain at least one non-empty string.`);
      }
      if (!Array.isArray(screen.verification?.commands) || !screen.verification.commands.includes('npm run validate:design-reference')) {
        state.errors.push(`${label}.verification.commands must include npm run validate:design-reference.`);
      }
      if (typeof screen.notes?.previewOnly !== 'string' || !screen.notes.previewOnly.includes('fixture')) {
        state.errors.push(`${label}.notes.previewOnly must identify reference fixture limitations.`);
      }
    }
  }

  for (const id of REQUIRED_REFERENCE_IDS) {
    if (!seenIds.has(id)) state.errors.push(`screens is missing required reference-backed screen ${id}.`);
  }
  for (const id of seenIds) {
    if (!REQUIRED_REFERENCE_IDS.includes(id)) state.errors.push(`screens contains unexpected reference-backed screen ${id}.`);
  }

  return {
    ok: state.errors.length === 0,
    errors: state.errors,
    screenCount: seenIds.size,
    pngCount: seenPngs.size
  };
}

export function loadDesignReferenceMap(mapPath = DEFAULT_MAP_PATH, root = process.cwd()) {
  return JSON.parse(readFileSync(resolve(root, mapPath), 'utf8'));
}

function runCli() {
  let parsed;
  try {
    parsed = loadDesignReferenceMap(DEFAULT_MAP_PATH, process.cwd());
  } catch (error) {
    console.error('Design reference validation failed:');
    console.error(`- ${DEFAULT_MAP_PATH} is not valid JSON: ${error.message}`);
    process.exit(1);
  }

  const result = validateDesignReferenceMap(parsed, { root: process.cwd() });
  if (!result.ok) {
    console.error('Design reference validation failed:');
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Design reference validation passed for ${result.screenCount} screen mappings and ${result.pngCount} reference PNGs.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
