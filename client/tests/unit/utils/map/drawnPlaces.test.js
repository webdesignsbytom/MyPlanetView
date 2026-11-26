// The places the world map draws (src/utils/map/drawnPlaces.js), shared by CountryLayer and a
// metallic finish's sheet of metal (VisitedFoil, 25 Nov 2026)
import { describe, expect, it } from 'vitest';
import { drawnPlaces, microStateDotRadius, shapesOf } from '@/utils/map/drawnPlaces';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
import { UK_NATION_SHAPES } from '@/utils/map/ukNationShapes';

const codes = (list) => list.map((place) => place.code);

describe('drawnPlaces', () => {
  it('draws the UK whole, or its four nations on a map that splits it', () => {
    const whole = codes(drawnPlaces().shaped);
    expect(whole).toContain('GB');
    expect(whole).not.toContain('XE');
    const split = codes(drawnPlaces({ splitUk: true }).shaped);
    expect(split).not.toContain('GB');
    expect(split).toEqual(expect.arrayContaining(['XE', 'XC', 'XW', 'XI']));
  });

  it('leaves Antarctica and the poles beside it out when it’s hidden', () => {
    const shown = drawnPlaces();
    const hidden = drawnPlaces({ showAntarctica: false });
    expect(codes(shown.shaped)).toContain('AQ');
    expect(codes(hidden.shaped)).not.toContain('AQ');
    expect(codes(shown.poles)).toEqual(expect.arrayContaining(['XS', 'QS', 'XN']));
    expect(codes(hidden.poles)).not.toContain('XS');
    expect(codes(hidden.poles)).toContain('XN');
  });

  it('dots the places with no shape, never a pole or a nation, and gives the same lists each time', () => {
    const { dotted } = drawnPlaces();
    expect(codes(dotted)).toEqual(expect.arrayContaining(['MC', 'VA', 'SG']));
    dotted.forEach((place) => expect(COUNTRY_SHAPES[place.code]).toBeUndefined());
    expect(codes(dotted)).not.toContain('XN');
    expect(drawnPlaces({ splitUk: true })).toBe(drawnPlaces({ splitUk: true }));
  });

  it('finds a country’s or a nation’s outline', () => {
    expect(shapesOf('FR')).toBe(COUNTRY_SHAPES.FR);
    expect(shapesOf('XE')).toBe(UK_NATION_SHAPES.XE);
  });

  it('sizes a micro-state’s dot for the zoom, never under 0.6 units', () => {
    expect(microStateDotRadius(1)).toBeCloseTo(3.2);
    expect(microStateDotRadius(4)).toBeCloseTo(1.6);
    expect(microStateDotRadius(64)).toBeCloseTo(0.6);
  });
});
