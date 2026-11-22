import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import MapGridLines from '@/components/map/MapGridLines';

const draw = (props) => {
  const { container } = render(
    <svg>
      <MapGridLines zoom={1} {...props} />
    </svg>,
  );
  return container.querySelector('svg > g');
};

describe('MapGridLines', () => {
  it('draws parallels and meridians every 30° and both pole lines', () => {
    const grid = draw();
    // 5 parallels (60°S to 60°N), 13 meridians, 2 pole lines
    expect(grid.querySelectorAll('polyline').length).toBe(20);
    expect(grid.querySelectorAll('text').length).toBe(0);
    expect(grid.getAttribute('aria-hidden')).toBe('true');
    // The equator and the prime meridian are solid, the others dashed
    const solid = [...grid.querySelectorAll('polyline')].filter((line) => !line.getAttribute('class').includes('dasharray'));
    expect(solid.length).toBe(4);
  });

  it('stops at the map’s bottom edge without Antarctica: one pole line, no 60°S', () => {
    const grid = draw({ showAntarctica: false });
    expect(grid.querySelectorAll('polyline').length).toBe(4 + 13 + 1);
  });

  it('labels the lines when asked, sized by zoom', () => {
    const grid = draw({ showLabels: true, zoom: 2 });
    const labels = [...grid.querySelectorAll('text')].map((t) => t.textContent);
    expect(labels).toContain('Equator');
    expect(labels).toContain('30°N');
    expect(labels).toContain('60°S');
    expect(labels).toContain('0°');
    expect(labels).toContain('180°W');
    expect(labels).toContain('90°E');
    expect(grid.querySelector('g').getAttribute('font-size')).toBe('6.5');
  });

  it('is drawn stronger when a design colours it', () => {
    expect(draw({ coloured: true }).getAttribute('class')).toContain('opacity-70');
    expect(draw().getAttribute('class')).toContain('opacity-30');
  });
});
