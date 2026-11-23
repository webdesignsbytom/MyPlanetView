// @vitest-environment node
// Each country's own map (src/utils/map/countryMapGeo.js, countryMapInfo.js): which map a
// place opens, loading one, and its Lambert azimuthal equal-area frames there and back.
import { describe, expect, it } from 'vitest';
import {
  countryMapCodeFor,
  countryMapInfo,
  fromFrame,
  loadCountryMap,
  placeOnCountryMap,
  positionOnCountryMap,
  toFrame,
} from '@/utils/map/countryMapGeo';
import { COUNTRY_MAP_INFO } from '@/utils/map/countryMapInfo';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';

const PARIS = [48.8566, 2.3522];
// A main frame centred on France, and an inset for Corsica's box
const main = { lat: 46.5, lng: 2.5, scale: 2000, x: 1000, y: 900 };
const inset = { lat: 42.1, lng: 9.1, scale: 3000, x: 200, y: 300, area: [41, 43.2, -1.5, 1.5], box: [100, 150, 200, 300] };
const geo = { frames: [main, inset] };

describe('countryMapCodeFor', () => {
  it('opens a country’s own map, or a nation’s', () => {
    expect(countryMapCodeFor('FR')).toBe('FR');
    expect(countryMapCodeFor('XE')).toBe('XE');
    expect(countryMapCodeFor('VA')).toBe('VA');
  });

  it('opens a region’s country’s map', () => {
    expect(countryMapCodeFor('XB')).toBe('ID');
    expect(countryMapCodeFor('XH')).toBe('US');
  });

  it('has none for Antarctica, the poles, or an unknown code', () => {
    for (const code of ['AQ', 'XN', 'QS', 'ZZ', undefined]) expect(countryMapCodeFor(code)).toBeNull();
  });
});

describe('countryMapInfo', () => {
  it('says how many states a map has and what they’re called', () => {
    expect(countryMapInfo('FR')).toBe(COUNTRY_MAP_INFO.FR);
    expect(countryMapInfo('ZZ')).toBeNull();
  });

  it('has a loadable map behind every entry, each with a count and both words', () => {
    for (const [code, info] of Object.entries(COUNTRY_MAP_INFO)) {
      expect(countryMapCodeFor(code), code).toBe(code);
      expect(COUNTRY_BY_CODE[code], code).toBeDefined();
      expect(Number.isInteger(info.count) && info.count > 0, code).toBe(true);
      expect(info.word, code).toHaveLength(2);
      expect(info.word.every((word) => typeof word === 'string' && word), code).toBe(true);
    }
  });
});

describe('loadCountryMap', () => {
  it('loads a map once a visit', async () => {
    const first = loadCountryMap('VA');
    expect(loadCountryMap('VA')).toBe(first);
    const map = await first;
    expect(map.frames.length).toBeGreaterThan(0);
    expect(map.height).toBeGreaterThan(0);
    expect(map.word).toEqual(COUNTRY_MAP_INFO.VA.word);
    expect(map.areas).toHaveLength(COUNTRY_MAP_INFO.VA.count);
  });

  it('refuses a place with no map', async () => {
    await expect(loadCountryMap('AQ')).rejects.toThrow('No country map for AQ');
  });

  it('places Paris on France’s canvas, and back', { timeout: 20000 }, async () => {
    const france = await loadCountryMap('FR');
    const { x, y } = placeOnCountryMap(france, ...PARIS);
    expect(x > 0 && x < 2000 && y > 0 && y < france.height).toBe(true);
    const back = positionOnCountryMap(france, x, y);
    expect(back.latitude).toBeCloseTo(PARIS[0], 6);
    expect(back.longitude).toBeCloseTo(PARIS[1], 6);
  });
});

describe('toFrame and fromFrame', () => {
  it('put the frame’s centre at its point', () => {
    expect(toFrame(main, main.lat, main.lng)).toEqual({ x: 1000, y: 900 });
    expect(fromFrame(main, 1000, 900)).toEqual({ latitude: 46.5, longitude: 2.5 });
  });

  it('put the north up and the east right', () => {
    const north = toFrame(main, 48, 2.5);
    const east = toFrame(main, 46.5, 5);
    expect(north.y).toBeLessThan(900);
    expect(east.x).toBeGreaterThan(1000);
  });

  it('turn a position there and back', () => {
    for (const [lat, lng] of [PARIS, [43.3, 5.37], [51.0, -4.5], [-21.1, 55.5]]) {
      const { x, y } = toFrame(main, lat, lng);
      const back = fromFrame(main, x, y);
      expect(back.latitude).toBeCloseTo(lat, 8);
      expect(back.longitude).toBeCloseTo(lng, 8);
    }
  });

  it('wrap longitudes across the date line', () => {
    const fiji = { lat: -17.8, lng: 178.1, scale: 5000, x: 1000, y: 800 };
    const east = toFrame(fiji, -17, -179.9);
    expect(east.x).toBeGreaterThan(1000);
    expect(fromFrame(fiji, east.x, east.y).longitude).toBeCloseTo(-179.9, 8);
  });
});

describe('placeOnCountryMap and positionOnCountryMap', () => {
  it('place a position in an inset’s area on the inset, anything else on the main land', () => {
    expect(placeOnCountryMap(geo, ...PARIS)).toEqual(toFrame(main, ...PARIS));
    expect(placeOnCountryMap(geo, 42.0, 9.0)).toEqual(toFrame(inset, 42.0, 9.0));
    // Inside the inset's latitudes but too far east of its centre
    expect(placeOnCountryMap(geo, 42.0, 12.0)).toEqual(toFrame(main, 42.0, 12.0));
  });

  it('read a point inside an inset’s box with the inset, anything else with the main land', () => {
    expect(positionOnCountryMap(geo, 200, 300)).toEqual({ latitude: 42.1, longitude: 9.1 });
    expect(positionOnCountryMap(geo, 1000, 900)).toEqual({ latitude: 46.5, longitude: 2.5 });
    // The box's edge counts as inside
    expect(positionOnCountryMap(geo, 100, 150)).toEqual(fromFrame(inset, 100, 150));
  });

  it('use the main land alone on a map with no insets', () => {
    expect(placeOnCountryMap({ frames: [main] }, 42.0, 9.0)).toEqual(toFrame(main, 42.0, 9.0));
    expect(positionOnCountryMap({ frames: [main] }, 200, 300)).toEqual(fromFrame(main, 200, 300));
  });
});
