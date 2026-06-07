import type { ExampleWorrySeed, SelectedExampleSeed } from './types';

const MAX_EXAMPLES = 5;
export const EXAMPLE_FEEDBACK_DELAY_MS = 10 * 60 * 1000;

export function selectExampleSeeds(params: {
  seeds: ExampleWorrySeed[];
  interests: string[];
  maxCount?: number;
  order?: (seeds: ExampleWorrySeed[]) => ExampleWorrySeed[];
}): SelectedExampleSeed[] {
  const interests = new Set(params.interests.map(item => item.trim()).filter(Boolean));
  const seen = new Set<string>();
  const activeMatching = params.seeds.filter(seed => {
    if (seed.status !== 'active') return false;
    if (seen.has(seed.id)) return false;
    seen.add(seed.id);
    return seed.categories.some(category => interests.has(category));
  });
  const ordered = params.order ? params.order(activeMatching) : [...activeMatching].sort((a, b) => a.id.localeCompare(b.id));
  return ordered.slice(0, params.maxCount ?? MAX_EXAMPLES).map((seed, index) => ({
    ...seed,
    selectionIndex: index,
  }));
}

export function createExampleFeedbackRunAfter(params: {
  submittedAt: Date;
  delayMs?: number;
  random?: () => number;
}): Date {
  return new Date(params.submittedAt.getTime() + (params.delayMs ?? EXAMPLE_FEEDBACK_DELAY_MS));
}

export function buildExampleAutoLikeComment(): null {
  return null;
}
