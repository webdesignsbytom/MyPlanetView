import { describe, expect, it } from 'vitest';
import { firstStopFor, plannedOutlineCodes, plannedTripsByPlace, plannedTripsFor } from '@/utils/trips/plannedTrips';
import { COUNTDOWN_DAYS, countdownWords, daysUntil, whenWords } from '@/utils/trips/tripCountdown';
import { TRIP_STATUSES, TRIP_STATUS_LABELS } from '@/utils/trips/tripStatus';

const trip = (id, status, startDate, countryCodes, title = id) => ({ id, status, startDate, countryCodes, title });

describe('plannedTripsByPlace', () => {
  const trips = [
    trip('later', 'PLANNED', '2027-06-01', ['JP', 'XE']),
    trip('away', 'ACTIVE', '2026-11-20', ['FR']),
    trip('done', 'COMPLETED', '2026-01-01', ['JP']),
    trip('undated', 'PLANNED', null, ['JP']),
    trip('soon', 'PLANNED', '2027-01-10', ['JP', 'JP', 'XB']),
    trip('nowhere', 'PLANNED', '2027-01-01', []),
  ];

  it('groups planned and under-way trips by place, soonest first, undated last', () => {
    const byPlace = plannedTripsByPlace(trips, true);
    expect([...byPlace.keys()].sort()).toEqual(['FR', 'ID', 'JP', 'XE']);
    expect(byPlace.get('JP').map((t) => t.id)).toEqual(['soon', 'later', 'undated']);
    expect(byPlace.get('FR').map((t) => t.id)).toEqual(['away']);
    expect(byPlace.get('ID').map((t) => t.id)).toEqual(['soon']);
  });

  it('places a UK nation as the UK on a map that doesn’t split it', () => {
    const byPlace = plannedTripsByPlace(trips, false);
    expect(byPlace.has('XE')).toBe(false);
    expect(byPlace.get('GB').map((t) => t.id)).toEqual(['later']);
  });

  it('breaks a tie on the date by title, and copes with no trips', () => {
    const tied = [trip('b', 'PLANNED', '2027-01-01', ['PE'], 'Peru B'), trip('a', 'PLANNED', '2027-01-01', ['PE'], 'Peru A')];
    expect(plannedTripsByPlace(tied).get('PE').map((t) => t.id)).toEqual(['a', 'b']);
    expect(plannedTripsByPlace([]).size).toBe(0);
  });
});

describe('plannedOutlineCodes and plannedTripsFor', () => {
  const byPlace = plannedTripsByPlace([trip('t', 'PLANNED', '2027-01-01', ['JP', 'FR', 'IT', 'XB'])]);

  it('outlines the planned places the map hasn’t visited or lived in', () => {
    const visits = { FR: 'VISITED', IT: 'LIVED', JP: 'WANT_TO_GO' };
    expect(plannedOutlineCodes(byPlace, visits)).toEqual(new Set(['JP', 'ID']));
  });

  it('lists a region’s country’s trips on its ticket', () => {
    expect(plannedTripsFor(byPlace, 'XB').map((t) => t.id)).toEqual(['t']);
    expect(plannedTripsFor(byPlace, 'JP').map((t) => t.id)).toEqual(['t']);
    expect(plannedTripsFor(byPlace, 'PE')).toEqual([]);
  });

  it('starts a trip from a region as its country, named for the region', () => {
    expect(firstStopFor('XB', 'Bali')).toEqual({ countryCode: 'ID', placeName: 'Bali' });
    expect(firstStopFor('JP', 'Japan')).toEqual({ countryCode: 'JP' });
  });
});

describe('tripCountdown', () => {
  it('counts whole days, across months and clock changes', () => {
    expect(COUNTDOWN_DAYS).toBe(365);
    expect(daysUntil('2026-12-04', '2026-11-22')).toBe(12);
    expect(daysUntil('2027-03-29', '2027-03-27')).toBe(2);
    expect(daysUntil('2026-11-22', '2026-11-22')).toBe(0);
    expect(daysUntil('2026-11-20T10:00:00Z', '2026-11-22')).toBe(-2);
  });

  it('words the countdown', () => {
    expect(countdownWords('Japan in spring', 12)).toBe('12 days until Japan in spring');
    expect(countdownWords('Japan in spring', 1)).toBe('1 day until Japan in spring');
    expect(countdownWords('Japan in spring', 1200)).toBe('1,200 days until Japan in spring');
    expect(countdownWords('Japan in spring', 0)).toBe('Japan in spring starts today');
    expect(countdownWords('Japan in spring', -3)).toBe('Japan in spring starts today');
  });

  const japan = {
    name: 'Japan',
    months: ['avoid', 'avoid', 'best', 'best', 'good', 'avoid', 'avoid', 'avoid', 'avoid', 'best', 'best', 'avoid'],
  };

  it('says how the trip’s month suits the place', () => {
    expect(whenWords(japan, '2027-04-02')).toBe('April is the best time for Japan.');
    expect(whenWords(japan, '2027-05-02')).toBe('May is a good time for Japan; the best is March to April and October to November.');
    expect(whenWords(japan, '2027-07-02')).toBe('July isn’t the best time for Japan: the best is March to April and October to November.');
  });

  it('says less when the guide has no best months, and nothing without a guide or a date', () => {
    const noBest = { name: 'Atlantis', months: Array(12).fill('good').map((m, i) => (i === 0 ? 'avoid' : m)) };
    expect(whenWords(noBest, '2027-05-01')).toBe('May is a good time for Atlantis.');
    expect(whenWords(noBest, '2027-01-01')).toBe('');
    expect(whenWords(null, '2027-01-01')).toBe('');
    expect(whenWords({ name: 'X', months: [] }, '2027-01-01')).toBe('');
    expect(whenWords(japan, null)).toBe('');
  });
});

describe('tripStatus', () => {
  it('names each status', () => {
    expect(TRIP_STATUSES.map((s) => s.value)).toEqual(['PLANNED', 'ACTIVE', 'COMPLETED']);
    expect(TRIP_STATUS_LABELS).toEqual({ PLANNED: 'Planning', ACTIVE: 'On the trip', COMPLETED: 'Done' });
  });
});
