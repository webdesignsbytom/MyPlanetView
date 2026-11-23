import { beforeEach, describe, expect, it, vi } from 'vitest';

// The module keeps the offer and its listeners: each test loads it afresh
let prompt;
beforeEach(async () => {
  vi.resetModules();
  prompt = await import('@/utils/pwa/installPrompt');
});

const offerEvent = (outcome = 'accepted') => {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  event.prompt = vi.fn().mockResolvedValue();
  event.userChoice = Promise.resolve({ outcome });
  return event;
};

describe('installPrompt', () => {
  it('has no offer until the browser makes one', async () => {
    expect(prompt.hasInstallOffer()).toBe(false);
    expect(await prompt.installApp()).toBe(false);
  });

  it('keeps the browser’s offer, holding its own banner back, and says so', () => {
    prompt.listenForInstallOffer();
    const listener = vi.fn();
    const stop = prompt.subscribeInstallOffer(listener);
    const event = offerEvent();
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(prompt.hasInstallOffer()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    window.dispatchEvent(offerEvent());
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('shows the browser’s prompt once, and says whether it was accepted', async () => {
    prompt.listenForInstallOffer();
    const event = offerEvent('accepted');
    window.dispatchEvent(event);
    const listener = vi.fn();
    prompt.subscribeInstallOffer(listener);
    expect(await prompt.installApp()).toBe(true);
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(prompt.hasInstallOffer()).toBe(false);
    expect(listener).toHaveBeenCalled();
    expect(await prompt.installApp()).toBe(false);
  });

  it('gives false when the person declines', async () => {
    prompt.listenForInstallOffer();
    window.dispatchEvent(offerEvent('dismissed'));
    expect(await prompt.installApp()).toBe(false);
  });

  it('forgets the offer once the app is installed', () => {
    prompt.listenForInstallOffer();
    window.dispatchEvent(offerEvent());
    window.dispatchEvent(new Event('appinstalled'));
    expect(prompt.hasInstallOffer()).toBe(false);
  });
});
