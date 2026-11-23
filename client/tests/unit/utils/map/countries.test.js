// @vitest-environment node
// The country list (src/utils/map/countries.js), its derived lists, and the generated data
// every country needs: a colour (countryStyle.js), a shape or a micro-state's dot
// (countryShapes.js), a local name (countryLocalNames.js). The server's seed list is a copy
// (server/prisma/seed/data/countries.js): compared row by row.
import { describe, expect, it } from 'vitest';
import {
  CONTINENT_LABELS,
  COUNTRIES,
  COUNTRY_BY_CODE,
  COUNTRY_OPTIONS,
  COUNTRY_OPTION_GROUPS,
  HOME_COUNTRY_OPTIONS,
  PLAIN_COUNTRIES,
  POLE_PLACES,
  REGION_PLACES,
  SPECIAL_PLACES,
  UK_NATION_PLACES,
  countriesOnMap,
  countryName,
  countryOptionGroupsFor,
  countryOptionsFor,
} from '@/utils/map/countries';
import { COUNTRY_COLOUR, COUNTRY_LABEL_WIDTH } from '@/utils/map/countryStyle';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
import { UK_NATION_LABEL_WIDTH, UK_NATION_PINS, UK_NATION_SHAPES } from '@/utils/map/ukNationShapes';
import { LOCAL_NAMES, localNamesBeside } from '@/utils/map/countryLocalNames';
import { DETAIL_SHAPE_BOUNDS } from '@/utils/map/detailShapeBounds';
import { MAP_BOTTOM, MAP_TOP } from '@/utils/map/projection';
import { COUNTRIES as SERVER_COUNTRIES } from '../../../../../server/prisma/seed/data/countries.js';

// Drawn as dots, with no shape: the micro-states, and Goa (a region too small for one)
const DOTS = ['AD', 'GI', 'LI', 'MC', 'SM', 'SG', 'VA', 'XG'];
const codes = (list) => list.map((place) => place.code);

describe('the country list', () => {
  it('has 226 countries, five special places, the UK’s four nations and eight regions', () => {
    expect(PLAIN_COUNTRIES).toHaveLength(226);
    expect(codes(SPECIAL_PLACES)).toEqual(['AQ', 'XN', 'QN', 'XS', 'QS']);
    expect(codes(POLE_PLACES)).toEqual(['XN', 'QN', 'XS', 'QS']);
    expect(codes(UK_NATION_PLACES)).toEqual(['XE', 'XC', 'XW', 'XI']);
    expect(REGION_PLACES).toHaveLength(8);
    expect(COUNTRIES).toHaveLength(226 + 5 + 4 + 8);
  });

  it('gives every place a unique code and slug, a name and a pin on the map', () => {
    expect(new Set(codes(COUNTRIES)).size).toBe(COUNTRIES.length);
    expect(new Set(COUNTRIES.map((c) => c.slug)).size).toBe(COUNTRIES.length);
    for (const place of COUNTRIES) {
      expect(place.code, place.name).toMatch(/^[A-Z]{2}$/);
      expect(place.slug, place.code).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(place.name, place.code).toBeTruthy();
      expect(place.pinX >= 0 && place.pinX <= 2000, place.code).toBe(true);
      expect(place.pinY >= MAP_TOP && place.pinY <= MAP_BOTTOM, place.code).toBe(true);
    }
  });

  it('puts every country on a known continent, and a pole on none or Antarctica', () => {
    for (const place of COUNTRIES) {
      if (place.continent === null) expect(['XN', 'QN', 'QS'], place.code).toContain(place.code);
      else expect(CONTINENT_LABELS[place.continent], place.code).toBeTruthy();
    }
  });

  it('lists the countries A to Z', () => {
    const names = PLAIN_COUNTRIES.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('is the server’s seed list, row for row', () => {
    expect(COUNTRIES).toEqual(SERVER_COUNTRIES);
  });

  it('finds a place by its code, and names an unknown code as itself', () => {
    expect(COUNTRY_BY_CODE.FR.name).toBe('France');
    expect(countryName('JP')).toBe('Japan');
    expect(countryName('ZZ')).toBe('ZZ');
  });
});

describe('countriesOnMap', () => {
  it('is the plain countries on a map that doesn’t split the UK', () => {
    expect(countriesOnMap(false)).toBe(PLAIN_COUNTRIES);
  });

  it('puts the nations in the UK’s place on one that does, A to Z', () => {
    const split = countriesOnMap(true);
    expect(codes(split)).not.toContain('GB');
    for (const nation of ['XE', 'XC', 'XW', 'XI']) expect(codes(split)).toContain(nation);
    expect(split).toHaveLength(226 - 1 + 4);
    const names = split.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('the pickers’ options', () => {
  it('offer every country then the special places, never a nation or a region', () => {
    expect(COUNTRY_OPTIONS.map((o) => o.value)).toEqual([...codes(PLAIN_COUNTRIES), ...codes(SPECIAL_PLACES)]);
    expect(COUNTRY_OPTIONS[0]).toEqual({ value: PLAIN_COUNTRIES[0].code, label: PLAIN_COUNTRIES[0].name });
    expect(COUNTRY_OPTION_GROUPS.map((g) => [g.label, g.options.length])).toEqual([
      ['Countries', 226],
      ['Special places', 5],
    ]);
    expect(countryOptionsFor(false)).toBe(COUNTRY_OPTIONS);
    expect(countryOptionGroupsFor(false)).toBe(COUNTRY_OPTION_GROUPS);
  });

  it('offer the nations in the UK’s place on a map that splits it', () => {
    const values = countryOptionsFor(true).map((o) => o.value);
    expect(values).toContain('XC');
    expect(values).not.toContain('GB');
    expect(countryOptionGroupsFor(true)[0].options.map((o) => o.value)).toContain('XW');
    expect(countryOptionGroupsFor(true)[1].options).toHaveLength(5);
  });

  it('offer a birthplace among the countries and Antarctica, never a pole, nation or region', () => {
    const values = HOME_COUNTRY_OPTIONS.map((o) => o.value);
    expect(values).toContain('AQ');
    expect(values).toContain('GB');
    for (const code of ['XN', 'QN', 'XS', 'QS', 'XE', 'XB', 'NC']) expect(values).not.toContain(code);
    expect(values).toHaveLength(227);
  });
});

describe('the generated data every place needs', () => {
  it('gives every country one of the seven pastels', () => {
    for (const { code } of PLAIN_COUNTRIES) expect(COUNTRY_COLOUR[code] >= 1 && COUNTRY_COLOUR[code] <= 7, code).toBe(true);
  });

  it('gives every country and region a shape, or a dot for the micro-states and Goa', () => {
    for (const { code } of [...PLAIN_COUNTRIES, ...REGION_PLACES]) {
      if (DOTS.includes(code)) expect(COUNTRY_SHAPES[code], code).toBeUndefined();
      else expect(COUNTRY_SHAPES[code]?.length > 0, code).toBe(true);
    }
    expect(COUNTRY_SHAPES.AQ.length).toBeGreaterThan(0);
  });

  it('draws shapes only for places on the list', () => {
    for (const code of Object.keys(COUNTRY_SHAPES)) expect(COUNTRY_BY_CODE[code], code).toBeDefined();
    for (const code of Object.keys(COUNTRY_COLOUR)) expect(COUNTRY_BY_CODE[code], code).toBeDefined();
    for (const code of Object.keys(COUNTRY_LABEL_WIDTH)) expect(COUNTRY_BY_CODE[code], code).toBeDefined();
  });

  it('gives every shaped place a label width and detailed-outline bounds (Antarctica keeps its own drawing)', () => {
    for (const code of Object.keys(COUNTRY_SHAPES)) {
      expect(COUNTRY_LABEL_WIDTH[code] > 0, code).toBe(true);
      if (code !== 'AQ') expect(DETAIL_SHAPE_BOUNDS[code]?.length > 0, code).toBe(true);
    }
    for (const [code, boxes] of Object.entries(DETAIL_SHAPE_BOUNDS)) {
      for (const [minX, minY, maxX, maxY] of boxes) expect(minX <= maxX && minY <= maxY, code).toBe(true);
    }
  });

  it('gives each UK nation a shape, a label width and the country list’s own pin', () => {
    for (const nation of UK_NATION_PLACES) {
      expect(UK_NATION_SHAPES[nation.code].length, nation.code).toBeGreaterThan(0);
      expect(UK_NATION_LABEL_WIDTH[nation.code], nation.code).toBeGreaterThan(0);
      expect(UK_NATION_PINS[nation.code], nation.code).toEqual({ pinX: nation.pinX, pinY: nation.pinY });
    }
  });

  it('gives every country and nation its own local name, none to a special place', () => {
    for (const { code } of [...PLAIN_COUNTRIES, ...UK_NATION_PLACES]) {
      expect(LOCAL_NAMES[code]?.length > 0, code).toBe(true);
      for (const [lang, name] of LOCAL_NAMES[code]) {
        expect(Intl.getCanonicalLocales(lang)[0], `${code} ${lang}`).toBe(lang);
        expect(name, code).toBeTruthy();
      }
    }
    for (const { code } of SPECIAL_PLACES) expect(LOCAL_NAMES[code], code).toBeUndefined();
  });
});

describe('localNamesBeside', () => {
  it('shows only the local names that differ from the English one', () => {
    expect(localNamesBeside('PT', 'Portugal')).toEqual([]);
    expect(localNamesBeside('JP', 'Japan')).toEqual([{ lang: 'ja', name: '日本' }]);
    expect(localNamesBeside('CH', 'Switzerland').length).toBeGreaterThan(1);
  });

  it('counts a name differing only in case as the same, but not one with an accent', () => {
    expect(localNamesBeside('SZ', 'Eswatini')).toEqual([]);
    expect(localNamesBeside('MX', 'Mexico').map((n) => n.name)).toContain('México');
  });

  it('has none for a place with no local name', () => {
    expect(localNamesBeside('AQ', 'Antarctica')).toEqual([]);
  });
});
