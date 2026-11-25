import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import WorldMap from '@/components/map/WorldMap';
import { useViewportZoom } from '@/hooks/useMapViewport';
import useDetailedShapes from '@/hooks/useDetailedShapes';
import { SplitUkProvider } from '@/hooks/useSplitUk';

vi.mock('@/hooks/useMapViewport', () => ({ useViewportZoom: vi.fn(() => 4) }));
vi.mock('@/hooks/useDetailedShapes', () => ({ default: vi.fn(() => null) }));

const LANDMARKS = [{ id: 'l1', name: 'Eiffel Tower', countryCode: 'FR', pinX: 998, pinY: 200, isUnesco: false, matchRadiusM: 100 }];

const viewport = () => ({ svgRef: vi.fn(), handlers: { onPointerDown: vi.fn() }, afterTap: vi.fn((run) => run()) });
const draw = (props = {}, splitUk = false) => {
  const vp = props.viewport || viewport();
  const onSelectCountry = vi.fn();
  const result = render(
    <SplitUkProvider value={splitUk}>
      <WorldMap viewport={vp} onSelectCountry={onSelectCountry} {...props} />
    </SplitUkProvider>,
  );
  const svg = result.container.querySelector('svg[aria-label]');
  return { ...result, svg, vp, onSelectCountry };
};

describe('WorldMap', { timeout: 20000 }, () => {
  beforeEach(() => {
    useViewportZoom.mockReturnValue(4);
    useDetailedShapes.mockReturnValue(null);
  });

  it('is an application the keyboard can reach, described by its hint, never with a focus ring', () => {
    const { svg, vp, container } = draw({ label: 'Our trips: world map' });
    expect(svg.getAttribute('role')).toBe('application');
    expect(svg.getAttribute('aria-label')).toBe('Our trips: world map');
    expect(svg.getAttribute('tabindex')).toBe('0');
    expect(svg.getAttribute('class')).toContain('outline-none');
    const hint = document.getElementById(svg.getAttribute('aria-describedby'));
    expect(hint.textContent).toContain('use the arrow keys, to move the map');
    expect(vp.svgRef).toHaveBeenCalledWith(svg);
    // The viewport's handlers are on the map
    fireEvent.pointerDown(svg);
    expect(vp.handlers.onPointerDown).toHaveBeenCalled();
    expect(container.querySelector('symbol#mpv-badge-visited')).not.toBeNull();
    expect(container.querySelector('symbol#mpv-pole-geographic')).not.toBeNull();
    expect(container.querySelector('symbol#mpv-moment-mark')).not.toBeNull();
  });

  // A metallic finish (25 Nov 2026, the user's wish: gold, silver and bronze that look like real
  // metal): its sheet of metal under the countries, and the filter its lit edge uses
  it('draws a metallic finish’s sheet of metal under the countries, cut to the places been to', () => {
    const design = { visitedLook: 'COLOUR', visitedFinish: 'SILVER' };
    const { container } = draw({ design, visitsByCode: { FR: 'VISITED' }, showVisited: false });
    const foil = container.querySelector('[data-visited-foil]');
    expect(foil.getAttribute('data-visited-foil')).toBe('SILVER');
    // Under the countries
    const countries = container.querySelector('g[data-code="FR"]').parentElement;
    expect(foil.compareDocumentPosition(countries) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Faded with the places been to
    expect(foil.getAttribute('class')).toContain('opacity-15');
    expect(container.querySelector('filter#mpv-foil-edge')).not.toBeNull();
    // None without a design, or in its plain colour
    expect(draw({ visitsByCode: { FR: 'VISITED' } }).container.querySelector('[data-visited-foil]')).toBeNull();
  });

  it('marks a pointer’s focus, so the hint shows for the keyboard only', () => {
    const { svg } = draw();
    fireEvent.pointerDown(svg);
    expect(svg.hasAttribute('data-pointer-focus')).toBe(true);
    fireEvent.blur(svg);
    expect(svg.hasAttribute('data-pointer-focus')).toBe(false);
  });

  it('is a still picture without pan and zoom (the trip page’s mini map)', () => {
    const { svg, container, vp, onSelectCountry } = draw({ panZoom: false });
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.hasAttribute('tabindex')).toBe(false);
    expect(svg.hasAttribute('aria-describedby')).toBe(false);
    expect(container.querySelector('p')).toBeNull();
    // A click opens the country at once, not through afterTap
    fireEvent.click(svg.querySelector('[data-code="FR"] path'));
    expect(vp.afterTap).not.toHaveBeenCalled();
    expect(onSelectCountry).toHaveBeenCalledWith('FR');
  });

  it('opens the country clicked through the viewport’s afterTap', () => {
    const { svg, vp, onSelectCountry } = draw();
    fireEvent.click(svg.querySelector('[data-code="JP"] path'));
    expect(vp.afterTap).toHaveBeenCalled();
    expect(onSelectCountry).toHaveBeenCalledWith('JP');
  });

  it('draws the sea’s depths, the grid and the names only when asked', () => {
    const plain = draw().svg;
    expect(plain.querySelector('image')).toBeNull();
    expect(plain.querySelectorAll('polyline').length).toBe(0);
    const full = draw({ seaDepths: true, showGrid: true, showGridLabels: true, showCountryNames: true, gridColoured: true }).svg;
    expect(full.querySelector('image').getAttribute('href')).toMatch(/sea-depths/);
    expect(full.querySelector('g.stroke-map-grid').getAttribute('class')).toContain('opacity-70');
    expect([...full.querySelectorAll('text')].some((t) => t.textContent === 'Equator')).toBe(true);
    expect([...full.querySelectorAll('text')].some((t) => t.textContent === 'Russia')).toBe(true);
  });

  it('badges the places visited, with moment marks while moments show', () => {
    const marked = draw({ visitsByCode: { FR: 'VISITED' }, momentCounts: { FR: 2 } }).svg;
    expect(marked.querySelector('use[href="#mpv-badge-visited"]')).not.toBeNull();
    expect(marked.querySelector('[data-moment-mark="FR"]')).not.toBeNull();
    const quiet = draw({ visitsByCode: { FR: 'VISITED' }, momentCounts: { FR: 2 }, showMoments: false }).svg;
    expect(quiet.querySelector('[data-moment-mark]')).toBeNull();
  });

  it('outlines the places a planned trip goes to', () => {
    expect(draw({ plannedCodes: new Set(['JP']) }).svg.querySelector('[data-code="JP"]').hasAttribute('data-planned')).toBe(true);
  });

  it('pins landmarks by the viewer’s setting, and not at all when it’s off', () => {
    const pinned = draw({ landmarks: LANDMARKS, landmarkPins: 'always' }).svg;
    expect(pinned.querySelector('[data-landmark-pins]')).not.toBeNull();
    expect(draw({ landmarks: LANDMARKS, landmarkPins: 'off' }).svg.querySelector('[data-landmark-pins]')).toBeNull();
    expect(draw({ landmarks: [], landmarkPins: 'always' }).svg.querySelector('[data-landmark-pins]')).toBeNull();
  });

  it('pins the moments’ spots while moments show', () => {
    const spots = [{ id: 's1', title: 'Engaged', countryCode: 'FR', latitude: 48.8, longitude: 2.3 }];
    expect(draw({ momentSpots: spots }).svg.querySelector('[data-moment-spot="s1"]')).not.toBeNull();
    expect(draw({ momentSpots: spots, showMoments: false }).svg.querySelector('[data-moment-spots]')).toBeNull();
  });

  it('numbers a trip’s stops, and draws the sun and the moon when asked', () => {
    const { svg } = draw({ stops: [{ countryCode: 'FR' }, { countryCode: 'IT' }], showSky: true });
    expect(svg.querySelector('polyline')).not.toBeNull();
    expect(svg.querySelector('[data-sky-body="sun"]')).not.toBeNull();
  });

  it('leaves Antarctica out while it is hidden', () => {
    expect(draw({ showAntarctica: false }).svg.querySelector('[data-code="AQ"]')).toBeNull();
  });

  it('draws the UK as its nations on a map that splits it', () => {
    const { svg } = draw({}, true);
    expect(svg.querySelector('[data-code="XE"]')).not.toBeNull();
    expect(svg.querySelector('[data-code="GB"]')).toBeNull();
  });

  it('swaps in the detailed outlines once zoomed in', () => {
    useDetailedShapes.mockReturnValue({ FR: ['M0 0L9 9'] });
    const { svg, vp } = draw();
    expect(useDetailedShapes).toHaveBeenCalledWith(vp, true);
    expect(svg.querySelector('[data-code="FR"] path').getAttribute('d')).toBe('M0 0L9 9');
  });
});
