import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import MicroStateDot from '@/components/map/MicroStateDot';
import { PLANNED_OUTLINE } from '@/utils/map/visitStatus';

const draw = (props) => {
  const { container } = render(
    <svg>
      <MicroStateDot code='MC' x={100} y={50} zoom={1} {...props} />
    </svg>,
  );
  return container.querySelector('g[data-code="MC"]');
};

describe('MicroStateDot', () => {
  it('draws a dot at the pin', () => {
    const circle = draw().querySelector('circle');
    expect(circle.getAttribute('cx')).toBe('100');
    expect(circle.getAttribute('cy')).toBe('50');
    expect(Number(circle.getAttribute('r'))).toBeCloseTo(3.2);
  });

  it('shrinks with zoom, but never below 0.6 map units', () => {
    expect(Number(draw({ zoom: 4 }).querySelector('circle').getAttribute('r'))).toBeCloseTo(1.6);
    expect(Number(draw({ zoom: 10000 }).querySelector('circle').getAttribute('r'))).toBeCloseTo(0.6);
  });

  it('takes no touches while it is under 4 px across, but does once zoomed in', () => {
    // Zoomed right out (a phone's whole world), its radius is under 2 px on screen
    expect(draw({ zoom: 0.25 }).getAttribute('class')).toContain('pointer-coarse:pointer-events-none');
    expect(draw({ zoom: 1 }).getAttribute('class')).not.toContain('pointer-coarse:pointer-events-none');
    expect(draw({ zoom: 4 }).getAttribute('class')).not.toContain('pointer-coarse:pointer-events-none');
  });

  it('marks its status, planned trips and selection as a country shape does', () => {
    expect(draw({ status: 'VISITED' }).getAttribute('data-been')).toBe('true');
    expect(draw({ status: null }).getAttribute('data-been')).toBe('false');
    const planned = draw({ planned: true });
    expect(planned.hasAttribute('data-planned')).toBe(true);
    expect(planned.getAttribute('class')).toContain(PLANNED_OUTLINE);
    expect(draw({ planned: true, status: 'VISITED' }).hasAttribute('data-planned')).toBe(false);
    expect(draw({ status: 'WANT_TO_GO' }).getAttribute('class')).toContain('stroke-map-wish');
    expect(draw({ selected: true }).getAttribute('class')).toContain('stroke-map-ink');
  });
});
