import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import VisitBadges from '@/components/map/VisitBadges';
import { BADGE_IDS, badgeRadius } from '@/utils/map/badges';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { MAP_TOP } from '@/utils/map/projection';

const draw = (props) => {
  const { container } = render(
    <svg>
      <VisitBadges zoom={1} {...props} />
    </svg>,
  );
  return container.querySelector('g');
};
const badges = (group) => [...group.querySelectorAll('use')].map((use) => use.getAttribute('href'));

describe('VisitBadges', () => {
  it('puts a badge on every visited or lived-in place only', () => {
    const group = draw({ visitsByCode: { FR: 'VISITED', JP: 'LIVED', PE: 'WANT_TO_GO' } });
    expect(badges(group).sort()).toEqual([`#${BADGE_IDS.LIVED}`, `#${BADGE_IDS.VISITED}`].sort());
    expect(group.getAttribute('aria-hidden')).toBe('true');
    expect(group.getAttribute('class')).toContain('pointer-events-none');
  });

  it('centres the star on the pin', () => {
    const use = draw({ visitsByCode: { FR: 'VISITED' } }).querySelector('use');
    const r = badgeRadius(1);
    const fr = COUNTRY_BY_CODE.FR;
    expect(Number(use.getAttribute('x'))).toBeCloseTo(fr.pinX - r);
    expect(Number(use.getAttribute('y'))).toBeCloseTo(fr.pinY - r);
    expect(Number(use.getAttribute('width'))).toBeCloseTo(r * 2);
  });

  it('gives special places the expedition stamp, a pole kept inside the map', () => {
    const use = draw({ visitsByCode: { XN: 'VISITED' } }).querySelector('use');
    expect(use.getAttribute('href')).toBe(`#${BADGE_IDS.EXPEDITION_VISITED}`);
    const r = badgeRadius(1);
    expect(Number(use.getAttribute('y'))).toBeCloseTo(MAP_TOP);
    expect(Number(use.getAttribute('height'))).toBeCloseTo(2 * r);
  });

  it('draws a region a little smaller than a country', () => {
    const use = draw({ visitsByCode: { XB: 'VISITED' } }).querySelector('use');
    expect(Number(use.getAttribute('width'))).toBeCloseTo(badgeRadius(1) * 2 * 0.75);
  });

  it('fades with the "show visited" filter', () => {
    expect(draw({ visitsByCode: {}, faded: true }).getAttribute('class')).toContain('opacity-15');
    expect(draw({ visitsByCode: {} }).getAttribute('class')).not.toContain('opacity-15');
  });

  it('leaves Antarctica’s places out while it is hidden', () => {
    const visits = { AQ: 'VISITED', XS: 'VISITED', XN: 'VISITED' };
    expect(badges(draw({ visitsByCode: visits })).length).toBe(3);
    expect(badges(draw({ visitsByCode: visits, showAntarctica: false })).length).toBe(1);
  });

  it('on a map that splits the UK, draws its nations’ badges and not the UK’s', () => {
    const visits = { GB: 'VISITED', XC: 'VISITED' };
    expect(badges(draw({ visitsByCode: visits })).length).toBe(2);
    const split = draw({ visitsByCode: visits, splitUk: true });
    expect(badges(split).length).toBe(1);
    const scotland = COUNTRY_BY_CODE.XC;
    expect(Number(split.querySelector('use').getAttribute('x'))).toBeCloseTo(scotland.pinX - badgeRadius(1));
  });
});
