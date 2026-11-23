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

// The tip showing, and the stamps that choose one (one per tip)
const showing = () => document.querySelector('[data-tip]').getAttribute('data-tip');
const heading = () => document.querySelector('[data-tip] h3').textContent;
const dots = () => [...document.querySelectorAll('[aria-label="Choose a tip"] button')];

const open = (props = {}) => {
  const onClose = vi.fn();
  const onHideTips = vi.fn();
  render(<MapTipsDialog hideTips={false} onHideTips={onHideTips} posters onClose={onClose} {...props} />);
  // Every tip's title, from the stamps' names ("Tip 2: Moving around")
  const titles = dots().map((b) => b.getAttribute('aria-label').replace(/^Tip \d+: /, ''));
  return { onClose, onHideTips, titles };
};

describe('MapTipsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasInstallOffer.mockReturnValue(false);
  });

  it('gives a computer its tips in mouse words, one at a time from the first', () => {
    stubMatchMedia((query) => query === '(hover: hover)');
    const { titles } = open();
    expect(titles).toEqual(['Countries', 'A country’s own map', 'Moving around', 'The map’s tools']);
    expect(showing()).toBe('countries');
    expect(screen.getByText('Tip 1 of 4')).toBeTruthy();
    expect(screen.getByText(/Click a country to open its ticket/).textContent).toContain('Rest the pointer on one to see its poster.');
    // Only the one showing is in the page
    expect(document.querySelectorAll('[data-tip]').length).toBe(1);
  });

  it('turns with Previous and Next, and the last one’s Next is "Got it", which closes them', () => {
    stubMatchMedia(() => false);
    const { onClose } = open();
    const previous = screen.getByLabelText('Previous tip');
    expect(previous.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Next tip'));
    expect(showing()).toBe('countryMap');
    expect(screen.getByText('Tip 2 of 4')).toBeTruthy();
    expect(screen.getByLabelText('Previous tip').disabled).toBe(false);
    fireEvent.click(screen.getByLabelText('Previous tip'));
    expect(showing()).toBe('countries');
    // To the end: no Next there, but "Got it"
    fireEvent.click(screen.getByLabelText('Next tip'));
    fireEvent.click(screen.getByLabelText('Next tip'));
    fireEvent.click(screen.getByLabelText('Next tip'));
    expect(heading()).toBe('The map’s tools');
    expect(screen.queryByLabelText('Next tip')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Got it'));
    expect(onClose).toHaveBeenCalled();
  });

  it('jumps to a tip from its stamp, which marks the one showing', () => {
    stubMatchMedia(() => false);
    open();
    expect(dots()[0].getAttribute('aria-current')).toBe('step');
    fireEvent.click(screen.getByLabelText('Tip 3: Moving around'));
    expect(showing()).toBe('moving');
    expect(dots()[2].getAttribute('aria-current')).toBe('step');
    expect(dots()[0].hasAttribute('aria-current')).toBe(false);
  });

  it('turns with the arrow keys from anywhere in it, never past either end, and leaves the box’s keys alone', () => {
    stubMatchMedia(() => false);
    open();
    const tip = document.querySelector('[data-tip]');
    fireEvent.keyDown(tip, { key: 'ArrowLeft' });
    expect(showing()).toBe('countries');
    // Focus starts on the close stamp, outside the tip
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close');
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(showing()).toBe('countryMap');
    for (let i = 0; i < 5; i += 1) fireEvent.keyDown(document.querySelector('[data-tip]'), { key: 'ArrowRight' });
    expect(showing()).toBe('tools');
    fireEvent.keyDown(screen.getByLabelText('Don’t show these tips again'), { key: 'ArrowLeft' });
    expect(showing()).toBe('tools');
  });

  it('ends with sharing, no app or account needed, for those who can share the map', () => {
    stubMatchMedia(() => false);
    const { titles } = open({ share: true });
    expect(titles.at(-1)).toBe('Share your map');
    fireEvent.click(screen.getByLabelText(`Tip ${titles.length}: Share your map`));
    expect(screen.getByText(/no app to install and no account needed/)).toBeTruthy();
  });

  it('starts a phone with installing the app, in touch words', () => {
    stubMatchMedia(phoneQueries);
    const { titles } = open();
    expect(titles[0]).toBe('Install the app');
    expect(titles).toContain('Moving around');
    expect(showing()).toBe('install');
    // No offer from the browser: the browser's menu, and no button
    expect(screen.queryByText('Install the app', { selector: 'button' })).toBeNull();
    fireEvent.click(screen.getByLabelText(`Tip ${titles.indexOf('Countries') + 1}: Countries`));
    expect(screen.getByText(/Tap a country/)).toBeTruthy();
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

  it('turns the tips off at once with its box, without closing', () => {
    stubMatchMedia(() => false);
    const { onHideTips, onClose } = open();
    fireEvent.click(screen.getByLabelText('Don’t show these tips again'));
    expect(onHideTips).toHaveBeenCalledWith(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows the box ticked once the tips are off', () => {
    stubMatchMedia(() => false);
    open({ hideTips: true });
    expect(screen.getByLabelText('Don’t show these tips again').checked).toBe(true);
  });
});
