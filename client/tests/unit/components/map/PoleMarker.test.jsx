import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import PoleMarker, { PoleMarkerSymbols } from '@/components/map/PoleMarker';
import { PLANNED_OUTLINE } from '@/utils/map/visitStatus';
import { MAP_TOP, MAP_BOTTOM } from '@/utils/map/projection';
import { poleMarkerRadius } from '@/utils/map/badges';

const draw = (props) => {
  const { container } = render(
    <svg>
      <PoleMarker code='XN' x={987.1} y={MAP_TOP} zoom={1} {...props} />
    </svg>,
  );
  return container.querySelector('g[data-code]');
};

describe('PoleMarkerSymbols', () => {
  it('defines a rose for the geographic poles and a turned one for the magnetic poles', () => {
    const { container } = render(
      <svg>
        <PoleMarkerSymbols />
      </svg>,
    );
    const geographic = container.querySelector('symbol#mpv-pole-geographic');
    const magnetic = container.querySelector('symbol#mpv-pole-magnetic');
    expect(geographic.querySelector('g').getAttribute('transform')).toBeNull();
    expect(magnetic.querySelector('g').getAttribute('transform')).toBe('rotate(18)');
    // A red heart for a geographic pole, a blue one for a magnetic pole
    expect(geographic.querySelector('circle').getAttribute('class')).toContain('fill-poster-red');
    expect(magnetic.querySelector('circle').getAttribute('class')).toContain('fill-colour7');
    // Four cardinal and four diagonal points, each in two halves
    expect(geographic.querySelectorAll('polygon').length).toBe(16);
  });
});

describe('PoleMarker', () => {
  it('draws the geographic rose, kept inside the top pole line', () => {
    const pole = draw();
    const use = pole.querySelector('use');
    expect(use.getAttribute('href')).toBe('#mpv-pole-geographic');
    const r = poleMarkerRadius(1);
    const disc = pole.querySelector('circle');
    expect(Number(disc.getAttribute('cy'))).toBeCloseTo(MAP_TOP + r * 1.05);
    expect(Number(use.getAttribute('width'))).toBeCloseTo(r * 2);
  });

  it('sits on the bottom pole line in the south, and uses the magnetic rose for QS', () => {
    const { container } = render(
      <svg>
        <PoleMarker code='QS' x={1200} y={MAP_BOTTOM} zoom={1} />
      </svg>,
    );
    const r = poleMarkerRadius(1);
    expect(Number(container.querySelector('circle').getAttribute('cy'))).toBeCloseTo(MAP_BOTTOM - r * 1.05);
    expect(container.querySelector('use').getAttribute('href')).toBe('#mpv-pole-magnetic');
  });

  it('has a hover disc that takes the pointer', () => {
    const disc = draw().querySelector('circle');
    expect(disc.getAttribute('class')).toContain('fill-map-hover');
    expect(disc.getAttribute('class')).toContain('group-hover:opacity-70');
  });

  it('rings "want to go" with a dashed ring', () => {
    const rings = draw({ status: 'WANT_TO_GO' }).querySelectorAll('circle');
    expect(rings.length).toBe(2);
    expect(rings[1].getAttribute('class')).toContain('stroke-map-wish');
  });

  it('rings a planned trip dash-dot instead, with data-planned', () => {
    const pole = draw({ status: 'WANT_TO_GO', planned: true });
    expect(pole.hasAttribute('data-planned')).toBe(true);
    const rings = pole.querySelectorAll('circle');
    expect(rings[1].getAttribute('class')).toContain(PLANNED_OUTLINE);
    expect(pole.querySelector('.stroke-map-wish')).toBeNull();
  });

  it('adds an ink ring when selected', () => {
    expect(draw({ selected: true }).querySelector('.stroke-map-ink')).not.toBeNull();
  });

  it('gives its place to the expedition stamp once visited, still taking the click', () => {
    const pole = draw({ status: 'VISITED', planned: true });
    expect(pole.getAttribute('data-been')).toBe('true');
    expect(pole.hasAttribute('data-planned')).toBe(false);
    expect(pole.querySelector('use')).toBeNull();
    expect(pole.querySelector('circle')).not.toBeNull();
  });
});
