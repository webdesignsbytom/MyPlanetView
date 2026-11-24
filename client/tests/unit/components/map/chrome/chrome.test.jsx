import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SlideAway from '@/components/map/chrome/SlideAway';
import MenusTab from '@/components/map/chrome/MenusTab';
import { MapChromeContext } from '@/hooks/useMapChrome';

// The map page's menus slid out of the way (25 Nov 2026, the user's wish): the tab on the
// toolbar, and each piece leaving by its closest side.

const withMenus = (hidden, ui) => <MapChromeContext.Provider value={{ hidden, show: () => {} }}>{ui}</MapChromeContext.Provider>;

describe('SlideAway', () => {
  // jsdom lays nothing out: each piece says where it is
  const place = (rect) => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top });
  beforeEach(() => {
    window.innerWidth = 1920;
    window.innerHeight = 1080;
  });
  afterEach(() => vi.restoreAllMocks());

  it('stays put, and in reach, while the menus show', () => {
    const { container } = render(withMenus(false, <SlideAway className='absolute right-3'>Tools</SlideAway>));
    const piece = container.firstElementChild;
    expect(piece.getAttribute('class')).toContain('absolute right-3');
    expect(piece.style.transform).toBe('');
    expect(piece.hasAttribute('inert')).toBe(false);
    expect(piece.hasAttribute('data-slid-away')).toBe(false);
  });

  it('slides off by its closest side when they’re hidden, out of the keyboard’s way, and back', () => {
    place({ left: 1750, top: 960, width: 158, height: 108 });
    const { container, rerender } = render(withMenus(true, <SlideAway className='absolute bottom-3 right-3'>Zoom</SlideAway>));
    const piece = container.firstElementChild;
    expect(piece.getAttribute('data-slid-away')).toBe('bottom');
    expect(piece.style.transform).toBe(`translate(0px, ${1080 - 960 + 24}px)`);
    expect(piece.hasAttribute('inert')).toBe(true);
    // Animated, unless the viewer asked for less motion
    expect(piece.getAttribute('class')).toContain('motion-safe:transition-transform');
    rerender(withMenus(false, <SlideAway className='absolute bottom-3 right-3'>Zoom</SlideAway>));
    expect(piece.style.transform).toBe('');
    expect(piece.hasAttribute('inert')).toBe(false);
  });

  it('can go by a side it’s told and stay in reach (the toolbar, whose tab stays on screen)', () => {
    place({ left: 1848, top: 12, width: 60, height: 800 });
    const { container } = render(
      withMenus(
        true,
        <SlideAway toward='right' margin={0} interactive>
          Tools
        </SlideAway>,
      ),
    );
    const piece = container.firstElementChild;
    expect(piece.style.transform).toBe('translate(72px, 0px)');
    expect(piece.hasAttribute('inert')).toBe(false);
  });

  it('takes its way out from the part it’s told to measure (a centred panel in a wrapper the size of the screen)', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
      return this.hasAttribute('data-map-panel')
        ? { left: 500, top: 100, width: 900, height: 300, right: 1400, bottom: 400 }
        : { left: 96, top: 72, width: 1728, height: 936, right: 1824, bottom: 1008 };
    });
    const { container } = render(
      withMenus(
        true,
        <SlideAway measure='[data-map-panel]'>
          <section data-map-panel=''>A panel</section>
        </SlideAway>,
      ),
    );
    expect(container.firstElementChild.getAttribute('data-slid-away')).toBe('top');
    expect(container.firstElementChild.style.transform).toBe('translate(0px, -424px)');
  });
});

describe('MenusTab', () => {
  it('hides the menus, then shows them, its arrow and name following', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<MenusTab hidden={false} onToggle={onToggle} />);
    const tab = screen.getByLabelText('Hide the menus');
    expect(tab.getAttribute('aria-pressed')).toBe('false');
    expect(tab.getAttribute('data-menus-tab')).toBe('shown');
    // On the toolbar's left edge, half way down; wide screens only
    expect(tab.getAttribute('class')).toContain('right-[calc(100%-2px)]');
    // A slim tab: a browser's tab on its side, flaring from the toolbar, the same top and bottom
    expect(tab.getAttribute('class')).toContain('w-5');
    for (const layer of ['[data-tab-edge]', '[data-tab-paper]']) {
      const outline = /path\('(.+)'\)/.exec(tab.querySelector(layer).style.clipPath)[1];
      const ys = outline.match(/-?\d+(?:\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1);
      expect(ys.map((y) => Math.round((64 - y) * 100) / 100).sort((a, b) => a - b)).toEqual([...ys].sort((a, b) => a - b));
    }
    // In the toolbar's own paper and edge, which follow the map's style: never an SVG, whose
    // colours the map's styles set back to the poster's (25 Nov 2026, the user's report)
    expect(tab.querySelector('[data-tab-paper]').getAttribute('class')).toContain('paper-aged-side');
    expect(tab.querySelector('[data-tab-edge]').getAttribute('class')).toContain('bg-poster-brown');
    expect(tab.querySelectorAll('svg')).toHaveLength(1);
    fireEvent.click(tab);
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<MenusTab hidden onToggle={onToggle} />);
    expect(screen.getByLabelText('Show the menus').getAttribute('aria-pressed')).toBe('true');
  });
});
