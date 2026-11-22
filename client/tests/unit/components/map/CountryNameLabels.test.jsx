import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import CountryNameLabels from '@/components/map/CountryNameLabels';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { badgeRadius } from '@/utils/map/badges';

const names = (props) => {
  const { container } = render(
    <svg>
      <CountryNameLabels visitsByCode={{}} {...props} />
    </svg>,
  );
  const group = container.querySelector('svg > g');
  const byName = Object.fromEntries([...group.querySelectorAll('text')].map((t) => [t.textContent, t]));
  return { group, byName };
};

describe('CountryNameLabels', () => {
  it('names the big countries at their pins at world view', () => {
    const { group, byName } = names({ zoom: 1 });
    expect(byName.Russia).toBeTruthy();
    expect(byName.Brazil).toBeTruthy();
    expect(Number(byName.Russia.getAttribute('x'))).toBe(COUNTRY_BY_CODE.RU.pinX);
    expect(group.getAttribute('aria-hidden')).toBe('true');
    expect(group.getAttribute('class')).toContain('pointer-events-none');
    expect(group.getAttribute('class')).toContain('fill-map-names');
  });

  it('leaves a micro-state’s dot unnamed until the map is zoomed in far', () => {
    expect(names({ zoom: 1 }).byName.Monaco).toBeUndefined();
    expect(names({ zoom: 4 }).byName.Monaco).toBeUndefined();
    expect(names({ zoom: 6 }).byName.Monaco).toBeTruthy();
  });

  it('names every place by the closest zoom it needs', () => {
    const { byName } = names({ zoom: 10 });
    for (const name of ['Malta', 'Grenada', 'Tuvalu', 'Singapore', 'Goa']) expect(byName[name]).toBeTruthy();
  });

  it('puts a visited country’s name under its star badge', () => {
    const plain = Number(names({ zoom: 1 }).byName.Russia.getAttribute('y'));
    const starred = Number(names({ zoom: 1, visitsByCode: { RU: 'VISITED' } }).byName.Russia.getAttribute('y'));
    expect(starred - plain).toBeCloseTo(badgeRadius(1) + 10 * 0.55);
  });

  it('names Antarctica unless it is hidden', () => {
    expect(names({ zoom: 1 }).byName.Antarctica).toBeTruthy();
    expect(names({ zoom: 1, showAntarctica: false }).byName.Antarctica).toBeUndefined();
  });

  it('names the UK’s nations instead of the UK on a map that splits it', () => {
    const whole = names({ zoom: 10 }).byName;
    expect(whole['United Kingdom']).toBeTruthy();
    expect(whole.England).toBeUndefined();
    const split = names({ zoom: 10, splitUk: true }).byName;
    expect(split['United Kingdom']).toBeUndefined();
    for (const nation of ['England', 'Scotland', 'Wales', 'Northern Ireland']) expect(split[nation]).toBeTruthy();
  });

  it('sets a name too wide for its country smaller than the rest', () => {
    const { byName } = names({ zoom: 10 });
    // The group's size is the usual one; a squeezed name carries its own
    expect(byName.Malta.getAttribute('font-size')).not.toBeNull();
    expect(byName.Russia.getAttribute('font-size')).toBeNull();
  });
});
