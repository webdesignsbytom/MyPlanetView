// Taking your travels with you: the pure rules (src/utils/travelCopies.js)
import { describe, expect, it } from 'vitest';
import { copyRoom, copySummary, earliestDates, parseCopyChoice, placeCopy } from '../src/utils/travelCopies.js';

const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('placeCopy', () => {
  it('keeps an ordinary country, and a photo with none', () => {
    expect(placeCopy({ countryCode: 'IT' }, true)).toEqual({ countryCode: 'IT', ukNation: null });
    expect(placeCopy({ countryCode: 'IT' }, false)).toEqual({ countryCode: 'IT', ukNation: null });
    expect(placeCopy({ countryCode: null }, true)).toEqual({ countryCode: null, ukNation: null });
  });

  it('puts a nation in the UK, remembering it, on a map that keeps the UK whole', () => {
    expect(placeCopy({ countryCode: 'XC' }, false)).toEqual({ countryCode: 'GB', ukNation: 'XC' });
    expect(placeCopy({ countryCode: 'XC' }, true)).toEqual({ countryCode: 'XC', ukNation: null });
  });

  it('puts the UK in its nation on a map that splits it: remembered, else from the position', () => {
    expect(placeCopy({ countryCode: 'GB', ukNation: 'XW' }, true)).toEqual({ countryCode: 'XW', ukNation: null });
    // Edinburgh
    expect(placeCopy({ countryCode: 'GB', latitude: 55.9533, longitude: -3.1883 }, true)).toEqual({ countryCode: 'XC', ukNation: null });
    // Nothing to go by: stays the UK ("nation not chosen")
    expect(placeCopy({ countryCode: 'GB' }, true)).toEqual({ countryCode: 'GB', ukNation: null });
    expect(placeCopy({ countryCode: 'GB', ukNation: 'XW' }, false)).toEqual({ countryCode: 'GB', ukNation: 'XW' });
  });

  it("puts a region in its country", () => {
    expect(placeCopy({ countryCode: 'XH' }, true)).toEqual({ countryCode: 'US', ukNation: null });
  });
});

describe('copyRoom', () => {
  it('counts what fits under the plan per place, the photos with no country as one more gallery', () => {
    const room = copyRoom({
      places: [...Array(40).fill('IT'), 'FR', 'FR', null],
      counts: { IT: 5, FR: 0, '': 30 },
      planId: 'FREE',
    });
    expect(room.photos).toBe(43);
    expect(room.countries).toEqual([
      { countryCode: 'IT', photos: 40, room: 25, fits: 25 },
      { countryCode: 'FR', photos: 2, room: 30, fits: 2 },
      { countryCode: null, photos: 1, room: 0, fits: 0 },
    ]);
    expect(room.fits).toBe(27);
  });

  it('fits more on a bigger plan', () => {
    expect(copyRoom({ places: Array(40).fill('IT'), counts: {}, planId: 'PREMIUM' }).fits).toBe(40);
  });
});

describe('parseCopyChoice', () => {
  const base = { toMapId: ID(1), travellerId: ID(2) };

  it('takes lists of ids and country codes, each once', () => {
    expect(parseCopyChoice({ ...base, tripIds: [ID(3), ID(3)], countryCodes: ['IT', 'IT'], photoIds: [ID(4)] })).toEqual({
      value: { ...base, tripIds: [ID(3)], momentIds: [], photoIds: [ID(4)], countryCodes: ['IT'] },
    });
  });

  it('refuses a bad target, traveller or list, and an empty choice', () => {
    expect(parseCopyChoice({ ...base, toMapId: 'x', tripIds: [ID(3)] }).error).toBe('invalidCopyTarget');
    expect(parseCopyChoice({ ...base, travellerId: null, tripIds: [ID(3)] }).error).toBe('invalidCopyTraveller');
    expect(parseCopyChoice({ ...base, tripIds: ['nope'] }).error).toBe('invalidCopyChoice');
    expect(parseCopyChoice({ ...base, countryCodes: ['italy'] }).error).toBe('invalidCopyChoice');
    expect(parseCopyChoice({ ...base, tripIds: 'all' }).error).toBe('invalidCopyChoice');
    expect(parseCopyChoice(base).error).toBe('emptyCopyChoice');
    expect(parseCopyChoice(null).error).toBe('invalidCopyChoice');
  });
});

describe('copySummary', () => {
  it('words what was copied', () => {
    expect(copySummary({ photos: 140, trips: 2, moments: 3 })).toBe('140 photos, 2 trips and 3 moments');
    expect(copySummary({ photos: 1, trips: 1, moments: 0 })).toBe('1 photo and 1 trip');
    expect(copySummary({ photos: 0, trips: 0, moments: 1 })).toBe('1 moment');
    expect(copySummary({ photos: 0, trips: 0, moments: 0 })).toBe('nothing');
  });
});

describe('earliestDates', () => {
  it('keeps the earliest date per place, ignoring rows with none', () => {
    const d = (s) => new Date(s);
    const dates = earliestDates([
      { countryCode: 'IT', date: d('2015-07-20') },
      { countryCode: 'IT', date: d('2015-07-03') },
      { countryCode: 'FR', date: d('2019-01-01') },
      { countryCode: 'FR', date: null },
      { countryCode: null, date: d('2010-01-01') },
    ]);
    expect([...dates]).toEqual([
      ['IT', d('2015-07-03')],
      ['FR', d('2019-01-01')],
    ]);
  });
});
