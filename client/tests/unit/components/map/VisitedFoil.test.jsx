// A metallic finish's sheet of metal under the places been to (src/components/map/VisitedFoil.jsx;
// 25 Nov 2026, the user's wish: gold, silver and bronze that look like real metal)
import React from 'react';
import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import VisitedFoil from '@/components/map/VisitedFoil';
import { VISITED_FINISHES } from '@/utils/map/mapDesign';
import { COUNTRIES } from '@/utils/map/countries';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
import { UK_NATION_SHAPES } from '@/utils/map/ukNationShapes';
import { microStateDotRadius } from '@/utils/map/drawnPlaces';
import { MAP_BOTTOM, MAP_TOP } from '@/utils/map/projection';

const GOLD = { visitedLook: 'COLOUR', visitedFinish: 'GOLD' };
const VISITS = { FR: 'VISITED', PT: 'LIVED', DE: 'WANT_TO_GO', MC: 'VISITED', XN: 'VISITED' };
const MONACO = COUNTRIES.find((c) => c.code === 'MC');

const draw = (props) =>
  render(
    <svg>
      <VisitedFoil design={GOLD} visitsByCode={VISITS} {...props} />
    </svg>,
  );
const clipPathsOf = (container) => [...container.querySelectorAll('clipPath path')].map((path) => path.getAttribute('d'));

describe('VisitedFoil', () => {
  it('lays the metal’s picture across the whole map, its medal colour under it, cut to the places been to', () => {
    const { container } = draw();
    const foil = container.querySelector('[data-visited-foil]');
    expect(foil.getAttribute('data-visited-foil')).toBe('GOLD');
    expect(foil.getAttribute('class')).toContain('pointer-events-none');
    const image = foil.querySelector('image');
    expect(image.getAttribute('href')).toBe(VISITED_FINISHES[0].texture);
    expect([image.getAttribute('x'), image.getAttribute('y'), image.getAttribute('width')]).toEqual(['0', String(MAP_TOP), '2000']);
    expect(Number(image.getAttribute('height'))).toBeCloseTo(MAP_BOTTOM - MAP_TOP);
    expect(foil.querySelector('rect').style.fill).toBe('var(--medal-gold)');
    // Cut to France and Portugal (visited, lived in), never Germany (wished for)
    const clip = foil.querySelector('clipPath');
    expect(image.parentElement.getAttribute('clip-path')).toBe(`url(#${clip.id})`);
    expect(clip.id).toMatch(/^foil-[a-zA-Z0-9]+$/);
    expect(new Set(clipPathsOf(container))).toEqual(new Set([...COUNTRY_SHAPES.FR, ...COUNTRY_SHAPES.PT]));
    expect(clipPathsOf(container)).toHaveLength(COUNTRY_SHAPES.FR.length + COUNTRY_SHAPES.PT.length);
    // and Monaco's dot, at its size for the zoom; never a pole
    const dot = clip.querySelector('circle');
    expect([dot.getAttribute('cx'), dot.getAttribute('cy')]).toEqual([String(MONACO.pinX), String(MONACO.pinY)]);
    expect(Number(dot.getAttribute('r'))).toBeCloseTo(microStateDotRadius(1));
    expect(clip.querySelectorAll('circle')).toHaveLength(1);
  });

  it('follows the map: its detailed outlines, a dot’s size for the zoom, the UK’s nations, the fade', () => {
    const detail = { FR: ['M 1 1 L 2 2 Z'] };
    const { container } = draw({ detail, zoom: 16, faded: true });
    expect(clipPathsOf(container)).toContain('M 1 1 L 2 2 Z');
    expect(Number(container.querySelector('clipPath circle').getAttribute('r'))).toBeCloseTo(microStateDotRadius(16));
    expect(container.querySelector('[data-visited-foil]').getAttribute('class')).toContain('opacity-15');

    const split = draw({ visitsByCode: { XE: 'VISITED' }, splitUk: true });
    expect(clipPathsOf(split.container)).toEqual(UK_NATION_SHAPES.XE);
  });

  it('draws nothing while the places been to show as badges, or in a plain colour', () => {
    expect(draw({ design: { ...GOLD, visitedLook: 'BADGE' } }).container.querySelector('[data-visited-foil]')).toBeNull();
    expect(draw({ design: { visitedLook: 'COLOUR', visited: '#7c3aed' } }).container.querySelector('[data-visited-foil]')).toBeNull();
    expect(draw({ design: null }).container.querySelector('[data-visited-foil]')).toBeNull();
  });

  it('follows the design as Settings changes it, before it’s saved', () => {
    let previewed = null;
    const listeners = new Set();
    const preview = { get: () => previewed, subscribe: (fn) => (listeners.add(fn), () => listeners.delete(fn)) };
    const { container } = draw({ design: { visitedLook: 'BADGE' }, preview });
    expect(container.querySelector('[data-visited-foil]')).toBeNull();
    previewed = { visitedLook: 'BOTH', visitedFinish: 'BRONZE' };
    act(() => listeners.forEach((fn) => fn()));
    expect(container.querySelector('[data-visited-foil]').getAttribute('data-visited-foil')).toBe('BRONZE');
    expect(container.querySelector('image').getAttribute('href')).toBe(VISITED_FINISHES[2].texture);
  });
});
