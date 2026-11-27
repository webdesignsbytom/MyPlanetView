import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import HoverPreview from '@/components/map/HoverPreview';
import MapHoverLayer from '@/components/map/MapHoverLayer';
import { setHoverPoint } from '@/utils/map/hoverPoint';
import { createValueStore } from '@/utils/map/valueStore';
import { stubPointerEvents } from './helpers';

vi.mock('@/components/map/lazyMapPanels', () => {
  const HoverPreview = (props) => <div data-stub-hover={props.code} data-status={props.status ?? ''} data-poster={String(props.showPoster)} />;
  HoverPreview.preload = vi.fn(() => Promise.resolve());
  return { HoverPreview };
});

const card = () => document.querySelector('[data-hover-card]');

describe('HoverPreview', () => {
  beforeEach(() => stubPointerEvents());
  afterEach(() => vi.useRealTimers());

  it('waits for the pointer to move before showing', async () => {
    render(<HoverPreview code='FR' showPoster={false} />);
    expect(card()).toBeNull();
    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 100, clientY: 300 });
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card().getAttribute('data-hover-card')).toBe('FR');
    expect(card().style.left).toBe('118px');
    expect(card().getAttribute('aria-hidden')).toBe('true');
  });

  it('flips to the pointer’s left near the right edge', async () => {
    render(<HoverPreview code='FR' showPoster={false} />);
    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: window.innerWidth - 10, clientY: 300 });
    await waitFor(() => expect(card()).not.toBeNull());
    expect(card().style.right).toBe('28px');
  });

  it('ignores a finger moving (its card stays put)', async () => {
    render(<HoverPreview code='FR' showPoster={false} />);
    fireEvent.pointerMove(window, { pointerType: 'touch', clientX: 10, clientY: 10 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(card()).toBeNull();
  });

  it('starts at the finger after a long press, centred over it', () => {
    setHoverPoint({ x: 300, y: 400 });
    render(<HoverPreview code='JP' showPoster={false} />);
    expect(card().style.left).toBe(`${300 - 128}px`);
  });

  // 27 Nov 2026, the user's report: on a phone it ran off the bottom of the screen
  it('keeps a finger’s card on the screen, smaller when it fits neither above nor below the finger', () => {
    const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(430);
    const screen = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(839);
    try {
      setHoverPoint({ x: 200, y: 380 });
      render(<HoverPreview code='FR' showPoster={false} />);
      const scale = Number(card().getAttribute('data-hover-scale'));
      expect(scale).toBeLessThan(1);
      expect(card().style.transform).toBe(`scale(${scale})`);
      expect(card().style.transformOrigin).toBe('top center');
      const top = parseFloat(card().style.top);
      expect(top).toBe(380 + 36);
      expect(top + 430 * scale).toBeLessThanOrEqual(839 - 8);
    } finally {
      height.mockRestore();
      screen.mockRestore();
    }
  });

  it('draws a finger’s card whole where it fits', () => {
    const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(430);
    const screen = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(839);
    try {
      setHoverPoint({ x: 200, y: 700 });
      render(<HoverPreview code='FR' showPoster={false} />);
      expect(card().getAttribute('data-hover-scale')).toBe('1');
      expect(card().style.transform).toBe('');
      expect(card().style.top).toBe(`${700 - 36 - 430}px`);
    } finally {
      height.mockRestore();
      screen.mockRestore();
    }
  });

  it('names the place and stamps its status, with the badge on the corner once visited', () => {
    setHoverPoint({ x: 300, y: 400 });
    const { container } = render(<HoverPreview code='JP' status='LIVED' showPoster={false} />);
    expect(container.ownerDocument.body.textContent).toContain('Japan');
    expect(card().textContent).toContain('Lived there');
    expect(card().querySelector('svg.absolute')).not.toBeNull();
  });

  it('says "Not been yet" and has no badge before a visit', () => {
    setHoverPoint({ x: 300, y: 400 });
    render(<HoverPreview code='JP' showPoster={false} />);
    expect(card().textContent).toContain('Not been yet');
    expect(card().querySelector('svg.absolute')).toBeNull();
  });

  it('says a region is part of its country', () => {
    setHoverPoint({ x: 300, y: 400 });
    render(<HoverPreview code='XB' showPoster={false} />);
    expect(card().textContent).toContain('Region');
    expect(card().textContent).toContain('of Indonesia');
  });

  it('fetches the poster only once the pointer has rested a moment', () => {
    vi.useFakeTimers();
    setHoverPoint({ x: 300, y: 400 });
    render(<HoverPreview code='FR' showPoster />);
    expect(card().querySelector('img')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(card().querySelector('img').getAttribute('src')).toMatch(/fr-.+-800\.webp$/);
  });

  it('shows the placeholder card for a place with no poster', () => {
    setHoverPoint({ x: 300, y: 400 });
    render(<HoverPreview code='ZZ' showPoster />);
    expect(card().querySelector('[role="img"]')).not.toBeNull();
  });
});

describe('MapHoverLayer', () => {
  it('follows the hovered place, and hides while asked to', () => {
    const hover = createValueStore(null);
    const { container, rerender } = render(<MapHoverLayer hover={hover} visitsByCode={{ FR: 'VISITED' }} showPoster />);
    expect(container.querySelector('[data-stub-hover]')).toBeNull();
    act(() => hover.set('FR'));
    const shown = container.querySelector('[data-stub-hover]');
    expect(shown.getAttribute('data-stub-hover')).toBe('FR');
    expect(shown.getAttribute('data-status')).toBe('VISITED');
    expect(shown.getAttribute('data-poster')).toBe('true');
    rerender(<MapHoverLayer hover={hover} hidden visitsByCode={{}} showPoster />);
    expect(container.querySelector('[data-stub-hover]')).toBeNull();
  });

  it('fetches the postcard’s code once the browser is idle', async () => {
    const { HoverPreview: Lazy } = await import('@/components/map/lazyMapPanels');
    Lazy.preload.mockClear();
    const idle = vi.fn((fn) => {
      fn();
      return 1;
    });
    vi.stubGlobal('requestIdleCallback', idle);
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    render(<MapHoverLayer hover={createValueStore(null)} visitsByCode={{}} />);
    expect(idle).toHaveBeenCalled();
    expect(Lazy.preload).toHaveBeenCalled();
  });

  it('waits two seconds where there is no idle callback', async () => {
    const { HoverPreview: Lazy } = await import('@/components/map/lazyMapPanels');
    Lazy.preload.mockClear();
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.useFakeTimers();
    try {
      render(<MapHoverLayer hover={createValueStore(null)} visitsByCode={{}} />);
      expect(Lazy.preload).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(Lazy.preload).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
