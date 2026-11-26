// A metallic finish's lit edge (src/components/map/FoilEdgeFilter.jsx; 25 Nov 2026, the user's wish:
// gold, silver and bronze that look like real metal)
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import FoilEdgeFilter from '@/components/map/FoilEdgeFilter';
import { FOIL_EDGE_ID } from '@/utils/map/mapDesign';
import { REFERENCE_PX_PER_UNIT } from '@/utils/map/projection';

const draw = (zoom) =>
  render(
    <svg>
      <FoilEdgeFilter zoom={zoom} />
    </svg>,
  ).container.querySelector('filter');

describe('FoilEdgeFilter', () => {
  it('lights the edge of what it’s on from the top left: a slope from its outline, shaded and shone on, kept inside it', () => {
    const filter = draw(1);
    expect(filter.id).toBe(FOIL_EDGE_ID);
    expect(filter.getAttribute('color-interpolation-filters')).toBe('sRGB');
    expect([...filter.children].map((el) => el.tagName.toLowerCase())).toEqual([
      'fegaussianblur',
      'fespecularlighting',
      'fecomposite',
      'fediffuselighting',
      'fecomposite',
      'fecomposite',
      'fecomposite',
    ]);
    expect(filter.querySelector('feGaussianBlur').getAttribute('in')).toBe('SourceAlpha');
    filter.querySelectorAll('feDistantLight').forEach((light) => {
      expect([light.getAttribute('azimuth'), light.getAttribute('elevation')]).toEqual(['225', '42']);
    });
    // Both lights kept inside the outline
    expect([...filter.querySelectorAll('feComposite[operator="in"]')].map((el) => el.getAttribute('in2'))).toEqual(['SourceAlpha', 'SourceAlpha']);
  });

  it('keeps the slope a couple of pixels wide on screen at every zoom', () => {
    const slope = (zoom) => Number(draw(zoom).querySelector('feGaussianBlur').getAttribute('stdDeviation'));
    expect(slope(1)).toBeCloseTo(1.8 / REFERENCE_PX_PER_UNIT);
    expect(slope(8)).toBeCloseTo(1.8 / (8 * REFERENCE_PX_PER_UNIT));
  });
});
