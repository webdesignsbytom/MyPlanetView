import { afterEach, describe, expect, it, vi } from 'vitest';
import { localDay, yearsAgoToday, yearsSince } from '@/utils/moments/anniversaries';
import {
  DATE_PRECISIONS,
  DATE_PRECISION_OPTIONS,
  MONTH_OPTIONS,
  compareMoments,
  formatMomentDate,
  momentCursor,
  momentDateBody,
  momentDateFields,
  parseMomentCursor,
  parseMomentDate,
} from '@/utils/moments/momentDates';
import * as kinds from '@/utils/moments/momentKinds';
import { googleMapsUrl, spotAudience, spotText } from '@/utils/moments/momentSpots';
// The server's copies, which the client's must match
import * as serverKinds from '../../../../../server/src/utils/constants/momentKinds.js';
import * as serverMoments from '../../../../../server/src/utils/moments.js';

describe('anniversaries', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('gives the viewer’s own today', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 11, 31, 12));
    expect(localDay()).toBe('2027-12-31');
  });

  it('counts the years since a moment’s day and words them', () => {
    expect(yearsSince('2016-11-23', '2026-11-23')).toBe(10);
    expect(yearsSince('2025-11-23', '2026-11-23')).toBe(1);
    expect(yearsAgoToday(1)).toBe('A year ago today');
    expect(yearsAgoToday(10)).toBe('10 years ago today');
  });
});

describe('momentKinds', () => {
  it('is the same as the server’s list, in the same order, with the same labels', () => {
    expect(kinds.MOMENT_KINDS).toEqual(serverKinds.MOMENT_KINDS);
    expect(kinds.MOMENT_KIND_LABELS).toEqual(serverKinds.MOMENT_KIND_LABELS);
  });

  it('keeps the server’s limits', () => {
    for (const name of ['MOMENT_TITLE_MAX', 'MOMENT_TEXT_MAX', 'MOMENT_PLACE_MAX', 'MOMENT_PHOTOS_MAX', 'MOMENT_PAGE_DEFAULT', 'MOMENT_PAGE_MAX']) {
      expect(kinds[name], name).toBe(serverMoments[name]);
    }
  });

  it('offers every kind with its label, and knows a kind', () => {
    expect(kinds.MOMENT_KIND_OPTIONS).toHaveLength(kinds.MOMENT_KINDS.length);
    expect(kinds.MOMENT_KIND_OPTIONS[0]).toEqual({ value: 'BORN', label: 'Born' });
    expect(kinds.isMomentKind('ANNIVERSARY')).toBe(true);
    expect(kinds.isMomentKind('born')).toBe(false);
    expect(kinds.isMomentKind(null)).toBe(false);
  });

  it('suggests Lived for a birth or a move, Visited for anything else', () => {
    expect(kinds.statusForKind('BORN')).toBe('LIVED');
    expect(kinds.statusForKind('MOVED_HERE')).toBe('LIVED');
    expect(kinds.statusForKind('WEDDING')).toBe('VISITED');
  });
});

describe('parseMomentDate', () => {
  const inputs = [
    [undefined, undefined],
    [undefined, 'DAY'],
    [null, undefined],
    ['', null],
    [null, 'DAY'],
    ['2019', undefined],
    ['2019-06', undefined],
    ['2019-06-14', undefined],
    ['2019-06-14', 'MONTH'],
    ['2019-06-14', 'YEAR'],
    ['2019-06', 'DAY'],
    ['2019', 'MONTH'],
    ['2019-02-29', 'DAY'],
    ['2020-02-29', 'DAY'],
    ['2019-13', undefined],
    ['1799', undefined],
    ['2200-12-31', undefined],
    ['2201', undefined],
    ['14/06/2019', undefined],
    [2019, undefined],
    ['2019-06-14', 'WEEK'],
  ];

  // The server keeps the day as a Date, the client as its YYYY-MM-DD
  const asDay = (result) =>
    result.value?.happenedOn instanceof Date ? { ...result, value: { ...result.value, happenedOn: result.value.happenedOn.toISOString().slice(0, 10) } } : result;

  it('answers as the server’s does, for every case', () => {
    for (const [happenedOn, precision] of inputs) {
      expect(parseMomentDate(happenedOn, precision), `${happenedOn} ${precision}`).toEqual(asDay(serverMoments.parseMomentDate(happenedOn, precision)));
    }
  });

  it('keeps a month or a year as its first day, and never a finer precision than written', () => {
    expect(parseMomentDate('2019-06-14', 'MONTH')).toEqual({ ok: true, value: { happenedOn: '2019-06-01', datePrecision: 'MONTH' } });
    expect(parseMomentDate('2019', undefined)).toEqual({ ok: true, value: { happenedOn: '2019-01-01', datePrecision: 'YEAR' } });
    expect(parseMomentDate('2019-06', 'DAY')).toEqual({ ok: false });
    expect(parseMomentDate('2019-02-29', 'DAY')).toEqual({ ok: false });
    expect(parseMomentDate(null)).toEqual({ ok: true, value: { happenedOn: null, datePrecision: null } });
    expect(parseMomentDate(undefined)).toEqual({ ok: true, value: undefined });
    expect(DATE_PRECISIONS).toEqual(serverMoments.DATE_PRECISIONS);
  });
});

describe('the date on the form and in words', () => {
  it('words a day, a month, a year or nothing', () => {
    expect(formatMomentDate({ happenedOn: '2019-06-14', datePrecision: 'DAY' })).toBe('14 Jun 2019');
    expect(formatMomentDate({ happenedOn: '2019-06-01', datePrecision: 'MONTH' })).toBe('June 2019');
    expect(formatMomentDate({ happenedOn: '2019-01-01', datePrecision: 'YEAR' })).toBe('2019');
    expect(formatMomentDate({ happenedOn: '2019-13-01', datePrecision: 'MONTH' })).toBe('2019-13');
    expect(formatMomentDate({ happenedOn: null })).toBe('');
    expect(formatMomentDate()).toBe('');
  });

  it('fills the form’s fields from a moment, or empty for a new one', () => {
    expect(momentDateFields({ happenedOn: '2019-06-14', datePrecision: 'DAY' })).toEqual({ precision: 'DAY', day: '2019-06-14', month: '06', year: '2019' });
    expect(momentDateFields({ happenedOn: '2019-06-01', datePrecision: 'MONTH' })).toEqual({ precision: 'MONTH', day: '', month: '06', year: '2019' });
    expect(momentDateFields({ happenedOn: '2019-01-01', datePrecision: 'YEAR' })).toEqual({ precision: 'YEAR', day: '', month: '', year: '2019' });
    expect(momentDateFields(null)).toEqual({ precision: 'NONE', day: '', month: '', year: '' });
  });

  it('turns the fields back into the body, or says what’s missing', () => {
    expect(momentDateBody({ precision: 'NONE' })).toEqual({ happenedOn: null, datePrecision: null });
    expect(momentDateBody({ precision: 'DAY', day: '2019-06-14' })).toEqual({ happenedOn: '2019-06-14', datePrecision: 'DAY' });
    expect(momentDateBody({ precision: 'MONTH', month: '06', year: ' 2019 ' })).toEqual({ happenedOn: '2019-06-01', datePrecision: 'MONTH' });
    expect(momentDateBody({ precision: 'YEAR', year: '2019' })).toEqual({ happenedOn: '2019-01-01', datePrecision: 'YEAR' });
    expect(momentDateBody({ precision: 'DAY', day: '' })).toEqual({ error: 'Choose the day, or say less about the date.' });
    expect(momentDateBody({ precision: 'MONTH', month: '', year: '2019' })).toEqual({ error: 'Choose the month and a year from 1800 to 2200.' });
    expect(momentDateBody({ precision: 'YEAR', year: '1700' })).toEqual({ error: 'Give a year from 1800 to 2200.' });
    expect(momentDateBody({ precision: 'DAY', day: '2019-02-30' })).toEqual({ error: 'That date doesn’t exist.' });
  });

  it('offers every precision and month', () => {
    expect(DATE_PRECISION_OPTIONS.map((o) => o.value)).toEqual(['DAY', 'MONTH', 'YEAR', 'NONE']);
    expect(MONTH_OPTIONS[0]).toEqual({ value: '01', label: 'January' });
    expect(MONTH_OPTIONS[11]).toEqual({ value: '12', label: 'December' });
  });
});

describe('compareMoments and the cursor', () => {
  it('sorts oldest first, undated last, then by id', () => {
    const moments = [
      { id: 'b', happenedOn: null },
      { id: 'c', happenedOn: '2020-01-01' },
      { id: 'a', happenedOn: null },
      { id: 'b', happenedOn: '2019-06-01' },
      { id: 'a', happenedOn: '2020-01-01' },
    ];
    expect(moments.sort(compareMoments).map((m) => `${m.happenedOn}:${m.id}`)).toEqual([
      '2019-06-01:b', '2020-01-01:a', '2020-01-01:c', 'null:a', 'null:b',
    ]);
    expect(compareMoments({ id: 'a', happenedOn: null }, { id: 'a', happenedOn: null })).toBe(0);
  });

  it('writes and reads the paging cursor as the server does', () => {
    expect(momentCursor({ id: 'm1', happenedOn: '2019-06-14' })).toBe('2019-06-14_m1');
    expect(momentCursor({ id: 'm2', happenedOn: null })).toBe('undated_m2');
    // The server's ids are UUIDs (it refuses others; the mock's ids aren't, so the client doesn't), and its day a Date
    const id = '3f2b8c1e-5d4a-4c7b-9e2f-1a2b3c4d5e6f';
    for (const cursor of [undefined, '', `2019-06-14_${id}`, `undated_${id}`, `2019-02-30_${id}`, `yesterday_${id}`, '2019-06-14', 42]) {
      const server = serverMoments.parseMomentCursor(cursor);
      const day = server.value?.happenedOn instanceof Date ? { ...server, value: { ...server.value, happenedOn: server.value.happenedOn.toISOString().slice(0, 10) } } : server;
      expect(parseMomentCursor(cursor), String(cursor)).toEqual(day);
    }
    expect(parseMomentCursor('2019-06-14_m_1')).toEqual({ ok: true, value: { happenedOn: '2019-06-14', id: 'm_1' } });
    expect(parseMomentCursor('undated_m2')).toEqual({ ok: true, value: { happenedOn: null, id: 'm2' } });
    expect(parseMomentCursor('2019-02-30_m1')).toEqual({ ok: false });
  });
});

describe('momentSpots', () => {
  it('writes a spot in degrees with its hemispheres', () => {
    expect(spotText({ latitude: 48.8584, longitude: 2.2945 })).toBe('48.85840° N, 2.29450° E');
    expect(spotText({ latitude: -33.8568, longitude: -151.2153 })).toBe('33.85680° S, 151.21530° W');
  });

  it('links the spot to Google Maps', () => {
    expect(googleMapsUrl({ latitude: 48.8584, longitude: -2.2945 })).toBe('https://www.google.com/maps/search/?api=1&query=48.858400%2C-2.294500');
  });

  it('says who sees the spot', () => {
    expect(spotAudience(true)).toBe('Everyone the map is shared with sees this spot');
    expect(spotAudience(false)).toBe('Only you and the map’s editors see this spot');
  });
});
