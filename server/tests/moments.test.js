import { describe, it, expect } from 'vitest';
import { momentCursor, parseMomentCursor, parseMomentDate } from '../src/utils/moments.js';

const iso = (result) => result.value.happenedOn.toISOString().slice(0, 10);
const ID = '0b6c1d6e-1f7a-4a53-9a5e-2f8d6f1c9a10';

describe('parseMomentDate', () => {
  it('reads a day, a month or a year, each with its own precision', () => {
    const day = parseMomentDate('2019-06-14');
    expect(day.ok).toBe(true);
    expect(iso(day)).toBe('2019-06-14');
    expect(day.value.datePrecision).toBe('DAY');

    const month = parseMomentDate('2019-06');
    expect([iso(month), month.value.datePrecision]).toEqual(['2019-06-01', 'MONTH']);

    const year = parseMomentDate('2019');
    expect([iso(year), year.value.datePrecision]).toEqual(['2019-01-01', 'YEAR']);
  });

  it('stores a month or a year as its first day, whatever day is written', () => {
    const asYear = parseMomentDate('2019-06-14', 'YEAR');
    expect([iso(asYear), asYear.value.datePrecision]).toEqual(['2019-01-01', 'YEAR']);
    const asMonth = parseMomentDate('2019-06-14', 'MONTH');
    expect([iso(asMonth), asMonth.value.datePrecision]).toEqual(['2019-06-01', 'MONTH']);
    expect(parseMomentDate('2019-06', 'YEAR').value.happenedOn.toISOString()).toBe('2019-01-01T00:00:00.000Z');
    expect(parseMomentDate('2019-06-14', 'DAY').value.datePrecision).toBe('DAY');
  });

  it('never claims more than is written', () => {
    expect(parseMomentDate('2019', 'DAY').ok).toBe(false);
    expect(parseMomentDate('2019', 'MONTH').ok).toBe(false);
    expect(parseMomentDate('2019-06', 'DAY').ok).toBe(false);
  });

  it('tells missing (leave) from null or empty (an undated note)', () => {
    expect(parseMomentDate(undefined, undefined)).toEqual({ ok: true, value: undefined });
    expect(parseMomentDate(null, undefined)).toEqual({ ok: true, value: { happenedOn: null, datePrecision: null } });
    expect(parseMomentDate('', null)).toEqual({ ok: true, value: { happenedOn: null, datePrecision: null } });
  });

  it('refuses a precision without a date, or with none', () => {
    expect(parseMomentDate(undefined, 'YEAR').ok).toBe(false);
    expect(parseMomentDate(null, 'DAY').ok).toBe(false);
  });

  it('refuses dates that do not exist, bad forms and unknown precisions', () => {
    expect(parseMomentDate('2019-02-29').ok).toBe(false);
    expect(parseMomentDate('2019-02-31', 'YEAR').ok).toBe(false);
    expect(parseMomentDate('2019-13').ok).toBe(false);
    expect(parseMomentDate('2019-00-10').ok).toBe(false);
    expect(parseMomentDate('14/06/2019').ok).toBe(false);
    expect(parseMomentDate('2019-6-1').ok).toBe(false);
    expect(parseMomentDate('2019-06-14T10:00:00Z').ok).toBe(false);
    expect(parseMomentDate(2019).ok).toBe(false);
    expect(parseMomentDate('2019', 'DECADE').ok).toBe(false);
    expect(parseMomentDate('2019', 'year').ok).toBe(false);
  });

  it('keeps to a sane range of years', () => {
    expect(parseMomentDate('1800').ok).toBe(true);
    expect(parseMomentDate('2200-12-31').ok).toBe(true);
    expect(parseMomentDate('1799').ok).toBe(false);
    expect(parseMomentDate('2201').ok).toBe(false);
    expect(parseMomentDate('0000').ok).toBe(false);
  });

  it('accepts a leap day in a leap year', () => {
    expect(iso(parseMomentDate('2020-02-29'))).toBe('2020-02-29');
  });
});

describe('moment cursors', () => {
  it('round-trips a dated and an undated moment', () => {
    const dated = momentCursor({ id: ID, happenedOn: new Date('2019-06-01T00:00:00Z') });
    expect(dated).toBe(`2019-06-01_${ID}`);
    expect(parseMomentCursor(dated)).toEqual({ ok: true, value: { happenedOn: new Date('2019-06-01T00:00:00Z'), id: ID } });

    const undated = momentCursor({ id: ID, happenedOn: null });
    expect(undated).toBe(`undated_${ID}`);
    expect(parseMomentCursor(undated)).toEqual({ ok: true, value: { happenedOn: null, id: ID } });
  });

  it('treats a missing cursor as the first page', () => {
    expect(parseMomentCursor(undefined)).toEqual({ ok: true, value: undefined });
    expect(parseMomentCursor('')).toEqual({ ok: true, value: undefined });
  });

  it('refuses anything else', () => {
    expect(parseMomentCursor(ID).ok).toBe(false);
    expect(parseMomentCursor(`2019-02-31_${ID}`).ok).toBe(false);
    expect(parseMomentCursor('2019-06-01_not-an-id').ok).toBe(false);
    expect(parseMomentCursor(`someday_${ID}`).ok).toBe(false);
    expect(parseMomentCursor(['2019-06-01', ID]).ok).toBe(false);
  });
});
