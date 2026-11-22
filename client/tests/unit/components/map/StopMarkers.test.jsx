import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import StopMarkers from '@/components/map/StopMarkers';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';

const draw = (stops, zoom = 1) => {
  const { container } = render(
    <svg>
      <StopMarkers stops={stops} zoom={zoom} />
    </svg>,
  );
  return container.querySelector('svg > g');
};

describe('StopMarkers', () => {
  it('draws nothing without stops in known countries', () => {
    expect(draw([])).toBeNull();
    expect(draw([{ countryCode: 'ZZ' }])).toBeNull();
  });

  it('numbers each stop at its country’s pin, in order, joined by a dashed line', () => {
    const group = draw([{ countryCode: 'FR' }, { countryCode: 'ZZ' }, { countryCode: 'IT' }]);
    const numbers = [...group.querySelectorAll('text')].map((t) => t.textContent);
    expect(numbers).toEqual(['1', '2']);
    const fr = COUNTRY_BY_CODE.FR;
    const it = COUNTRY_BY_CODE.IT;
    expect(group.querySelector('polyline').getAttribute('points')).toBe(`${fr.pinX},${fr.pinY} ${it.pinX},${it.pinY}`);
    expect(group.querySelector('circle').getAttribute('cx')).toBe(String(fr.pinX));
    expect(group.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws one stop without a line, sized by zoom', () => {
    const group = draw([{ countryCode: 'JP' }], 4);
    expect(group.querySelector('polyline')).toBeNull();
    expect(Number(group.querySelector('circle').getAttribute('r'))).toBeCloseTo(4.5);
  });
});
