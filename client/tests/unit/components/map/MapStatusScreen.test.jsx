import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import MapStatusScreen from '@/components/map/MapStatusScreen';
import StampLoading from '@/components/map/StampLoading';
import MapBackground from '@/components/map/MapBackground';
import MapDesignStyle from '@/components/map/MapDesignStyle';
import { LOADING_STAMPS } from '@/components/common/passportStampArt';
import { createValueStore } from '@/utils/map/valueStore';
import { withProviders } from './helpers';

afterEach(() => vi.useRealTimers());

describe('MapStatusScreen', () => {
  it('is the page’s main while loading, saying so over the stamps', () => {
    const { container } = render(withProviders(<MapStatusScreen loading />));
    const main = container.querySelector('main#main-content');
    expect(main).not.toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Loading…');
    expect(main.hasAttribute('data-map-style')).toBe(false);
    // The page's hidden h1 while it loads, named by the page
    expect(container.querySelector('h1.sr-only').textContent).toBe('Opening the map');
    render(withProviders(<MapStatusScreen loading heading='Opening the shared map' />));
    expect([...document.querySelectorAll('h1')].map((h) => h.textContent)).toContain('Opening the shared map');
  });

  it('is a layer of its own over the map, which the tests wait on', () => {
    const { container } = render(withProviders(<MapStatusScreen loading overlay title='Opening the map…' />));
    expect(container.querySelector('main')).toBeNull();
    expect(container.querySelector('[data-map-loading]').getAttribute('class')).toContain('fixed');
    expect(screen.getByRole('status').textContent).toBe('Opening the map…');
    // The map page under it already has its h1
    expect(container.querySelector('h1')).toBeNull();
  });

  it('says when the map can’t open, with a way home', () => {
    const { container } = render(withProviders(<MapStatusScreen title='Map not found' message='It may have been deleted.' />));
    expect(container.querySelector('h1').textContent).toBe('Map not found');
    expect(screen.getByText('It may have been deleted.')).toBeTruthy();
    expect(container.querySelector('a').getAttribute('href')).toBe('/');
  });

  it('takes its own way out', () => {
    render(withProviders(<MapStatusScreen title='Sign in'><a href='/login'>Sign in</a></MapStatusScreen>));
    expect(screen.queryByText('Back to the home page')).toBeNull();
  });

  it('is in the viewer’s map style from the start, and puts it on the page', () => {
    const { container, unmount } = render(withProviders(<MapStatusScreen loading styleId='starry' />));
    expect(container.querySelector('main').getAttribute('data-map-style')).toBe('starry');
    expect(document.documentElement.getAttribute('data-map-theme')).toBe('starry');
    unmount();
    expect(document.documentElement.hasAttribute('data-map-theme')).toBe(false);
    // An unknown style is the standard one
    const { container: other } = render(withProviders(<MapStatusScreen loading styleId='galaxy' />));
    expect(other.querySelector('main').getAttribute('data-map-style')).toBe('animated');
  });
});

describe('StampLoading', () => {
  const designs = (container) => [...container.querySelectorAll('svg[viewBox="-160 -120 320 240"]')];

  it('presses one stamp at once and another every 0.38 s, never the same one twice on screen', () => {
    vi.useFakeTimers();
    // A fresh run, after the last screen's pause
    vi.setSystemTime(new Date('2026-11-23T10:00:00Z'));
    const { container } = render(<StampLoading />);
    expect(container.firstChild.getAttribute('aria-hidden')).toBe('true');
    expect(designs(container).length).toBe(1);
    act(() => {
      vi.advanceTimersByTime(380 * 4);
    });
    expect(designs(container).length).toBe(5);
    act(() => {
      vi.advanceTimersByTime(380 * (LOADING_STAMPS.length + 10));
    });
    // At most one of each: a stamp's earlier copy goes as it's pressed again
    expect(designs(container).length).toBe(LOADING_STAMPS.length);
  });

  it('carries on where the screen before left off, within a moment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T11:00:00Z'));
    const first = render(<StampLoading />);
    act(() => {
      vi.advanceTimersByTime(380 * 3);
    });
    first.unmount();
    // 0.86 s after the screen before closed (its three stamps took the clock to 11:00:01.14)
    vi.setSystemTime(new Date('2026-11-23T11:00:02Z'));
    const { container } = render(<StampLoading />);
    expect(designs(container).length).toBe(4);
  });

  // A clock that went back since the screen before (the real clock's clean-up, a time change)
  // starts afresh: a negative gap counted as "a moment ago" kept the old stamps for ever
  it('starts afresh when the clock has gone back since the screen before', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));
    const first = render(<StampLoading />);
    act(() => {
      vi.advanceTimersByTime(380 * 3);
    });
    first.unmount();
    vi.setSystemTime(new Date('2026-11-23T11:59:00Z'));
    const { container } = render(<StampLoading />);
    expect(designs(container).length).toBe(1);
  });
});

describe('MapBackground', () => {
  it('shows a design’s picture over the sea', () => {
    const { container } = render(<MapBackground styleId='animated' animatedSea pictureUrl='https://x/sea.webp' />);
    const box = container.querySelector('[data-design-picture]');
    expect(box.querySelector('img').getAttribute('src')).toBe('https://x/sea.webp');
    expect(box.getAttribute('class')).not.toContain('animate-ocean');
  });

  it('animates the plain sea only when asked', () => {
    expect(render(<MapBackground styleId='animated' animatedSea />).container.firstChild.getAttribute('class')).toContain('animate-ocean');
    expect(render(<MapBackground styleId='mono' animatedSea={false} />).container.firstChild.getAttribute('class')).not.toContain('animate-ocean');
  });

  it('draws a style’s artwork as a picture filling the screen', () => {
    const { container } = render(<MapBackground styleId='starry' />);
    const picture = container.querySelector('picture');
    expect(picture.getAttribute('aria-hidden')).toBe('true');
    expect(picture.querySelector('img').getAttribute('src')).toMatch(/starry-night/);
  });
});

describe('MapDesignStyle', () => {
  it('writes the design’s colours as a style sheet for the map', () => {
    const { container } = render(<MapDesignStyle design={{ shown: true, names: '#112233', hover: '#00ff00', countries: { FR: '#aabbcc' } }} />);
    const css = container.querySelector('style').textContent;
    expect(css).toContain('--map-names:#112233');
    expect(css).toContain('--map-hover:#00ff00');
    expect(css).toContain('[data-map-design] svg g[data-code="FR"]:not(:hover){fill:#aabbcc}');
  });

  it('writes nothing for an empty design, and lets nothing unsafe in', () => {
    expect(render(<MapDesignStyle design={null} />).container.innerHTML).toBe('');
    expect(render(<MapDesignStyle design={{ names: 'red;}body{x:y', countries: { fr: '#000000' } }} />).container.innerHTML).toBe('');
  });

  it('follows the preview while Settings changes the design', () => {
    const preview = createValueStore(null);
    const { container } = render(<MapDesignStyle design={{ grid: '#010101' }} preview={preview} />);
    expect(container.querySelector('style').textContent).toContain('--map-grid:#010101');
    act(() => preview.set({ grid: '#020202' }));
    expect(container.querySelector('style').textContent).toContain('--map-grid:#020202');
    act(() => preview.set(null));
    expect(container.querySelector('style').textContent).toContain('--map-grid:#010101');
  });
});
