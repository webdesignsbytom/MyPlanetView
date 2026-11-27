import React, { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import HomeDraftGlobe from '@/components/homeDraft/HomeDraftGlobe';
import { HOME_DRAFT_PLACES } from '@/utils/homeDraft/destinations';

const byId = (id) => HOME_DRAFT_PLACES.find((place) => place.id === id);

// What useHomeDraftGlobe hands the component
const globeWith = (overrides = {}) => ({
  canvasRef: createRef(),
  stageRef: createRef(),
  slotRefs: { current: [] },
  cards: [byId('392'), byId('764'), byId('036')],
  outgoing: null,
  drawn: false,
  settle: vi.fn(),
  ...overrides,
});

describe('HomeDraftGlobe', () => {
  it('draws a card per slot, each its photo, country and place', () => {
    const globe = globeWith();
    render(<HomeDraftGlobe globe={globe} onOpenPlace={vi.fn()} />);
    const cards = document.querySelectorAll('.slot > .card');
    expect(cards).toHaveLength(3);
    expect(cards[0].textContent).toBe('JapanMount Fuji');
    // The three the page opens with use their smaller card photos
    expect(cards[0].querySelector('img').getAttribute('src')).toMatch(/392-card\.webp/);
    expect(globe.slotRefs.current).toHaveLength(3);
    expect(globe.stageRef.current.getAttribute('aria-label')).toBe('Rotating Earth with highlighted countries');
    expect(globe.canvasRef.current.tagName).toBe('CANVAS');
  });

  it('opens a card’s place when pressed', () => {
    const onOpenPlace = vi.fn();
    render(<HomeDraftGlobe globe={globeWith()} onOpenPlace={onOpenPlace} />);
    fireEvent.click(screen.getByText('Uluru'));
    expect(onOpenPlace).toHaveBeenCalledWith(byId('036'));
  });

  it('fades a new card in over the one it replaces, which can’t be pressed', () => {
    const outgoing = { slot: 1, place: byId('764') };
    const globe = globeWith({ cards: [byId('392'), byId('360'), byId('036')], outgoing });
    render(<HomeDraftGlobe globe={globe} onOpenPlace={vi.fn()} />);
    const slot = document.querySelectorAll('.slot')[1];
    const [leaving, arriving] = slot.querySelectorAll('.card');
    expect(leaving.className).toContain('departing');
    expect(leaving.hasAttribute('inert')).toBe(true);
    expect(arriving.className).toContain('arriving');
    expect(arriving.getAttribute('data-destination')).toBe('360');
    // The other slots have one card each
    expect(document.querySelectorAll('.slot')[0].querySelectorAll('.card')).toHaveLength(1);
    // Once it has faded in, the old card can go
    fireEvent.animationEnd(leaving);
    expect(globe.settle).not.toHaveBeenCalled();
    fireEvent.animationEnd(arriving);
    expect(globe.settle).toHaveBeenCalledWith(outgoing);
  });

  it('marks the globe drawn once it is', () => {
    const { rerender } = render(<HomeDraftGlobe globe={globeWith()} onOpenPlace={vi.fn()} />);
    expect(document.querySelector('[data-globe-drawn]')).toBeNull();
    rerender(<HomeDraftGlobe globe={globeWith({ drawn: true })} onOpenPlace={vi.fn()} />);
    expect(document.querySelector('[data-globe-drawn]')).not.toBeNull();
  });
});
