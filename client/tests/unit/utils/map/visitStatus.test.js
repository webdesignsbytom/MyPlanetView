// @vitest-environment node
// How a country stands on a map and how it's drawn (src/utils/map/visitStatus.js): the
// statuses, the seven pastels (a region its country's, a UK nation its own), and the fill
// and outline classes.
import { describe, expect, it } from 'vitest';
import {
  PLANNED_OUTLINE,
  VISIT_STATUSES,
  VISIT_STATUS_LABELS,
  VISIT_STATUS_OPTIONS,
  countryFillClass,
  countsAsVisited,
  pastelFill,
  pastelNumberFor,
} from '@/utils/map/visitStatus';
import { COUNTRY_COLOUR } from '@/utils/map/countryStyle';
import { UK_NATION_COLOUR } from '@/utils/map/ukNations';

describe('the statuses', () => {
  it('are visited, lived there and want to go, with their words', () => {
    expect(VISIT_STATUSES.map((s) => s.value)).toEqual(['VISITED', 'LIVED', 'WANT_TO_GO']);
    expect(VISIT_STATUS_LABELS).toEqual({ VISITED: 'Visited', LIVED: 'Lived there', WANT_TO_GO: 'Want to go' });
  });

  it('offer “Not yet” first in a picker, which clears the country', () => {
    expect(VISIT_STATUS_OPTIONS[0]).toEqual({ value: '', label: 'Not yet' });
    expect(VISIT_STATUS_OPTIONS.slice(1)).toEqual(VISIT_STATUSES);
  });

  it('count visited and lived there as been', () => {
    expect(countsAsVisited('VISITED')).toBe(true);
    expect(countsAsVisited('LIVED')).toBe(true);
    expect(countsAsVisited('WANT_TO_GO')).toBe(false);
    expect(countsAsVisited(undefined)).toBe(false);
  });
});

describe('pastelFill', () => {
  it('gives each of the seven pastels its fill class', () => {
    expect(pastelFill(1)).toBe('fill-map-visit-1');
    expect(pastelFill(7)).toBe('fill-map-visit-7');
  });

  it('takes no number as the first, and wraps round after the seventh', () => {
    expect(pastelFill(undefined)).toBe('fill-map-visit-1');
    expect(pastelFill(0)).toBe('fill-map-visit-1');
    expect(pastelFill(8)).toBe('fill-map-visit-1');
    expect(pastelFill(9)).toBe('fill-map-visit-2');
  });
});

describe('pastelNumberFor', () => {
  it('is the country’s own colour', () => {
    expect(pastelNumberFor('FR')).toBe(COUNTRY_COLOUR.FR);
    expect(pastelNumberFor('GB')).toBe(COUNTRY_COLOUR.GB);
  });

  it('dresses a region in its country’s, not one of its own', () => {
    expect(pastelNumberFor('XB')).toBe(COUNTRY_COLOUR.ID);
    // New Caledonia was a country with a colour of its own until 18 Nov 2026: it wears France's now
    expect(COUNTRY_COLOUR.NC).not.toBe(COUNTRY_COLOUR.FR);
    expect(pastelNumberFor('NC')).toBe(COUNTRY_COLOUR.FR);
  });

  it('gives a UK nation its own', () => {
    for (const code of ['XE', 'XC', 'XW', 'XI']) expect(pastelNumberFor(code)).toBe(UK_NATION_COLOUR[code]);
  });

  it('falls back to the first for a place with no colour', () => {
    expect(pastelNumberFor('XN')).toBe(1);
    expect(pastelNumberFor('ZZ')).toBe(1);
  });
});

describe('countryFillClass', () => {
  it('draws a country in its pastel with the land’s edge, visited or not', () => {
    const plain = `${pastelFill(COUNTRY_COLOUR.FR)} stroke-map-land-edge`;
    expect(countryFillClass('FR', undefined)).toBe(plain);
    expect(countryFillClass('FR', 'VISITED')).toBe(plain);
    expect(countryFillClass('FR', 'LIVED')).toBe(plain);
  });

  it('dashes the outline of a country someone wants to go to', () => {
    expect(countryFillClass('JP', 'WANT_TO_GO')).toBe(`${pastelFill(COUNTRY_COLOUR.JP)} stroke-map-wish stroke-[1.4] [stroke-dasharray:3_2]`);
  });

  it('draws Antarctica as ice with an icy edge', () => {
    expect(countryFillClass('AQ', undefined)).toBe('fill-map-ice stroke-map-ice-edge');
    expect(countryFillClass('AQ', 'WANT_TO_GO')).toContain('fill-map-ice stroke-map-wish');
  });

  it('outlines a planned trip’s place in place of “want to go”', () => {
    expect(countryFillClass('JP', 'WANT_TO_GO', true)).toBe(`${pastelFill(COUNTRY_COLOUR.JP)} ${PLANNED_OUTLINE}`);
    expect(countryFillClass('JP', undefined, true)).toBe(`${pastelFill(COUNTRY_COLOUR.JP)} ${PLANNED_OUTLINE}`);
    expect(countryFillClass('AQ', undefined, true)).toBe(`fill-map-ice ${PLANNED_OUTLINE}`);
  });

  it('never outlines a place already visited or lived in for a planned trip', () => {
    expect(countryFillClass('FR', 'VISITED', true)).toBe(countryFillClass('FR', 'VISITED'));
    expect(countryFillClass('FR', 'LIVED', true)).toBe(countryFillClass('FR', 'LIVED'));
  });

  it('fills a region in its country’s pastel', () => {
    expect(countryFillClass('XT', undefined)).toBe(`${pastelFill(COUNTRY_COLOUR.AU)} stroke-map-land-edge`);
  });
});
