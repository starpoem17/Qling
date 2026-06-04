import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHighRiskBlockResult,
  shouldBlockHighRiskConcern,
} from './riskPolicy';

test('risk policy blocks only high risk concern analysis', () => {
  assert.equal(shouldBlockHighRiskConcern({ riskLevel: 'low' }), false);
  assert.equal(shouldBlockHighRiskConcern({ riskLevel: 'medium' }), false);
  assert.equal(shouldBlockHighRiskConcern({ riskLevel: 'high' }), true);
});

test('high risk block result includes user-facing safety guidance', () => {
  const result = buildHighRiskBlockResult();

  assert.equal(result.status, 'risk_blocked');
  assert.equal(result.code, 'high_risk');
  assert.ok(result.message.length > 0);
  assert.match(result.helpMessage, /119|112/);
  assert.match(result.helpMessage, /109/);
});
