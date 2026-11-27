import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import MapToolbar from '@/components/map/MapToolbar';
import useFullscreen from '@/hooks/useFullscreen';
import { stubMatchMedia, withProviders } from './helpers';

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
  const item = (label) => [...menu().querySelectorAll('button, a')].find((b) => b.textContent.includes(label));
  const where = () => result.container.querySelector('[data-where]').getAttribute('data-where');
  return { ...result, nav, row, phone, stamps, toggle, menu, item, where, onToggle, onIntent };
};

describe('MapToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFullscreen.mockReturnValue({ supported: false, active: false, toggle: vi.fn() });
  });

  // 24 Nov 2026, the user's wish: a shorter bar ("Play my world" in the photo album, "Tips" in
  // Settings, "Strings" in the country list)
  it('is the map’s tools, twelve stamps with Home on wide screens, Settings last', () => {
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
      'Photo album',
      'Share this map',
      'Map settings',
    ]);
  });

  it('has no “Play my world” or “Tips” stamp: the photo album and Settings have them', () => {
    const { row } = open();
    expect(row.querySelector('[aria-label="Play my world"]')).toBeNull();
    expect(row.querySelector('[aria-label="Tips"]')).toBeNull();
  });

  // 24 Nov 2026, the user's wish: its panel opens from the country list (CountryListPanel)
  it('has no Strings stamp, even for an editor', () => {
    const { row, stamps } = open({ canString: true });
    expect(stamps()).not.toContain('Strings');
    expect(row.querySelector('[aria-label="Strings"]')).toBeNull();
  });

  // 25 Nov 2026, the user's wish: a problem, an idea or a question, for anyone signed in
  it('has a Feedback stamp before Settings, only when asked for', () => {
    const { stamps, row, onToggle } = open({ canFeedback: true });
    expect(stamps().slice(-2)).toEqual(['Feedback', 'Map settings']);
    fireEvent.click(row.querySelector('[aria-label="Feedback"]'));
    expect(onToggle).toHaveBeenCalledWith('feedback');
    const { stamps: without } = open({ canFeedback: false });
    expect(without()).not.toContain('Feedback');
  });

  it('leaves out "Your maps", sharing and Home when they don’t apply', () => {
    const { stamps } = open({ canShare: false, canSwitch: false, showHome: false });
    expect(stamps()).not.toContain('Your maps');
    expect(stamps()).not.toContain('Share this map');
    expect(stamps()).not.toContain('Home page');
    expect(stamps().length).toBe(9);
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

  // Over the whole screen since 27 Nov 2026 (the user's wish), as a modal dialog
  it('is a round Menu stamp that opens every tool over the whole screen, as a dialog named Menu', () => {
    const { toggle, menu } = open();
    expect(toggle().getAttribute('aria-label')).toBe('Menu');
    expect(toggle().getAttribute('aria-haspopup')).toBe('dialog');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(menu().tagName).toBe('DIALOG');
    expect(menu().hasAttribute('open')).toBe(false);
    expect(menu().className).toContain('fixed inset-0');
    expect(menu().className).toContain('h-dvh');
    expect(document.getElementById(menu().getAttribute('aria-labelledby')).textContent).toBe('Menu');
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(menu().hasAttribute('open')).toBe(true);
    const tools = [...menu().querySelectorAll('ul button')].map((b) => b.textContent);
    expect(tools).toEqual(['Your maps', 'Country list', 'Trips', 'Where to go next', 'Timeline', 'Badges and goals', 'Life’s One Shots', 'Photo album', 'Share this map', 'Map settings']);
  });

  it('opens as a modal dialog where the browser has them, and shuts it again', () => {
    const showModal = vi.fn(function showModal() {
      this.setAttribute('open', '');
    });
    const close = vi.fn(function close() {
      this.removeAttribute('open');
    });
    const proto = window.HTMLDialogElement.prototype;
    proto.showModal = showModal;
    proto.close = close;
    try {
      const { toggle, menu } = open();
      fireEvent.click(toggle());
      expect(showModal).toHaveBeenCalledTimes(1);
      expect(menu().hasAttribute('open')).toBe(true);
      fireEvent.click(menu().querySelector('[aria-label="Close the menu"]'));
      expect(close).toHaveBeenCalled();
      expect(menu().hasAttribute('open')).toBe(false);
    } finally {
      delete proto.showModal;
      delete proto.close;
    }
  });

  it('has a close stamp at the top right, where focus starts, and shuts with focus back on Menu', () => {
    const { toggle, menu } = open();
    fireEvent.click(toggle());
    const close = menu().querySelector('[data-menu-close] button');
    expect(close.getAttribute('aria-label')).toBe('Close the menu');
    expect(document.activeElement).toBe(close);
    // The header's last cell: after the menu's name, before the statistics and the tools
    const header = close.closest('[data-menu-close]').parentElement;
    expect(header.firstElementChild.textContent).toBe('Menu');
    expect(header.lastElementChild.contains(close)).toBe(true);
    expect(header.className).toContain('pr-2.5');
    fireEvent.click(close);
    expect(menu().hasAttribute('open')).toBe(false);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle());
  });

  it('shuts on a close request (a phone’s back button)', () => {
    const { toggle, menu } = open();
    fireEvent.click(toggle());
    const cancel = new Event('cancel', { cancelable: true });
    act(() => {
      menu().dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(menu().hasAttribute('open')).toBe(false);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('shuts when the screen turns wide, where the menu isn’t shown', () => {
    const media = stubMatchMedia(() => false);
    const { toggle, menu } = open();
    fireEvent.click(toggle());
    expect(menu().hasAttribute('open')).toBe(true);
    act(() => media.change((query) => query.includes('min-width')));
    expect(menu().hasAttribute('open')).toBe(false);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  // 27 Nov 2026, the user's wish: the full-screen menu has the room
  it('has “View passport” after the photo album, a link to the map’s passport that shuts the menu', () => {
    const { toggle, menu, item, where } = open({ passportHref: '/maps/m1/passport' });
    fireEvent.click(toggle());
    const names = [...menu().querySelectorAll('ul li')].map((li) => li.textContent);
    expect(names.slice(names.indexOf('Photo album'), names.indexOf('Photo album') + 2)).toEqual(['Photo album', 'View passport']);
    const passport = item('View passport');
    expect(passport.tagName).toBe('A');
    expect(passport.getAttribute('href')).toBe('/maps/m1/passport');
    fireEvent.click(passport);
    expect(menu().hasAttribute('open')).toBe(false);
    expect(where()).toBe('/maps/m1/passport');
  });

  it('has no passport without one, and none on the wide bar', () => {
    const { toggle, menu, stamps } = open();
    fireEvent.click(toggle());
    expect(menu().textContent).not.toContain('View passport');
    const { stamps: withPassport } = open({ passportHref: '/maps/m1/passport' });
    expect(withPassport()).not.toContain('View passport');
    expect(stamps()).not.toContain('View passport');
  });

  it('puts the statistics across the top, named by its label and described by the counts', () => {
    const { toggle, menu } = open();
    fireEvent.click(toggle());
    const stats = menu().querySelector('[aria-labelledby$="-label"]');
    expect(stats.tagName).toBe('BUTTON');
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
    expect(menu().hasAttribute('open')).toBe(false);
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
      expect(menu().hasAttribute('open')).toBe(false);
      expect(document.activeElement).toBe(toggle());
      expect(outer).not.toHaveBeenCalled();
      // Closed, Escape is the map's again
      fireEvent.keyDown(toggle(), { key: 'Escape' });
      expect(outer).toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', outer);
    }
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
