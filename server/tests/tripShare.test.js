// "Welcome home" emails: the rules (src/utils/tripShare.js), pure, and each list's own
// unsubscribe link (src/utils/onThisDay.js).
import { describe, expect, it } from 'vitest';
import {
  TRIP_SHARE_WINDOW_DAYS,
  pickTripToShare,
  tripDays,
  tripNotOverYet,
  tripShareWindow,
  tripShareWords,
} from '../src/utils/tripShare.js';
import { EMAIL_LISTS, tokenMatches, unsubscribeToken } from '../src/utils/onThisDay.js';

describe('tripShareWindow', () => {
  it('looks for trips that ended yesterday back to a week ago (UTC days)', () => {
    expect(TRIP_SHARE_WINDOW_DAYS).toBe(7);
    expect(tripShareWindow(new Date('2026-11-23T08:00:00Z'))).toEqual({
      from: new Date('2026-11-16T00:00:00Z'),
      to: new Date('2026-11-22T00:00:00Z'),
    });
  });
  it('counts by the UTC day, whatever the hour', () => {
    expect(tripShareWindow(new Date('2026-03-01T23:59:59Z')).to).toEqual(new Date('2026-02-28T00:00:00Z'));
    expect(tripShareWindow(new Date('2026-01-01T00:00:00Z')).from).toEqual(new Date('2025-12-25T00:00:00Z'));
  });
});

describe('tripNotOverYet', () => {
  const now = new Date('2026-11-23T15:00:00Z');
  it('is true for a trip ending today or later', () => {
    expect(tripNotOverYet(new Date('2026-11-23T00:00:00Z'), now)).toBe(true);
    expect(tripNotOverYet(new Date('2027-01-01T00:00:00Z'), now)).toBe(true);
  });
  it('is false for one that has ended, or has no end', () => {
    expect(tripNotOverYet(new Date('2026-11-22T00:00:00Z'), now)).toBe(false);
    expect(tripNotOverYet(null, now)).toBe(false);
  });
});

describe('tripDays', () => {
  it('counts both the first and the last day', () => {
    expect(tripDays(new Date('2026-06-01'), new Date('2026-06-09'))).toBe(9);
    expect(tripDays(new Date('2026-06-01'), new Date('2026-06-01'))).toBe(1);
    expect(tripDays(new Date('2026-02-27'), new Date('2026-03-02'))).toBe(4);
  });
  it('is null without both days, or the wrong way round', () => {
    expect(tripDays(null, new Date('2026-06-09'))).toBeNull();
    expect(tripDays(new Date('2026-06-09'), null)).toBeNull();
    expect(tripDays(new Date('2026-06-09'), new Date('2026-06-01'))).toBeNull();
  });
});

describe('pickTripToShare', () => {
  it('picks the trip that ended last', () => {
    const trips = [
      { tripId: 'a', title: 'Ghent', endDate: new Date('2026-06-05') },
      { tripId: 'b', title: 'Rome', endDate: new Date('2026-06-09') },
      { tripId: 'c', title: 'Lyon', endDate: new Date('2026-06-07') },
    ];
    expect(pickTripToShare(trips).tripId).toBe('b');
  });
  it('picks the same one again when two ended the same day', () => {
    const trips = [
      { tripId: 'z', title: 'Rome', endDate: new Date('2026-06-09') },
      { tripId: 'y', title: 'Nice', endDate: new Date('2026-06-09') },
    ];
    expect(pickTripToShare(trips).tripId).toBe('y');
    expect(pickTripToShare([...trips].reverse()).tripId).toBe('y');
  });
  it('is null for none', () => {
    expect(pickTripToShare([])).toBeNull();
    expect(pickTripToShare(null)).toBeNull();
  });
});

describe('tripShareWords', () => {
  it('welcomes them home from the trip', () => {
    expect(tripShareWords({ title: 'Japan in spring', days: 12, places: 1, countryName: 'Japan' })).toEqual({
      subject: 'Welcome home from Japan in spring',
      headline: 'Welcome home from Japan in spring!',
      caption: '12 days in Japan',
    });
  });
  it('counts the countries of a trip to several', () => {
    expect(tripShareWords({ title: 'Interrail', days: 21, places: 6, countryName: 'France' }).caption).toBe('6 countries in 21 days');
  });
  it('reads "in the" for the countries that take it, and one day as one', () => {
    expect(tripShareWords({ title: 'Amsterdam', days: 1, places: 1, countryName: 'Netherlands' }).caption).toBe('1 day in the Netherlands');
  });
  it('says only how long without a place, and nothing without the days', () => {
    expect(tripShareWords({ title: 'Away', days: 3 }).caption).toBe('3 days away');
    expect(tripShareWords({ title: 'Away', days: null, places: 2 }).caption).toBe('');
  });
});

describe('each email’s own unsubscribe link', () => {
  it('signs the list, so one email’s link never stops another', () => {
    const onThisDay = unsubscribeToken('user-1', 's3cret');
    const trips = unsubscribeToken('user-1', 's3cret', EMAIL_LISTS.tripShare);
    expect(onThisDay).toBe(unsubscribeToken('user-1', 's3cret', EMAIL_LISTS.onThisDay));
    expect(tokenMatches(trips, onThisDay)).toBe(false);
    expect(tokenMatches(trips, unsubscribeToken('user-1', 's3cret', 'trips'))).toBe(true);
    expect(tokenMatches(trips, unsubscribeToken('user-2', 's3cret', 'trips'))).toBe(false);
  });
});
