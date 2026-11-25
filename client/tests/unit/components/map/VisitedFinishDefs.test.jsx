// A metallic finish's foil gradient (src/components/map/VisitedFinishDefs.jsx; 25 Nov 2026, the
// user's wish: "shiny colours like gold and silver")
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import VisitedFinishDefs from '@/components/map/VisitedFinishDefs';
import MapDesignStyle from '@/components/map/MapDesignStyle';
import { VISITED_FINISHES } from '@/utils/map/mapDesign';

const GOLD = VISITED_FINISHES[0];

describe('VisitedFinishDefs', () => {
  it('draws the metal’s foil as one gradient in map units, edge, colour, shine and back', () => {
    const { container } = render(<VisitedFinishDefs finish={GOLD} />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect([svg.getAttribute('width'), svg.getAttribute('height')]).toEqual(['0', '0']);
    const gradient = svg.querySelector('linearGradient');
    expect(gradient.id).toBe('mpv-visited-gold');
    expect(gradient.getAttribute('gradientUnits')).toBe('userSpaceOnUse');
    expect(gradient.getAttribute('spreadMethod')).toBe('reflect');
    expect([...gradient.querySelectorAll('stop')].map((stop) => stop.style.stopColor)).toEqual([
      'var(--medal-gold-edge)',
      'var(--medal-gold)',
      'var(--medal-gold-shine)',
      'var(--medal-gold)',
      'var(--medal-gold-edge)',
    ]);
  });

  it('draws nothing without a finish', () => {
    expect(render(<VisitedFinishDefs finish={null} />).container.innerHTML).toBe('');
  });
});

describe('MapDesignStyle and a finish', () => {
  it('puts the finish’s gradient on the page while the places been to show by colour', () => {
    const shown = render(<MapDesignStyle design={{ visitedLook: 'COLOUR', visitedFinish: 'SILVER' }} />);
    expect(shown.container.querySelector('[data-visited-finish-defs]').getAttribute('data-visited-finish-defs')).toBe('SILVER');
    expect(shown.container.querySelector('style').textContent).toContain('url(#mpv-visited-silver)');
    shown.unmount();
    const badges = render(<MapDesignStyle design={{ visitedLook: 'BADGE', visitedFinish: 'SILVER' }} />);
    expect(badges.container.querySelector('[data-visited-finish-defs]')).toBeNull();
  });

  it('follows the design as Settings changes it, before it’s saved', () => {
    // The same design each time it's read, as the editor's value store gives it
    const previewed = { visitedLook: 'BOTH', visitedFinish: 'BRONZE' };
    const preview = { get: () => previewed, subscribe: () => () => {} };
    const { container } = render(<MapDesignStyle design={{ visitedLook: 'BADGE' }} preview={preview} />);
    expect(container.querySelector('#mpv-visited-bronze')).not.toBeNull();
  });
});
