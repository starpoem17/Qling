import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldRenderFilterAlert } from './filterAlertPolicy';

test('suppresses chat room creation progress popup copy', () => {
  assert.equal(shouldRenderFilterAlert('채팅방을 생성하고 있습니다'), false);
  assert.equal(shouldRenderFilterAlert('잠시만 기다려 주세요. 채팅방을 생성하고 있습니다.'), false);
});

test('keeps actionable chat creation failure alerts visible', () => {
  assert.equal(shouldRenderFilterAlert('채팅방 생성에 실패했습니다.'), true);
  assert.equal(shouldRenderFilterAlert('네트워크 오류가 발생했습니다.'), true);
  assert.equal(shouldRenderFilterAlert(null), false);
});
