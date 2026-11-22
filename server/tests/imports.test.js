// Importing from Polarsteps: the keys and the trips the browser sends (src/utils/imports.js), pure.
import { describe, expect, it } from 'vitest';
import { IMPORT_MAX_TRIPS, firstDatesOf, parseImportKey, parseImportedTrips } from '../src/utils/imports.js';

const day = (text) => new Date(`${text}T00:00:00Z`);

describe('parseImportKey', () => {
  it('takes a Polarsteps key of the right kind', () => {
    expect(parseImportKey('polarsteps:trip:10825444', 'trip')).toEqual({ ok: true, value: 'polarsteps:trip:10825444' });
    expect(parseImportKey('polarsteps:photo:98177523/IMG_0042.jpg', 'photo').ok).toBe(true);
    expect(parseImportKey(undefined, 'photo')).toEqual({ ok: true, value: undefined });
  });
  it('refuses another kind, another source or odd characters', () => {
    for (const value of ['polarsteps:photo:1', 'other:trip:1', 'polarsteps:trip:', 'polarsteps:trip:a b', 'polarsteps:trip:<x>', 42]) {
      expect(parseImportKey(value, 'trip').ok).toBe(false);
    }
  });
});

describe('parseImportedTrips', () => {
  const trip = (extra = {}) => ({
    key: 'polarsteps:trip:1',
    title: 'USA 2024',
    status: 'COMPLETED',
    startDate: '2024-04-09',
    endDate: '2024-04-11',
    stops: [
      { countryCode: 'us', placeName: 'Llano', arriveOn: '2024-04-09', latitude: 30.75, longitude: -98.67 },
      { countryCode: 'US', placeName: '<b>Houston</b>', arriveOn: '2024-04-10', leaveOn: '2024-04-11' },
    ],
    ...extra,
  });

  it('cleans each trip and stop', () => {
    const { trips } = parseImportedTrips({ trips: [trip()] });
    expect(trips).toEqual([
      {
        key: 'polarsteps:trip:1',
        title: 'USA 2024',
        status: 'COMPLETED',
        startDate: day('2024-04-09'),
        endDate: day('2024-04-11'),
        stops: [
          { countryCode: 'US', placeName: 'Llano', arriveOn: day('2024-04-09'), leaveOn: null, latitude: 30.75, longitude: -98.67 },
          { countryCode: 'US', placeName: 'Houston', arriveOn: day('2024-04-10'), leaveOn: day('2024-04-11'), latitude: null, longitude: null },
        ],
      },
    ]);
  });

  it('gives an untitled trip a title, and drops an end before the start', () => {
    const { trips } = parseImportedTrips({ trips: [trip({ title: '', startDate: '2024-04-09', endDate: '2024-04-01' })] });
    expect(trips[0]).toMatchObject({ title: 'A trip', startDate: day('2024-04-09'), endDate: null });
  });

  it('refuses a bad list, key, status, date or country', () => {
    expect(parseImportedTrips({})).toEqual({ error: 'invalidImport' });
    expect(parseImportedTrips({ trips: [] })).toEqual({ error: 'invalidImport' });
    expect(parseImportedTrips({ trips: Array.from({ length: IMPORT_MAX_TRIPS + 1 }, () => trip()) })).toEqual({ error: 'invalidImport' });
    expect(parseImportedTrips({ trips: [trip({ key: 'polarsteps:photo:1' })] })).toEqual({ error: 'invalidImport' });
    expect(parseImportedTrips({ trips: [trip({ status: 'DONE' })] })).toEqual({ error: 'invalidImport' });
    expect(parseImportedTrips({ trips: [trip({ startDate: '2024-02-31' })] })).toEqual({ error: 'invalidImport' });
    expect(parseImportedTrips({ trips: [trip({ stops: [{ countryCode: 'USA' }] })] })).toEqual({ error: 'invalidImport' });
  });
});

describe('firstDatesOf', () => {
  it('takes each country’s earliest stop, or the trip’s start', () => {
    const dates = firstDatesOf({
      startDate: day('2024-04-01'),
      stops: [
        { countryCode: 'FR', arriveOn: day('2024-04-05') },
        { countryCode: 'FR', arriveOn: day('2024-04-03') },
        { countryCode: 'ES', arriveOn: null },
      ],
    });
    expect(dates).toEqual(new Map([['FR', day('2024-04-03')], ['ES', day('2024-04-01')]]));
  });
});
