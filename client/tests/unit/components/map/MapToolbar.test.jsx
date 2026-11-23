import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import MapToolbar from '@/components/map/MapToolbar';
import useFullscreen from '@/hooks/useFullscreen';
import { withProviders } from './helpers';

vi.mock('@/hooks/useFullscreen', () => ({ default: vi.fn() }));

const STATS = { countries: 8, continents: 2, photos: 16, specialPlaces: 0, regions: 1 };

function Where() {
  return <p data-where={useLocation().pathname} />;
}

const open = (props = {}) => {
  const onToggle = vi.fn();
  const onIntent = vi.fn();
  const result = render(
    withProviders(
      <>
        <MapToolbar openPanel={null} onToggle={onToggle} onIntent={onIntent} canShare canSwitch stats={STATS} {...props} />
        <Where />
      </>,
      { route: '/maps/m1' },
    ),
  );
  const nav = result.container.querySelector('nav');
  const row = nav.firstElementChild;
  const phone = nav.lastElementChild;
  const stamps = () => [...row.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));
  const toggle = () => phone.querySelector('button[aria-expanded]');
  const menu = () => document.getElementById(toggle().getAttribute('aria-controls'));
  const item = (label) => [...menu().querySelectorAll('button')].find((b) => b.textContent.includes(label));
  const where = () => result.container.querySelector('[data-where]').getAttribute('data-where');
  return { ...result, nav, row, phone, stamps, toggle, menu, item, where, onToggle, onIntent };
};

describe('MapToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFullscreen.mockReturnValue({ supported: false, active: false, toggle: vi.fn() });
  });

  it('is the map’s tools, fourteen stamps with Home on wide screens, Tips last', () => {
    const { nav, stamps } = open();
    expect(nav.getAttribute('aria-label')).toBe('Map tools');
    expect(stamps()).toEqual([
      'Home page',
      'Your maps',
      'Travel statistics',
      'Country list',
      'Trips',
      'Where to go next',
      'Timeline',
      'Badges and goals',
      // Life's One Shots (24 Nov 2026)
      'Life’s One Shots',
      'Play my world',
      'Photo album',
      'Share this map',
      'Map settings',
      'Tips',
    ]);
  });

  it('opens the tips from their stamp, pressed in while they show', () => {
    const { row, onToggle, onIntent } = open({ openPanel: 'tips' });
    const stamp = row.querySelector('[aria-label="Tips"]');
    expect(stamp.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(stamp);
    expect(onToggle).toHaveBeenCalledWith('tips');
    fireEvent.focus(stamp);
    expect(onIntent).toHaveBeenCalledWith('tips');
  });

  it('offers Strings after "Where to go next" to those who can tie them, and opens its panel', () => {
    const { stamps, onToggle, onIntent } = open({ canString: true });
    expect(stamps().slice(5, 8)).toEqual(['Where to go next', 'Strings', 'Timeline']);
    const stamp = [...document.querySelectorAll('nav button')].find((b) => b.getAttribute('aria-label') === 'Strings');
    fireEvent.click(stamp);
    expect(onToggle).toHaveBeenCalledWith('strings');
    fireEvent.mouseEnter(stamp);
    fireEvent.focus(stamp);
    expect(onIntent.mock.calls.some(([id]) => id === 'strings')).toBe(true);
    // Not for anyone else (the list above, without canString, has no Strings)
    expect(open({ canString: false }).stamps()).not.toContain('Strings');
  });

  it('leaves out "Your maps", sharing and Home when they don’t apply', () => {
    const { stamps } = open({ canShare: false, canSwitch: false, showHome: false });
    expect(stamps()).not.toContain('Your maps');
    expect(stamps()).not.toContain('Share this map');
    expect(stamps()).not.toContain('Home page');
    expect(stamps().length).toBe(11);
  });

  it('reads the map’s counts as the statistics stamp’s description', () => {
    const { row } = open();
    const stats = row.querySelector('[aria-label="Travel statistics"]');
    const description = document.getElementById(stats.getAttribute('aria-describedby'));
    expect(description.textContent).toMatch(/^8 countries, 2 continents, 16 photos\. Special places 0 of 5\. Regions 1 of \d+$/);
    const { row: plain } = open({ stats: null });
    expect(plain.querySelector('[aria-label="Travel statistics"]').hasAttribute('aria-describedby')).toBe(false);
  });

  it('opens a tool, presses the open one in, and fetches its code on intent', () => {
    const { row, onToggle, onIntent } = open({ openPanel: 'trips' });
    expect(row.querySelector('[aria-label="Trips"]').getAttribute('aria-pressed')).toBe('true');
    expect(row.querySelector('[aria-label="Timeline"]').getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(row.querySelector('[aria-label="Timeline"]'));
    expect(onToggle).toHaveBeenCalledWith('timeline');
    fireEvent.focus(row.querySelector('[aria-label="Map settings"]'));
    expect(onIntent).toHaveBeenCalledWith('settings');
  });

  it('goes home', () => {
    const { row, where } = open();
    fireEvent.click(row.querySelector('[aria-label="Home page"]'));
    expect(where()).toBe('/');
  });
});

describe('the phone’s menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFullscreen.mockReturnValue({ supported: false, active: false, toggle: vi.fn() });
  });

  it('is a disclosure: a round Menu stamp that shows and hides every tool', () => {
    const { toggle, menu } = open();
    expect(toggle().getAttribute('aria-label')).toBe('Menu');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(menu().hidden).toBe(true);
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(menu().hidden).toBe(false);
    const tools = [...menu().querySelectorAll('ul button')].map((b) => b.textContent);
    expect(tools).toEqual(['Your maps', 'Country list', 'Trips', 'Where to go next', 'Timeline', 'Badges and goals', 'Life’s One Shots', 'Play my world', 'Photo album', 'Share this map', 'Map settings', 'Tips']);
  });

  it('puts the statistics across the top, named by its label and described by the counts', () => {
    const { toggle, menu } = open();
    fireEvent.click(toggle());
    const stats = menu().firstElementChild;
    expect(stats.hasAttribute('aria-label')).toBe(false);
    expect(document.getElementById(stats.getAttribute('aria-labelledby')).textContent).toBe('Travel statistics');
    expect(document.getElementById(stats.getAttribute('aria-describedby')).textContent).toContain('8 countries');
    expect(stats.textContent).toContain('0/5');
  });

  it('opens the tool chosen, closing the menu with focus on its button', () => {
    const { toggle, menu, item, onToggle } = open();
    fireEvent.click(toggle());
    fireEvent.click(item('Photo album'));
    expect(onToggle).toHaveBeenCalledWith('photos');
    expect(menu().hidden).toBe(true);
    expect(document.activeElement).toBe(toggle());
  });

  it('presses in the open panel’s tool', () => {
    const { toggle, item } = open({ openPanel: 'countries' });
    fireEvent.click(toggle());
    expect(item('Country list').getAttribute('aria-pressed')).toBe('true');
    expect(item('Trips').getAttribute('aria-pressed')).toBe('false');
  });

  it('closes on Escape first, keeping the key from the map', () => {
    const outer = vi.fn();
    const { toggle, menu, item } = open();
    document.addEventListener('keydown', outer);
    try {
      fireEvent.click(toggle());
      fireEvent.keyDown(item('Trips'), { key: 'Escape' });
      expect(menu().hidden).toBe(true);
      expect(document.activeElement).toBe(toggle());
      expect(outer).not.toHaveBeenCalled();
      // Closed, Escape is the map's again
      fireEvent.keyDown(toggle(), { key: 'Escape' });
      expect(outer).toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', outer);
    }
  });

  it('closes on a press outside it', () => {
    const { toggle, menu, item } = open();
    fireEvent.click(toggle());
    fireEvent.pointerDown(item('Trips'));
    expect(menu().hidden).toBe(false);
    fireEvent.pointerDown(document.body);
    expect(menu().hidden).toBe(true);
  });

  it('has Home below the tools, and Full screen where the browser has it', () => {
    const fullscreen = { supported: true, active: false, toggle: vi.fn() };
    useFullscreen.mockReturnValue(fullscreen);
    const { toggle, item, where } = open();
    fireEvent.click(toggle());
    fireEvent.click(item('Full screen'));
    expect(fullscreen.toggle).toHaveBeenCalled();
    fireEvent.click(toggle());
    fireEvent.click(item('Home page'));
    expect(where()).toBe('/');
  });

  it('offers to leave full screen while it’s on', () => {
    useFullscreen.mockReturnValue({ supported: true, active: true, toggle: vi.fn() });
    const { toggle, item } = open();
    fireEvent.click(toggle());
    expect(item('Leave full screen')).toBeTruthy();
  });

  it('has no Full screen where the browser can’t', () => {
    const { toggle, menu } = open({ showHome: false });
    fireEvent.click(toggle());
    expect(menu().textContent).not.toContain('Full screen');
    expect(menu().textContent).not.toContain('Home page');
  });
});
