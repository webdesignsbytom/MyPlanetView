// @vitest-environment node
// A trip's moments day by day (src/utils/trips/tripDays.js; 23 Nov 2026, the user's wish).
import { describe, expect, it } from 'vitest';
import { dayWords, tripMomentDays } from '@/utils/trips/tripDays';

const TRIP = {
  startDate: '2025-07-02',
  endDate: '2025-07-16',
  stops: [
    { position: 1, countryCode: 'IT', placeName: 'Florence', arriveOn: '2025-07-07', leaveOn: '2025-07-12' },
    { position: 0, countryCode: 'IT', landmarkName: 'Colosseum', placeName: 'Rome', arriveOn: '2025-07-02', leaveOn: '2025-07-07' },
    // Only its arrival: until the trip ends
    { position: 2, countryCode: 'IT', placeName: '', arriveOn: '2025-07-12' },
    // Undated: never "where"
    { position: 3, countryCode: 'FR' },
  ],
};
const moment = (id, happenedOn, datePrecision = 'DAY') => ({ id, title: id, happenedOn, datePrecision });

describe('dayWords', () => {
  it('writes the day as written, with its weekday', () => {
    expect(dayWords('2025-07-04')).toBe('Friday 4 July 2025');
    expect(dayWords('2024-02-29')).toBe('Thursday 29 February 2024');
  });
});

describe('tripMomentDays', () => {
  it('puts each moment under its day of the trip, in order, with where the trip was', () => {
    const days = tripMomentDays(TRIP, [moment('safari', '2025-07-09'), moment('arrive', '2025-07-02'), moment('gelato', '2025-07-09')]);
    expect(days.map((d) => [d.key, d.title, d.where, d.moments.map((m) => m.id)])).toEqual([
      ['2025-07-02', 'Day 1 · Wednesday 2 July 2025', 'Colosseum', ['arrive']],
      ['2025-07-09', 'Day 8 · Wednesday 9 July 2025', 'Florence', ['safari', 'gelato']],
    ]);
  });

  it('names both places on a day of travel, and the country for a stop with no name', () => {
    const [travel, late] = tripMomentDays(TRIP, [moment('a', '2025-07-07'), moment('b', '2025-07-14')]);
    expect(travel.where).toBe('Colosseum → Florence');
    expect(late.where).toBe('Italy');
  });

  it('dates a moment outside the trip without a day number, and puts the rest last', () => {
    const days = tripMomentDays(TRIP, [moment('later', '2025-08-01'), moment('month', '2025-07-01', 'MONTH'), moment('none', null, null), moment('before', '2025-06-30')]);
    expect(days.map((d) => d.title)).toEqual(['Monday 30 June 2025', 'Friday 1 August 2025', 'Other moments']);
    expect(days.at(-1)).toMatchObject({ key: 'other', where: null });
    expect(days.at(-1).moments.map((m) => m.id)).toEqual(['month', 'none']);
  });

  it('counts the days of a trip with no end date from its start', () => {
    const [day] = tripMomentDays({ startDate: '2025-01-30', stops: [] }, [moment('x', '2025-02-02')]);
    expect(day.title).toBe('Day 4 · Sunday 2 February 2025');
    expect(day.where).toBeNull();
  });

  it('is null for a trip with no start date, and empty with no moments', () => {
    expect(tripMomentDays({ startDate: null }, [moment('x', '2025-01-01')])).toBeNull();
    expect(tripMomentDays(TRIP, [])).toEqual([]);
  });
});
