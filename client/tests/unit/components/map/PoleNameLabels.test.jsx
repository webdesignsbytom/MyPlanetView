import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import PoleNameLabels from '@/components/map/PoleNameLabels';
import { MAP_BOTTOM, MAP_TOP } from '@/utils/map/projection';

const labels = (props) => {
  const { container } = render(
    <svg>
      <PoleNameLabels visitsByCode={{}} {...props} />
    </svg>,
  );
  return Object.fromEntries([...container.querySelectorAll('text')].map((t) => [t.textContent, Number(t.getAttribute('y'))]));
};

describe('PoleNameLabels', () => {
  it('shows no names zoomed out, unless country names are on', () => {
    expect(labels({ zoom: 1 })).toEqual({});
    expect(Object.keys(labels({ zoom: 1, always: true })).length).toBe(4);
    expect(Object.keys(labels({ zoom: 3 })).length).toBe(4);
  });

  it('puts a north pole’s name below it and a south one’s above, inside the map', () => {
    const y = labels({ zoom: 3 });
    expect(y['North Pole']).toBeGreaterThan(MAP_TOP);
    expect(y['South Pole']).toBeLessThan(MAP_BOTTOM);
    expect(y['North Pole']).toBeLessThan(100);
    expect(y['South Pole']).toBeGreaterThan(900);
  });

  it('clears the expedition stamp of a visited pole', () => {
    const plain = labels({ zoom: 3 });
    const visited = labels({ zoom: 3, visitsByCode: { XN: 'VISITED' } });
    expect(visited['North Pole']).not.toBe(plain['North Pole']);
  });

  it('leaves the southern poles out while Antarctica is hidden', () => {
    expect(Object.keys(labels({ zoom: 3, showAntarctica: false })).sort()).toEqual(['Magnetic North Pole', 'North Pole']);
  });
});
