import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import LandmarkPins, { LANDMARK_MIN_ZOOM } from '@/components/map/LandmarkPins';

// Far apart, so every one appears from zoom 1 (utils/map/landmarkPins.js thins only close ones)
const LANDMARKS = [
  { id: 'eiffel', name: 'Eiffel Tower', countryCode: 'FR', pinX: 100, pinY: 100, isUnesco: false, matchRadiusM: 300 },
  { id: 'colosseum', name: 'Colosseum', countryCode: 'IT', pinX: 400, pinY: 400, isUnesco: false, matchRadiusM: 300 },
  { id: 'big-ben', name: 'Big Ben', countryCode: 'GB', nation: 'XE', pinX: 800, pinY: 100, isUnesco: false, matchRadiusM: 300 },
];

const draw = (props) => {
  const { container } = render(
    <svg>
      <LandmarkPins landmarks={LANDMARKS} zoom={1} {...props} />
    </svg>,
  );
  return container.querySelector('[data-landmark-pins]');
};
const pinNames = (group) => [...group.querySelectorAll('path[data-country]')].map((p) => p.querySelector('title').textContent);

describe('LandmarkPins', () => {
  it('shows none until the map is zoomed in, by default', () => {
    expect(LANDMARK_MIN_ZOOM).toBe(3);
    expect(draw({ zoom: 2 })).toBeNull();
    const group = draw({ zoom: 3 });
    expect(group.getAttribute('data-landmark-pins')).toBe('3');
    expect(pinNames(group).sort()).toEqual(['Big Ben', 'Colosseum', 'Eiffel Tower']);
  });

  it('shows them at every zoom with "always"', () => {
    expect(draw({ zoom: 0.5, mode: 'always' }).getAttribute('data-landmark-pins')).toBe('3');
  });

  it('draws each pin as a dot with a dark edge under all of them', () => {
    const group = draw({ zoom: 4 });
    const pin = group.querySelector('path[data-country="FR"]');
    expect(pin.getAttribute('d')).toBe('M100 100h0');
    expect(pin.getAttribute('stroke-width')).toBe('7');
    expect(pin.getAttribute('class')).toContain('stroke-poster-red');
    const edge = group.querySelector('path.stroke-map-edge');
    expect(edge.getAttribute('d')).toContain('M100 100h0');
    expect(edge.getAttribute('class')).toContain('pointer-events-none');
  });

  it('draws the stamped landmarks last, smaller and in the stamp colour', () => {
    const group = draw({ zoom: 4, stamped: new Set(['eiffel']) });
    expect(group.getAttribute('data-stamped-pins')).toBe('1');
    const pins = [...group.querySelectorAll('path[data-country]')];
    const last = pins[pins.length - 1];
    expect(last.hasAttribute('data-stamped')).toBe(true);
    expect(last.getAttribute('class')).toContain('stroke-map-stamp');
    expect(last.getAttribute('stroke-width')).toBe('4.5');
    expect(last.querySelector('title').textContent).toBe('Eiffel Tower, stamped in the passport');
    // Not drawn twice
    expect(pins.filter((p) => p.getAttribute('data-country') === 'FR').length).toBe(1);
  });

  it('shows only the stamped ones, at every zoom, with "stamped"', () => {
    const group = draw({ zoom: 1, mode: 'stamped', stamped: new Set(['colosseum']) });
    expect(group.getAttribute('data-landmark-pins')).toBe('0');
    expect(pinNames(group)).toEqual(['Colosseum, stamped in the passport']);
    expect(draw({ zoom: 1, mode: 'stamped' })).toBeNull();
  });

  it('opens a UK landmark’s nation on a map that splits the UK', () => {
    expect(draw({ zoom: 4 }).querySelector('[data-country="GB"]')).not.toBeNull();
    expect(draw({ zoom: 4, splitUk: true }).querySelector('[data-country="XE"]')).not.toBeNull();
  });

  it('opens a pin’s country through afterTap, and not the map’s own click', () => {
    const onSelectCountry = vi.fn();
    const afterTap = vi.fn((run) => run());
    const outer = vi.fn();
    const { container } = render(
      <svg onClick={outer}>
        <LandmarkPins landmarks={LANDMARKS} zoom={4} onSelectCountry={onSelectCountry} afterTap={afterTap} />
      </svg>,
    );
    fireEvent.click(container.querySelector('path[data-country="IT"]'));
    expect(afterTap).toHaveBeenCalled();
    expect(onSelectCountry).toHaveBeenCalledWith('IT');
    expect(outer).not.toHaveBeenCalled();
  });

  it('opens straight away without afterTap, and ignores a press off a pin', () => {
    const onSelectCountry = vi.fn();
    const group = draw({ zoom: 4, onSelectCountry });
    fireEvent.click(group);
    expect(onSelectCountry).not.toHaveBeenCalled();
    fireEvent.click(group.querySelector('path[data-country="FR"] title'));
    expect(onSelectCountry).toHaveBeenCalledWith('FR');
  });

  it('thins out pins that would crowd, showing more as the map zooms in', () => {
    const close = [
      { id: 'a', name: 'A', countryCode: 'FR', pinX: 100, pinY: 100, isUnesco: false, matchRadiusM: 100 },
      { id: 'b', name: 'B', countryCode: 'FR', pinX: 105, pinY: 100, isUnesco: false, matchRadiusM: 200 },
    ];
    expect(draw({ landmarks: close, zoom: 3 }).getAttribute('data-landmark-pins')).toBe('1');
    expect(draw({ landmarks: close, zoom: 12 }).getAttribute('data-landmark-pins')).toBe('2');
  });
});
