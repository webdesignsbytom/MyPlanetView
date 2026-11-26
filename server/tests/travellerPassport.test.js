// A traveller's passport page (25 Nov 2026, the user's wish; src/utils/travellerPassport.js):
// the photo's crop, the drawn signature, and when they started travelling. Pure.
import { describe, expect, it } from 'vitest';
import {
  PORTRAIT_ZOOM_MAX,
  SIGNATURE_MAX_LENGTH,
  parsePortrait,
  parseSignature,
  travellingSince,
} from '../src/utils/travellerPassport.js';

const PHOTO = '0f0e8a8e-5a1b-4c3d-9e7f-1234567890ab';

describe('parsePortrait', () => {
  it('takes a photo with its crop, rounded, or the middle and no zoom when left out', () => {
    expect(parsePortrait({ photoId: PHOTO, focusX: 0.33333, focusY: 1, zoom: 2.5 })).toEqual({
      value: { photoId: PHOTO, focusX: 0.333, focusY: 1, zoom: 2.5 },
    });
    expect(parsePortrait({ photoId: PHOTO })).toEqual({ value: { photoId: PHOTO, focusX: 0.5, focusY: 0.5, zoom: 1 } });
  });

  it('takes null to take it off', () => {
    expect(parsePortrait(null)).toEqual({ value: null });
  });

  it('refuses anything else: no photo id, a crop outside the photo, too far zoomed', () => {
    for (const bad of [
      undefined,
      'photo',
      [],
      { photoId: 'not-an-id' },
      { photoId: PHOTO, focusX: -0.1 },
      { photoId: PHOTO, focusY: 1.01 },
      { photoId: PHOTO, zoom: 0.9 },
      { photoId: PHOTO, zoom: PORTRAIT_ZOOM_MAX + 0.1 },
      { photoId: PHOTO, zoom: '2' },
      { photoId: PHOTO, focusX: Number.NaN },
    ]) {
      expect(parsePortrait(bad), JSON.stringify(bad)).toEqual({ error: true });
    }
  });
});

describe('parseSignature', () => {
  it('takes straight strokes inside the box, written the same way to tenths', () => {
    expect(parseSignature('M10 50 L 20.25 40.04 L30,45 M100 10L110.5 20')).toEqual({ value: 'M10 50L20.3 40L30 45M100 10L110.5 20' });
    expect(parseSignature('M0 0L300 100')).toEqual({ value: 'M0 0L300 100' });
  });

  it('takes null or nothing to take it off', () => {
    expect(parseSignature(null)).toEqual({ value: null });
    expect(parseSignature('')).toEqual({ value: null });
  });

  it('refuses a path that isn’t only straight strokes in the box', () => {
    for (const bad of [
      'L10 10L20 20',
      'M10 10',
      'M10 10 L 20',
      'M10 10L301 20',
      'M10 10L20 101',
      'M-1 10L20 20',
      'M10 10C20 20 30 30 40 40',
      'x M10 10L20 20',
      '<script>',
      42,
      `M1 1${'L2 2'.repeat(SIGNATURE_MAX_LENGTH / 4)}`,
    ]) {
      expect(parseSignature(bad), String(bad).slice(0, 30)).toEqual({ error: true });
    }
  });
});

describe('travellingSince', () => {
  it('is the earliest start of the trips they were on, leaving out planned ones and undated', () => {
    expect(
      travellingSince([
        { status: 'COMPLETED', startDate: new Date('2014-06-01') },
        { status: 'PLANNED', startDate: new Date('2001-01-01') },
        { status: 'ACTIVE', startDate: '2012-03-04' },
        { status: 'COMPLETED', startDate: null },
      ]),
    ).toEqual(new Date('2012-03-04'));
    expect(travellingSince([{ status: 'PLANNED', startDate: new Date('2027-01-01') }])).toBeNull();
    expect(travellingSince([])).toBeNull();
  });
});
