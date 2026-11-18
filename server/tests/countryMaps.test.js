import { describe, it, expect } from 'vitest';
import SUBDIVISIONS from '../src/data/subdivisions.json' with { type: 'json' };
import { isOnCountryMap, placesOfSubdivision, regionStatesOn, sameAsRegion, subdivisionCountry, subdivisionOf } from '../src/utils/subdivisions.js';
import { PIN_NAME_MAX, VISIT_PHOTOS_MAX, parsePin, parsePinVisit } from '../src/utils/pins.js';
import { REGION_CODES } from '../src/utils/regionPlaces.js';
import { COUNTRIES } from '../prisma/seed/data/countries.js';

// Country maps (docs/API.md "Country maps"): Natural Earth's states, and pins with visits

describe('the states list', () => {
  it('has every US state on the US map, and only there', () => {
    const us = Object.keys(SUBDIVISIONS).filter((code) => isOnCountryMap(code, 'US'));
    expect(us).toContain('US-CA');
    expect(us).toContain('US-HI');
    expect(us.length).toBe(51); // the 50 states and DC
    expect(isOnCountryMap('US-CA', 'CA')).toBe(false);
    expect(subdivisionOf('XX-NOPE')).toBeNull();
    expect(subdivisionOf('__proto__')).toBeNull();
  });

  it("puts every state on a place of the map's, as the world map does", () => {
    const places = new Set(COUNTRIES.map((c) => c.code));
    for (const [code, state] of Object.entries(SUBDIVISIONS)) {
      expect(places.has(state.m), code).toBe(true);
      if (state.r) expect(REGION_CODES, code).toContain(state.r);
    }
    // Crimea and Sevastopol are Ukraine's; the Canaries' provinces the Canaries'
    expect(subdivisionCountry('UA-43')).toBe('UA');
    expect(subdivisionCountry('UA-40')).toBe('UA');
    expect(subdivisionCountry('ES-GC')).toBe('IC');
  });

  it('makes a region that is one state share its visit, and one with several bring it', () => {
    expect(sameAsRegion('US-HI')).toBe('XH');
    expect(sameAsRegion('AU-TAS')).toBe('XT');
    expect(sameAsRegion('IN-GA')).toBe('XG');
    expect(sameAsRegion('ID-BA')).toBe('XB');
    expect(sameAsRegion('EC-W')).toBe('XA');
    expect(regionStatesOn('US')).toEqual([['US-HI', 'XH']]);
    // New Caledonia's three provinces are on France's map, each its own, bringing NC
    const nc = Object.entries(SUBDIVISIONS).filter(([, s]) => s.r === 'NC');
    expect(nc.length).toBe(3);
    expect(nc.every(([code, s]) => s.m === 'FR' && !sameAsRegion(code))).toBe(true);
    expect(placesOfSubdivision(nc[0][0], false)).toEqual(['NC', 'FR']);
  });

  it("brings a UK state's nation on a map that splits the UK, and the UK otherwise", () => {
    const [cardiff] = Object.entries(SUBDIVISIONS).find(([, s]) => s.m === 'GB' && s.n === 'XW');
    expect(placesOfSubdivision(cardiff, true)).toEqual(['XW']);
    expect(placesOfSubdivision(cardiff, false)).toEqual(['GB']);
    expect(isOnCountryMap(cardiff, 'XW')).toBe(true);
    expect(isOnCountryMap(cardiff, 'XE')).toBe(false);
    expect(isOnCountryMap(cardiff, 'GB')).toBe(true);
  });
});

describe('pins', () => {
  it('need a name and a real position', () => {
    expect(parsePin({ name: ' Our spot ', latitude: 35.3, longitude: 25.1 })).toEqual({ value: { name: 'Our spot', latitude: 35.3, longitude: 25.1 } });
    expect(parsePin({ name: '', latitude: 35.3, longitude: 25.1 }).error).toBe('name');
    expect(parsePin({ name: 'x'.repeat(PIN_NAME_MAX + 20), latitude: 0, longitude: 0 }).value.name.length).toBe(PIN_NAME_MAX);
    expect(parsePin({ name: 'Spot', latitude: 91, longitude: 0 }).error).toBe('position');
    expect(parsePin({ name: 'Spot' }).error).toBe('position');
    expect(parsePin({ name: 'Spot', latitude: 1, longitude: 2, hidden: 'yes' }).error).toBe('hidden');
    // A change: only what's sent
    expect(parsePin({ notes: 'Best tavern' }, { partial: true })).toEqual({ value: { notes: 'Best tavern' } });
  });

  it("have visits dated like a moment, or not at all, with up to 50 of the map's photos", () => {
    const visit = parsePinVisit({ visitedOn: '2024-08', notes: 'Hot', photoIds: [] });
    expect(visit.value.data).toEqual({ visitedOn: new Date(Date.UTC(2024, 7, 1)), datePrecision: 'MONTH', notes: 'Hot' });
    expect(parsePinVisit({}).value.data).toEqual({ visitedOn: null, datePrecision: null });
    expect(parsePinVisit({}, { partial: true }).value.data).toEqual({});
    expect(parsePinVisit({ visitedOn: '2024-13-01' }).error).toBe('date');
    const id = '0b9a3d5e-6c6f-4b8e-9b1c-3e2f1a0d9c7b';
    expect(parsePinVisit({ photoIds: [id, id] }).error).toBe('photos');
    expect(parsePinVisit({ photoIds: Array.from({ length: VISIT_PHOTOS_MAX + 1 }, () => crypto.randomUUID()) }).error).toBe('photos');
  });
});
