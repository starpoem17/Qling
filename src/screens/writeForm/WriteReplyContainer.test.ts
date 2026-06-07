import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/screens/writeForm/WriteReplyContainer.tsx', 'utf8');

test('WriteReplyContainer returns the write form screen without an unheighted wrapper', () => {
  assert.doesNotMatch(source, /return\s*\(\s*<div>\s*<WriteFormScreen/);
  assert.match(source, /return\s*\(\s*<WriteFormScreen[\s\S]*kind="write-reply"/);
});
