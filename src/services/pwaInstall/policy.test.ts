import test from 'node:test';
import assert from 'node:assert/strict';
import { mapPwaInstallCapability } from './policy';

test('PWA capability mapping prefers real Android install prompt when available', () => {
  assert.deepEqual(mapPwaInstallCapability({
    hasBeforeInstallPrompt: true,
    canShare: false,
    canWriteClipboard: false,
    isIosSafari: false,
  }), {
    canInstall: true,
    canShare: false,
    platformGuidance: 'android-install',
  });
});

test('PWA capability mapping exposes iOS share-to-home guidance for iOS Safari', () => {
  assert.equal(mapPwaInstallCapability({
    hasBeforeInstallPrompt: false,
    canShare: true,
    canWriteClipboard: false,
    isIosSafari: true,
  }).platformGuidance, 'ios-share-to-home');
});

test('PWA capability mapping falls back to URL or QR sharing when share targets exist', () => {
  assert.deepEqual(mapPwaInstallCapability({
    hasBeforeInstallPrompt: false,
    canShare: false,
    canWriteClipboard: true,
    isIosSafari: false,
  }), {
    canInstall: false,
    canShare: true,
    platformGuidance: 'share-url-or-qr',
  });
});

test('PWA capability mapping has a safe unsupported state', () => {
  assert.deepEqual(mapPwaInstallCapability({
    hasBeforeInstallPrompt: false,
    canShare: false,
    canWriteClipboard: false,
    isIosSafari: false,
  }), {
    canInstall: false,
    canShare: false,
    platformGuidance: 'unsupported',
  });
});
