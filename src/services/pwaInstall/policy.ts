export type PwaInstallCapabilityInput = {
  readonly hasBeforeInstallPrompt: boolean;
  readonly canShare: boolean;
  readonly canWriteClipboard: boolean;
  readonly isIosSafari: boolean;
};

export type PwaInstallGuidance = 'android-install' | 'ios-share-to-home' | 'share-url-or-qr' | 'unsupported';

export function mapPwaInstallCapability(input: PwaInstallCapabilityInput): {
  readonly canInstall: boolean;
  readonly canShare: boolean;
  readonly platformGuidance: PwaInstallGuidance;
} {
  if (input.hasBeforeInstallPrompt) {
    return {
      canInstall: true,
      canShare: input.canShare || input.canWriteClipboard,
      platformGuidance: 'android-install',
    };
  }

  if (input.isIosSafari) {
    return {
      canInstall: false,
      canShare: input.canShare || input.canWriteClipboard,
      platformGuidance: 'ios-share-to-home',
    };
  }

  if (input.canShare || input.canWriteClipboard) {
    return {
      canInstall: false,
      canShare: true,
      platformGuidance: 'share-url-or-qr',
    };
  }

  return {
    canInstall: false,
    canShare: false,
    platformGuidance: 'unsupported',
  };
}
