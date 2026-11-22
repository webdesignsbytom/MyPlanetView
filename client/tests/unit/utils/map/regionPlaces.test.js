// @vitest-environment node
// Regions (src/utils/map/regionPlaces.js): places inside a country with their own visit. A
// copy of the server's list, plus the client's own boxes of where each one is.
import { describe, expect, it } from 'vitest';
import { REGION_AREA, REGION_CODES, REGION_PARENT, inRegionArea, isRegion, regionParent } from '@/utils/map/regionPlaces';
import { COUNTRY_BY_CODE, REGION_PLACES } from '@/utils/map/countries';
import { positionFromMap } from '@/utils/map/projection';
import * as server from '../../../../../server/src/utils/regionPlaces.js';

describe('the regions', () => {
  it('are the server’s, each part of a country', () => {
    expect(REGION_PARENT).toEqual(server.REGION_PARENT);
    expect(REGION_CODES).toEqual(server.REGION_CODES);
    expect(REGION_CODES).toEqual(['XZ', 'XB', 'XA', 'XG', 'XH', 'NC', 'GS', 'XT']);
  });

  it('are the country list’s REGION rows, and each parent is a plain country', () => {
    expect(REGION_PLACES.map((place) => place.code).sort()).toEqual([...REGION_CODES].sort());
    for (const parent of Object.values(REGION_PARENT)) {
      expect(COUNTRY_BY_CODE[parent], parent).toBeDefined();
      expect(COUNTRY_BY_CODE[parent].kind, parent).toBeUndefined();
    }
  });

  it('know which codes are regions', () => {
    expect(isRegion('NC')).toBe(true);
    expect(isRegion('XB')).toBe(true);
    expect(isRegion('ID')).toBe(false);
    expect(isRegion('XE')).toBe(false);
    // Only its own keys: nothing from Object's prototype
    expect(isRegion('toString')).toBe(false);
  });

  it('give each region’s country, and null for anything else', () => {
    expect(regionParent('XB')).toBe('ID');
    expect(regionParent('XT')).toBe('AU');
    expect(regionParent('GS')).toBe('GB');
    expect(regionParent('FR')).toBeNull();
    expect(regionParent(undefined)).toBeNull();
  });

  it('can’t be changed', () => {
    expect(Object.isFrozen(REGION_PARENT)).toBe(true);
    expect(Object.isFrozen(REGION_CODES)).toBe(true);
    expect(Object.isFrozen(REGION_AREA)).toBe(true);
  });
});

describe('the regions’ boxes', () => {
  it('has one well-formed box per region', () => {
    expect(Object.keys(REGION_AREA).sort()).toEqual([...REGION_CODES].sort());
    for (const [code, { south, north, west, east }] of Object.entries(REGION_AREA)) {
      expect(south < north, code).toBe(true);
      expect(west < east, code).toBe(true);
    }
  });

  // [place, latitude, longitude, region]
  const INSIDE = [
    ['Ponta Delgada', 37.74, -25.67, 'XZ'],
    ['Denpasar', -8.65, 115.22, 'XB'],
    ['Puerto Ayora', -0.74, -90.31, 'XA'],
    ['Panaji', 15.49, 73.83, 'XG'],
    ['Honolulu', 21.31, -157.86, 'XH'],
    ['Nouméa', -22.27, 166.44, 'NC'],
    ['Grytviken', -54.28, -36.51, 'GS'],
    ['Hobart', -42.88, 147.33, 'XT'],
  ];

  it.each(INSIDE)('puts %s inside its region', (_place, latitude, longitude, region) => {
    expect(inRegionArea(region, latitude, longitude)).toBe(true);
  });

  // [place, latitude, longitude, the region it's not in]
  const OUTSIDE = [
    ['Funchal, Madeira (Portugal’s, not the Azores)', 32.65, -16.91, 'XZ'],
    ['Jakarta', -6.2, 106.8, 'XB'],
    ['Mataram, Lombok', -8.58, 116.12, 'XB'],
    ['Quito', -0.18, -78.47, 'XA'],
    ['Mumbai', 19.07, 72.88, 'XG'],
    ['Los Angeles', 34.05, -118.24, 'XH'],
    ['Paris', 48.86, 2.35, 'NC'],
    ['Stanley, the Falklands', -51.7, -57.85, 'GS'],
    ['Melbourne', -37.81, 144.96, 'XT'],
  ];

  it.each(OUTSIDE)('leaves %s out of the region', (_place, latitude, longitude, region) => {
    expect(inRegionArea(region, latitude, longitude)).toBe(false);
  });

  it('counts a box’s edge as outside it', () => {
    const { south, west } = REGION_AREA.XB;
    expect(inRegionArea('XB', south, 115)).toBe(false);
    expect(inRegionArea('XB', -8.5, west)).toBe(false);
  });

  it('has no box for a place that isn’t a region', () => {
    expect(inRegionArea('ID', -8.65, 115.22)).toBe(false);
  });

  it('holds each region’s own pin', () => {
    for (const place of REGION_PLACES) {
      const { latitude, longitude } = positionFromMap(place.pinX, place.pinY);
      expect(inRegionArea(place.code, latitude, longitude), place.code).toBe(true);
    }
  });
});
