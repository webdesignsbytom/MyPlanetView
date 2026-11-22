import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MapTipsDialog from '@/components/map/MapTipsDialog';
import { hasInstallOffer, installApp } from '@/utils/pwa/installPrompt';
import { phoneQueries, stubMatchMedia } from './helpers';

vi.mock('@/utils/pwa/installPrompt', () => ({
  hasInstallOffer: vi.fn(() => false),
  installApp: vi.fn(),
  subscribeInstallOffer: () => () => {},
}));

const open = (props = {}) => {
  const onClose = vi.fn();
  const onHideTips = vi.fn();
  render(<MapTipsDialog hideTips={false} onHideTips={onHideTips} posters onClose={onClose} {...props} />);
  const titles = [...document.querySelectorAll('[role="dialog"] li h3')].map((h) => h.textContent);
  return { onClose, onHideTips, titles };
};

describe('MapTipsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasInstallOffer.mockReturnValue(false);
  });

  it('gives a computer the countries and moving tips, mouse words', () => {
    stubMatchMedia((query) => query === '(hover: hover)');
    const { titles } = open();
    expect(titles).toEqual(['Countries', 'Moving around']);
    expect(screen.getByText(/Click a country to open its ticket/).textContent).toContain('Rest the pointer on one to see its poster.');
  });

  it('starts a phone with installing the app, in touch words', () => {
    stubMatchMedia(phoneQueries);
    const { titles } = open();
    expect(titles[0]).toBe('Install the app');
    expect(titles).toContain('Moving around');
    expect(screen.getByText(/Tap a country/)).toBeTruthy();
    // No offer from the browser: the browser's menu, and no button
    expect(screen.queryByText('Install the app', { selector: 'button' })).toBeNull();
  });

  it('installs from the browser’s offer, and says when it’s done', async () => {
    stubMatchMedia(phoneQueries);
    hasInstallOffer.mockReturnValue(true);
    installApp.mockResolvedValue(true);
    open();
    fireEvent.click(screen.getByText('Install the app', { selector: 'button' }));
    expect(await screen.findByText('Installed: it’s on your home screen.')).toBeTruthy();
  });

  it('gives no install tip in the installed app', () => {
    stubMatchMedia((query) => phoneQueries(query) || query === '(display-mode: standalone)');
    expect(open().titles).not.toContain('Install the app');
  });

  it('turns the tips off at once with its box, and closes with "Got it"', () => {
    stubMatchMedia(() => false);
    const { onHideTips, onClose } = open();
    fireEvent.click(screen.getByLabelText('Don’t show these tips again'));
    expect(onHideTips).toHaveBeenCalledWith(true);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Got it'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the box ticked once the tips are off', () => {
    stubMatchMedia(() => false);
    open({ hideTips: true });
    expect(screen.getByLabelText('Don’t show these tips again').checked).toBe(true);
  });
});
