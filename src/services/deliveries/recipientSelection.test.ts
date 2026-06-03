import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPassReplacementCandidates } from './recipientSelection';

test('pass replacement selection excludes pass-specific users and normal ineligible candidates', () => {
  const selected = selectPassReplacementCandidates({
    author: { uid: 'author', gender: 'female' },
    matchingCategories: ['취업'],
    excludedUids: new Set(['passer', 'previousRecipient', 'previousPasser', 'replier']),
    random: () => 0,
    candidates: [
      { uid: 'author', gender: 'female', interests: ['취업'] },
      { uid: 'passer', gender: 'female', interests: ['취업'] },
      { uid: 'previousRecipient', gender: 'female', interests: ['취업'] },
      { uid: 'previousPasser', gender: 'female', interests: ['취업'] },
      { uid: 'replier', gender: 'female', interests: ['취업'] },
      { uid: 'deleted', deleted: true, gender: 'female', interests: ['취업'] },
      { uid: 'inactive', inactive: true, gender: 'female', interests: ['취업'] },
      { uid: 'disabled', disabled: true, gender: 'female', interests: ['취업'] },
      { uid: 'bot_1', gender: 'female', interests: ['취업'] },
      { uid: 'overLimit', activeDeliveryCount: 10, gender: 'female', interests: ['취업'] },
      { uid: 'eligible', gender: 'female', interests: ['취업'], activeDeliveryCount: 9 },
      { uid: 'missingDeleted', gender: 'female', interests: ['취업'], activeDeliveryCount: 0 },
    ],
  });

  assert.deepEqual(selected.map(candidate => candidate.uid), ['eligible', 'missingDeleted']);
});

test('pass replacement ranks matched candidates by overlap helped count gender and random tie breaker', () => {
  const selected = selectPassReplacementCandidates({
    author: { uid: 'author', gender: 'female' },
    matchingCategories: ['취업', '가족'],
    excludedUids: new Set(),
    random: (() => {
      const values = [0.9, 0.2, 0.1, 0.8];
      return () => values.shift() ?? 0;
    })(),
    candidates: [
      { uid: 'oneOverlap', gender: 'female', interests: ['취업'], helpedCount: 100 },
      { uid: 'twoOverlapLowHelped', gender: 'male', interests: ['취업', '가족'], helpedCount: 1 },
      { uid: 'twoOverlapHighHelped', gender: 'male', interests: ['취업', '가족'], helpedCount: 2 },
      { uid: 'twoOverlapSameGender', gender: 'female', interests: ['취업', '가족'], helpedCount: 2 },
    ],
  });

  assert.deepEqual(selected.map(candidate => candidate.uid), [
    'twoOverlapSameGender',
    'twoOverlapHighHelped',
    'twoOverlapLowHelped',
    'oneOverlap',
  ]);
});
