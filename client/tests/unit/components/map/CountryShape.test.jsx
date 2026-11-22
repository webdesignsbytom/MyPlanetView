import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import CountryShape from '@/components/map/CountryShape';
import { PLANNED_OUTLINE } from '@/utils/map/visitStatus';

const draw = (props) => {
  const { container } = render(
    <svg>
      <CountryShape code='FR' paths={['M0 0L1 1', 'M2 2L3 3']} {...props} />
    </svg>,
  );
  return container.querySelector('g[data-code="FR"]');
};

describe('CountryShape', () => {
  it('draws a path per island, named by its code', () => {
    const shape = draw({ status: null });
    expect(shape.querySelectorAll('path').length).toBe(2);
    expect(shape.querySelector('path').getAttribute('d')).toBe('M0 0L1 1');
  });

  it('wears its pastel and the land edge when not marked', () => {
    const shape = draw({ status: undefined });
    const cls = shape.getAttribute('class');
    expect(cls).toMatch(/fill-map-visit-[1-7]/);
    expect(cls).toContain('stroke-map-land-edge');
    expect(cls).toContain('hover:fill-map-hover');
    expect(shape.getAttribute('data-been')).toBe('false');
  });

  it('says when it has been visited or lived in (the filters read data-been)', () => {
    expect(draw({ status: 'VISITED' }).getAttribute('data-been')).toBe('true');
  });

  it('marks "want to go" with a dashed outline', () => {
    const cls = draw({ status: 'WANT_TO_GO' }).getAttribute('class');
    expect(cls).toContain('stroke-map-wish');
    expect(cls).toContain('[stroke-dasharray:3_2]');
  });

  it('outlines a planned trip in place of "want to go", and marks data-planned', () => {
    const shape = draw({ status: 'WANT_TO_GO', planned: true });
    expect(shape.getAttribute('class')).toContain(PLANNED_OUTLINE);
    expect(shape.getAttribute('class')).not.toContain('stroke-map-wish');
    expect(shape.hasAttribute('data-planned')).toBe(true);
  });

  it('never outlines a visited place as planned', () => {
    const shape = draw({ status: 'LIVED', planned: true });
    expect(shape.hasAttribute('data-planned')).toBe(false);
    expect(shape.getAttribute('class')).not.toContain(PLANNED_OUTLINE);
  });

  it('draws the selected country with an ink outline', () => {
    expect(draw({ selected: true }).getAttribute('class')).toContain('stroke-map-ink');
    expect(draw({ selected: false }).getAttribute('class')).not.toContain('stroke-map-ink');
  });

  it('draws Antarctica as ice', () => {
    const { container } = render(
      <svg>
        <CountryShape code='AQ' paths={['M0 0']} />
      </svg>,
    );
    const cls = container.querySelector('g').getAttribute('class');
    expect(cls).toContain('fill-map-ice');
    expect(cls).toContain('stroke-map-ice-edge');
  });
});
