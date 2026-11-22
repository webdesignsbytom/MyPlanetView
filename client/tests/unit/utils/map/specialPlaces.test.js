// @vitest-environment node
// Special places (src/utils/map/specialPlaces.js): Antarctica and the four poles, never
// counted as countries; and the parents a visit brings (the South Pole's Antarctica, a
// region's country). A copy of the server's rules (server/tests/specialPlaces.test.js).
import { describe, expect, it } from 'vitest';
import {
  CONTINENT_TOTAL,
  PARENT_PLACE,
  POLE_CODES,
  POLE_LATITUDE,
  SPECIAL_PLACE_CODES,
  SPECIAL_PLACE_TOTAL,
  impliedVisits,
  isAntarctic,
  isMagneticPole,
  isPole,
  isSpecialPlace,
  poleAt,
  withParentPlaces,
} from '@/utils/map/specialPlaces';
import { SPECIAL_PLACES } from '@/utils/map/countries';
import * as server from '../../../../../server/src/utils/specialPlaces.js';

describe('special places', () => {
  it('knows Antarctica and the four poles, and which are points', () => {
    expect(['AQ', 'XN', 'QN', 'XS', 'QS'].every(isSpecialPlace)).toBe(true);
    expect(isSpecialPlace('FR')).toBe(false);
    expect(isPole('AQ')).toBe(false);
    expect(isPole('QS')).toBe(true);
    expect(POLE_CODES.every(isPole)).toBe(true);
    expect(SPECIAL_PLACE_TOTAL).toBe(5);
    expect(CONTINENT_TOTAL).toBe(7);
  });

  it('tells the magnetic poles from the geographic ones', () => {
    expect(isMagneticPole('QN')).toBe(true);
    expect(isMagneticPole('QS')).toBe(true);
    expect(isMagneticPole('XN')).toBe(false);
    expect(isMagneticPole('XS')).toBe(false);
    expect(isMagneticPole('AQ')).toBe(false);
  });

  it('knows what the Antarctica setting hides: Antarctica and the two south poles', () => {
    expect(['AQ', 'XS', 'QS'].every(isAntarctic)).toBe(true);
    expect(isAntarctic('XN')).toBe(false);
    expect(isAntarctic('QN')).toBe(false);
    expect(isAntarctic('AR')).toBe(false);
  });

  it('are the country list’s SPECIAL rows', () => {
    expect(SPECIAL_PLACES.map((place) => place.code)).toEqual([...SPECIAL_PLACE_CODES]);
  });

  it('match the server’s copy', () => {
    expect(SPECIAL_PLACE_CODES).toEqual(server.SPECIAL_PLACE_CODES);
    expect(POLE_CODES).toEqual(server.POLE_CODES);
    expect(PARENT_PLACE).toEqual(server.PARENT_PLACE);
    expect(POLE_LATITUDE).toBe(server.POLE_LATITUDE);
  });
});

describe('withParentPlaces', () => {
  it('adds Antarctica to a South Pole visit, once, and nothing to the others', () => {
    expect(withParentPlaces(['XS'])).toEqual(['XS', 'AQ']);
    expect(withParentPlaces(['XS', 'AQ', 'FR'])).toEqual(['XS', 'AQ', 'FR']);
    expect(withParentPlaces(['QS', 'XN', 'QN'])).toEqual(['QS', 'XN', 'QN']);
    expect(withParentPlaces([])).toEqual([]);
  });

  it('adds a region’s country', () => {
    expect(PARENT_PLACE.XT).toBe('AU');
    expect(withParentPlaces(['XB'])).toEqual(['XB', 'ID']);
    expect(withParentPlaces(['NC', 'FR'])).toEqual(['NC', 'FR']);
  });

  it('gives what the server gives', () => {
    const codes = ['XS', 'XB', 'XH', 'US', 'QS', 'FR', 'XT'];
    expect(withParentPlaces(codes)).toEqual(server.withParentPlaces(codes));
  });
});

describe('impliedVisits', () => {
  it('adds Antarctica as visited when the South Pole is marked and Antarctica isn’t there', () => {
    expect(impliedVisits([], 'XS', 'VISITED')).toEqual([
      { countryCode: 'AQ', status: 'VISITED', source: 'MANUAL', firstVisitedOn: null, notes: null },
    ]);
  });

  it('adds a region’s country when the region is lived in', () => {
    expect(impliedVisits([{ countryCode: 'FR', status: 'VISITED' }], 'XB', 'LIVED')).toEqual([
      { countryCode: 'ID', status: 'VISITED', source: 'MANUAL', firstVisitedOn: null, notes: null },
    ]);
  });

  it('turns a “want to go” parent visited, keeping the rest of it', () => {
    const wish = { countryCode: 'AQ', status: 'WANT_TO_GO', source: 'TRIP', firstVisitedOn: null, notes: 'See the penguins' };
    expect(impliedVisits([wish], 'XS', 'VISITED')).toEqual([{ ...wish, status: 'VISITED', source: 'MANUAL' }]);
  });

  it('leaves a parent already visited or lived in as it is', () => {
    expect(impliedVisits([{ countryCode: 'AQ', status: 'VISITED' }], 'XS', 'LIVED')).toEqual([]);
    expect(impliedVisits([{ countryCode: 'US', status: 'LIVED' }], 'XH', 'VISITED')).toEqual([]);
  });

  it('brings nothing for “want to go” or for a place with no parent', () => {
    expect(impliedVisits([], 'XS', 'WANT_TO_GO')).toEqual([]);
    expect(impliedVisits([], 'XS', '')).toEqual([]);
    expect(impliedVisits([], 'QS', 'VISITED')).toEqual([]);
    expect(impliedVisits([], 'FR', 'VISITED')).toEqual([]);
  });
});

describe('poleAt', () => {
  it('places a position at a geographic pole within 0.1° of latitude', () => {
    expect(poleAt(90)).toBe('XN');
    expect(poleAt(89.9)).toBe('XN');
    expect(poleAt(89.89)).toBe(null);
    expect(poleAt(-89.9)).toBe('XS');
    expect(poleAt(-90)).toBe('XS');
    expect(poleAt(-89.89)).toBe(null);
    expect(poleAt(0)).toBe(null);
  });

  it('gives no pole for a latitude that isn’t a number', () => {
    expect(poleAt(Number.NaN)).toBe(null);
    expect(poleAt(undefined)).toBe(null);
    expect(poleAt('90')).toBe(null);
  });

  it('answers as the server does', () => {
    for (const latitude of [90, 89.95, 89.9, 89.89, 0, -89.89, -89.9, -90]) expect(poleAt(latitude)).toBe(server.poleAt(latitude));
  });
});
