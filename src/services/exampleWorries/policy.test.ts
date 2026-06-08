import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExampleAutoLikeComment,
  createExampleFeedbackRunAfter,
  selectExampleSeeds,
} from './policy';
import { exampleWorrySeedFixtures } from './exampleSeedFixtures';
import type { ExampleWorrySeed } from './types';

function seed(id: string, categories: string[], status: 'active' | 'inactive' = 'active'): ExampleWorrySeed {
  return {
    id,
    content: id,
    summaryText: id,
    summaryStatus: 'original',
    summaryGeneratedBy: 'none',
    categories,
    status,
  };
}

test('selects active seeds whose categories intersect interests', () => {
  const selected = selectExampleSeeds({
    seeds: [
      seed('career', ['career']),
      seed('family', ['family']),
      seed('inactive', ['career'], 'inactive'),
      seed('empty', ['health']),
    ],
    interests: ['career', 'family'],
  });

  assert.deepEqual(selected.map(item => item.id), ['career', 'family']);
});

test('caps at five, creates fewer when fewer match, and removes duplicate seed ids', () => {
  const many = selectExampleSeeds({
    seeds: [
      seed('s1', ['career']),
      seed('s1', ['career']),
      seed('s2', ['career']),
      seed('s3', ['career']),
      seed('s4', ['career']),
      seed('s5', ['career']),
      seed('s6', ['career']),
    ],
    interests: ['career'],
  });
  const few = selectExampleSeeds({
    seeds: [seed('s1', ['career']), seed('s2', ['health'])],
    interests: ['career'],
  });

  assert.deepEqual(many.map(item => item.id), ['s1', 's2', 's3', 's4', 's5']);
  assert.deepEqual(few.map(item => item.id), ['s1']);
});

test('uses injected deterministic ordering', () => {
  const selected = selectExampleSeeds({
    seeds: [seed('b', ['career']), seed('a', ['career']), seed('c', ['career'])],
    interests: ['career'],
    order: seeds => [...seeds].reverse(),
  });

  assert.deepEqual(selected.map(item => item.id), ['c', 'a', 'b']);
  assert.deepEqual(selected.map(item => item.selectionIndex), [0, 1, 2]);
});

test('falls back to active example seeds when no seed category matches interests', () => {
  const selected = selectExampleSeeds({
    seeds: [
      seed('b', ['career']),
      seed('inactive', ['family'], 'inactive'),
      seed('a', ['health']),
      seed('c', ['study']),
    ],
    interests: ['unknown'],
  });

  assert.deepEqual(selected.map(item => item.id), ['a', 'b', 'c']);
  assert.deepEqual(selected.map(item => item.selectionIndex), [0, 1, 2]);
});

test('matching example seeds still take precedence over fallback seeds', () => {
  const selected = selectExampleSeeds({
    seeds: [
      seed('career', ['career']),
      seed('health', ['health']),
      seed('study', ['study']),
    ],
    interests: ['health'],
  });

  assert.deepEqual(selected.map(item => item.id), ['health']);
});

test('feedback delay is exactly ten minutes by default and auto comment is null', () => {
  const submittedAt = new Date('2026-05-13T00:00:00.000Z');
  const defaultRunAfter = createExampleFeedbackRunAfter({ submittedAt });
  const deterministic = createExampleFeedbackRunAfter({ submittedAt, random: () => 1 });
  const explicitDelay = createExampleFeedbackRunAfter({ submittedAt, delayMs: 60 * 1000 });

  assert.equal(defaultRunAfter.getTime() - submittedAt.getTime(), 10 * 60 * 1000);
  assert.equal(deterministic.getTime() - submittedAt.getTime(), 10 * 60 * 1000);
  assert.equal(explicitDelay.getTime() - submittedAt.getTime(), 60 * 1000);
  assert.equal(buildExampleAutoLikeComment(), null);
});

test('example seed fixtures include valid 50 character summary metadata', () => {
  assert.equal(exampleWorrySeedFixtures.length, 47);

  for (const seed of exampleWorrySeedFixtures) {
    assert.ok(seed.summaryText.trim(), `${seed.id} summaryText is required`);
    assert.ok(Array.from(seed.summaryText).length <= 50, `${seed.id} summaryText is over 50 characters`);

    if (Array.from(seed.content).length <= 50) {
      assert.equal(seed.summaryText, seed.content, `${seed.id} should use original content as summary`);
      assert.equal(seed.summaryStatus, 'original', `${seed.id} should be original`);
      assert.equal(seed.summaryGeneratedBy, 'none', `${seed.id} should not be LLM generated`);
    } else {
      assert.equal(seed.summaryStatus, 'llm_generated', `${seed.id} should be LLM generated`);
      assert.equal(seed.summaryGeneratedBy, 'llm', `${seed.id} should store LLM generatedBy`);
    }
  }
});
