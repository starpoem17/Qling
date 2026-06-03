import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_WORRY_CATEGORY,
  WORRY_CATEGORIES,
  WORRY_CATEGORY_SET,
  normalizeWorryCategories,
} from './index';

test('domain categories use the Figma onboarding vocabulary', () => {
  assert.deepEqual(WORRY_CATEGORIES, [
    '진로',
    '취업',
    '직장',
    '학업',
    '시험',
    '경제',
    '연애',
    '결혼',
    '가족',
    '인간관계',
    '육아',
    '건강',
    '외모',
    '군대',
    '미래',
    '일상',
  ]);
  assert.equal(DEFAULT_WORRY_CATEGORY, '일상');
  assert.ok(WORRY_CATEGORY_SET.has('일상'));
  assert.equal((WORRY_CATEGORIES as readonly string[]).includes('워라밸'), false);
});

test('legacy categories normalize to current categories with daily fallback', () => {
  assert.deepEqual(normalizeWorryCategories(['워라밸', '소득', '없는값']), ['직장', '경제']);
  assert.deepEqual(normalizeWorryCategories(['없는값']), ['일상']);
  assert.deepEqual(normalizeWorryCategories(['없는값'], { fallback: false }), []);
  assert.deepEqual(normalizeWorryCategories([]), []);
});
