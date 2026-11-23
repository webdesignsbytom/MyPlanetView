// Life's One Shots (24 Nov 2026, the user's wish and name): the catalogue, a tick's rules, the
// lines on the globe a flight crossed and what they suggest (src/utils/oneShots.js).
import { describe, expect, it } from 'vitest';
import { BIG_FIVE, ONE_SHOTS, ONE_SHOT_AUTO, ONE_SHOT_BY_KEY, ONE_SHOT_GROUPS, ONE_SHOT_LISTS, isOneShotKey } from '../src/utils/constants/oneShots.js';
import {
  ONE_SHOT_NOTES_MAX,
  POLAR_CIRCLE_LATITUDE,
  flightCrossings,
  greatCirclePoints,
  oneShotCounts,
  oneShotSuggestions,
  parseOneShotInput,
} from '../src/utils/oneShots.js';
import { airportByCode } from '../src/utils/flights.js';
import { COUNTRIES } from '../prisma/seed/data/countries.js';

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';

describe('the catalogue', () => {
  it('holds about 80 animals, 30 wonders and 40 journeys, each key once', () => {
    const count = (list) => ONE_SHOTS.filter((shot) => shot.list === list).length;
    expect(count('WILDLIFE')).toBe(80);
    expect(count('WONDERS')).toBe(32);
    expect(count('JOURNEYS')).toBe(43);
    expect(new Set(ONE_SHOTS.map((shot) => shot.key)).size).toBe(ONE_SHOTS.length);
    expect(ONE_SHOT_LISTS).toEqual(['WILDLIFE', 'WONDERS', 'JOURNEYS']);
  });

  it('gives each item a list, a group of that list, a name, an article and places that exist', () => {
    const codes = new Set(COUNTRIES.map((country) => country.code));
    for (const shot of ONE_SHOTS) {
      expect(ONE_SHOT_GROUPS[shot.list], shot.key).toContain(shot.group);
      expect(shot.key, shot.key).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(shot.name.length, shot.key).toBeGreaterThan(2);
      expect(shot.wiki.length, shot.key).toBeGreaterThan(2);
      for (const code of shot.countries) expect(codes.has(code), `${shot.key} ${code}`).toBe(true);
    }
    // Every group has something in it
    for (const list of ONE_SHOT_LISTS) for (const group of ONE_SHOT_GROUPS[list]) expect(ONE_SHOTS.some((s) => s.list === list && s.group === group), group).toBe(true);
  });

  it('has volcanoes, no disasters, the Big Five, and the four lines a flight crosses', () => {
    expect(ONE_SHOTS.filter((shot) => shot.group === 'volcanoes').map((shot) => shot.key)).toEqual(
      expect.arrayContaining(['erupting-volcano', 'flowing-lava', 'lava-lake', 'crater-rim', 'fumaroles']),
    );
    expect(ONE_SHOTS.some((shot) => /earthquake|cyclone|hurricane|tornado|twister|tsunami/i.test(`${shot.key} ${shot.name}`))).toBe(false);
    expect(BIG_FIVE.every((key) => ONE_SHOT_BY_KEY.get(key)?.list === 'WILDLIFE')).toBe(true);
    expect(ONE_SHOTS.filter((shot) => shot.auto).map((shot) => shot.auto).sort()).toEqual([...ONE_SHOT_AUTO].sort());
    expect(isOneShotKey('northern-lights')).toBe(true);
    expect(isOneShotKey('unicorn')).toBe(false);
    expect(isOneShotKey(undefined)).toBe(false);
  });
});

describe('parseOneShotInput', () => {
  it('takes a date as a moment’s, a country, a photo, a note and the travellers', () => {
    const parsed = parseOneShotInput('lion', {
      seenOn: '2024-03',
      countryCode: 'KE',
      photoId: T1,
      notes: '  Two cubs, at dawn \u0000 ',
      travellerIds: [T1, T2],
    });
    expect(parsed.ok).toBe(true);
    expect(parsed.value).toEqual({
      seenOn: new Date(Date.UTC(2024, 2, 1)),
      datePrecision: 'MONTH',
      countryCode: 'KE',
      photoId: T1,
      notes: 'Two cubs, at dawn',
      travellerIds: [T1, T2],
    });
  });

  it('leaves out what isn’t given, and clears what’s null', () => {
    expect(parseOneShotInput('lion', {})).toEqual({ ok: true, value: {} });
    expect(parseOneShotInput('lion', { seenOn: null, countryCode: '', photoId: null, notes: '' }).value).toEqual({
      seenOn: null,
      datePrecision: null,
      countryCode: null,
      photoId: null,
      notes: null,
    });
  });

  it('cuts a long note', () => {
    expect(parseOneShotInput('lion', { notes: 'x'.repeat(900) }).value.notes).toHaveLength(ONE_SHOT_NOTES_MAX);
  });

  it('refuses an unknown item and every bad field', () => {
    expect(parseOneShotInput('unicorn', {})).toEqual({ ok: false, field: 'itemKey' });
    expect(parseOneShotInput('lion', { seenOn: '2024-02-31' })).toEqual({ ok: false, field: 'seenOn' });
    expect(parseOneShotInput('lion', { seenOn: '2024', datePrecision: 'DAY' })).toEqual({ ok: false, field: 'seenOn' });
    expect(parseOneShotInput('lion', { countryCode: 'kenya' })).toEqual({ ok: false, field: 'countryCode' });
    expect(parseOneShotInput('lion', { photoId: 'photo-1' })).toEqual({ ok: false, field: 'photoId' });
    expect(parseOneShotInput('lion', { notes: 5 })).toEqual({ ok: false, field: 'notes' });
    expect(parseOneShotInput('lion', { travellerIds: [T1, T1] })).toEqual({ ok: false, field: 'travellerIds' });
    expect(parseOneShotInput('lion', { travellerIds: 'T1' })).toEqual({ ok: false, field: 'travellerIds' });
    expect(parseOneShotInput('lion', { travellerIds: Array.from({ length: 21 }, () => T1) })).toEqual({ ok: false, field: 'travellerIds' });
  });

  it('takes a flight as the source only for a line a flight can cross', () => {
    expect(parseOneShotInput('equator', { source: 'FLIGHT' }).value).toEqual({ source: 'FLIGHT' });
    expect(parseOneShotInput('lion', { source: 'FLIGHT' })).toEqual({ ok: false, field: 'source' });
    expect(parseOneShotInput('equator', { source: 'GPS' })).toEqual({ ok: false, field: 'source' });
  });
});

describe('the lines a flight crossed', () => {
  const at = (code) => airportByCode(code);

  it('follows the great circle, both ends included', () => {
    const points = greatCirclePoints({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 90 }, 4);
    expect(points).toHaveLength(5);
    expect(points[2].longitude).toBeCloseTo(45, 6);
    expect(points[4].longitude).toBeCloseTo(90, 6);
    expect(greatCirclePoints({ latitude: 10, longitude: 10 }, { latitude: 10, longitude: 10 })).toHaveLength(2);
  });

  it('crosses the equator from one hemisphere to the other', () => {
    expect([...flightCrossings(at('LHR'), at('JNB'))]).toEqual(['EQUATOR']);
    expect(flightCrossings(at('LHR'), at('CDG')).size).toBe(0);
  });

  it('crosses the Date Line over the Pacific, and the Arctic Circle on the way north', () => {
    expect(flightCrossings(at('NRT'), at('HNL')).has('DATE_LINE')).toBe(true);
    expect(flightCrossings(at('LAX'), at('SYD'))).toEqual(new Set(['EQUATOR', 'DATE_LINE']));
    expect(flightCrossings(at('OSL'), at('TOS'))).toEqual(new Set(['ARCTIC_CIRCLE']));
    // Over the far south, past the Antarctic Circle
    expect(flightCrossings({ latitude: -60, longitude: -60 }, { latitude: -60, longitude: 120 }).has('ANTARCTIC_CIRCLE')).toBe(true);
    expect(POLAR_CIRCLE_LATITUDE).toBeCloseTo(66.56, 2);
  });
});

describe('oneShotSuggestions', () => {
  const flight = (id, from, to, flownOn) => ({ id, fromAirport: from, toAirport: to, flownOn: new Date(`${flownOn}T00:00:00Z`) });

  it('suggests each line from the earliest flight that crossed it, in the catalogue’s order', () => {
    const suggestions = oneShotSuggestions({
      flights: [flight('f2', 'LHR', 'JNB', '2024-05-01'), flight('f1', 'LHR', 'NBO', '2019-03-02'), flight('f3', 'NRT', 'HNL', '2022-08-09')],
      airportOf: airportByCode,
    });
    expect(suggestions).toEqual([
      { itemKey: 'equator', seenOn: '2019-03-02', from: 'FLIGHT', flight: { id: 'f1', fromAirport: 'LHR', toAirport: 'NBO', flownOn: '2019-03-02' } },
      { itemKey: 'date-line', seenOn: '2022-08-09', from: 'FLIGHT', flight: { id: 'f3', fromAirport: 'NRT', toAirport: 'HNL', flownOn: '2022-08-09' } },
    ]);
  });

  it('never suggests what’s ticked, and reads the poles as the polar circles crossed', () => {
    const suggestions = oneShotSuggestions({
      flights: [flight('f1', 'LHR', 'NBO', '2019-03-02')],
      airportOf: airportByCode,
      visited: new Set(['XN', 'XS']),
      ticked: new Set(['equator']),
    });
    expect(suggestions).toEqual([
      { itemKey: 'arctic-circle', seenOn: null, from: 'PLACE', code: 'XN' },
      { itemKey: 'antarctic-circle', seenOn: null, from: 'PLACE', code: 'XS' },
    ]);
  });

  it('skips a flight between airports it doesn’t know', () => {
    expect(oneShotSuggestions({ flights: [flight('f1', 'ZZZ', 'NBO', '2019-03-02')], airportOf: airportByCode })).toEqual([]);
  });
});

describe('oneShotCounts', () => {
  it('counts each list and the Big Five, each item once, unknown keys left out', () => {
    expect(oneShotCounts(['lion', 'lion', 'leopard', 'northern-lights', 'equator', 'unicorn'])).toEqual({ WILDLIFE: 2, WONDERS: 1, JOURNEYS: 1, bigFive: 2 });
    expect(oneShotCounts([...BIG_FIVE]).bigFive).toBe(5);
  });
});
