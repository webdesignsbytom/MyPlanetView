// A traveller's passport page (utils/passport/travellerDetails.js; 25 Nov 2026): the photo's
// crop, the drawn signature, the made-up passport number, and the server's rules copied
import { describe, expect, it } from 'vitest';
import {
  PORTRAIT_ZOOM_MAX,
  PORTRAIT_ZOOM_MIN,
  SIGNATURE_HEIGHT,
  SIGNATURE_MAX_LENGTH,
  SIGNATURE_WIDTH,
  dragFocus,
  parsePortrait,
  parseSignature,
  passportNumber,
  portraitStyle,
  strokesToPath,
  travellingSince,
} from '@/utils/passport/travellerDetails';
import * as server from '../../../../../server/src/utils/travellerPassport.js';

const PHOTO = '0f0e8a8e-5a1b-4c3d-9e7f-1234567890ab';

describe('the server’s rules, copied', () => {
  it('has the same limits', () => {
    expect([SIGNATURE_WIDTH, SIGNATURE_HEIGHT, SIGNATURE_MAX_LENGTH]).toEqual([server.SIGNATURE_WIDTH, server.SIGNATURE_HEIGHT, server.SIGNATURE_MAX_LENGTH]);
    expect([PORTRAIT_ZOOM_MIN, PORTRAIT_ZOOM_MAX]).toEqual([server.PORTRAIT_ZOOM_MIN, server.PORTRAIT_ZOOM_MAX]);
  });

  it('reads the same photos and signatures alike', () => {
    const portraits = [null, undefined, 'x', { photoId: PHOTO }, { photoId: PHOTO, focusX: 0.123456, focusY: 0, zoom: 3.9999 }, { photoId: PHOTO, zoom: 5 }, { photoId: 'photo-eiffel' }];
    for (const input of portraits) expect(parsePortrait(input), JSON.stringify(input)).toEqual(server.parsePortrait(input));
    const signatures = [null, '', 'M1 1L2 2', 'M10 50 L 20.25 40.04 L30,45', 'L1 1', 'M1 1', 'M1 1L301 1', 'M1 1Q2 2 3 3', 7];
    for (const input of signatures) expect(parseSignature(input), String(input)).toEqual(server.parseSignature(input));
  });

  it('lets the mock check its seed photos’ names as ids', () => {
    expect(parsePortrait({ photoId: 'photo-eiffel' }, { isId: () => true })).toEqual({ value: { photoId: 'photo-eiffel', focusX: 0.5, focusY: 0.5, zoom: 1 } });
  });

  it('starts travelling on the first trip that isn’t planned', () => {
    const trips = [
      { status: 'PLANNED', startDate: '2001-01-01' },
      { status: 'COMPLETED', startDate: '2014-05-01' },
      { status: 'ACTIVE', startDate: '2012-03-04T00:00:00.000Z' },
      { status: 'COMPLETED', startDate: null },
    ];
    expect(travellingSince(trips)).toBe('2012-03-04');
    expect(server.travellingSince(trips).toISOString().slice(0, 10)).toBe('2012-03-04');
    expect(travellingSince([])).toBeNull();
  });
});

describe('portraitStyle', () => {
  it('puts the focus at the same place in the box and zooms about it', () => {
    expect(portraitStyle({ focusX: 0.25, focusY: 0.4, zoom: 2 })).toEqual({ objectPosition: '25% 40%', transformOrigin: '25% 40%', transform: 'scale(2)' });
  });

  it('is the middle and no zoom by default, and never outside the photo', () => {
    expect(portraitStyle(null)).toEqual({ objectPosition: '50% 50%', transformOrigin: '50% 50%', transform: 'scale(1)' });
    expect(portraitStyle({ focusX: 3, focusY: -1, zoom: 9 })).toEqual({ objectPosition: '100% 0%', transformOrigin: '100% 0%', transform: 'scale(4)' });
  });
});

describe('dragFocus', () => {
  it('moves the focus the other way to the drag, less far when zoomed in', () => {
    expect(dragFocus({ focusX: 0.5, focusY: 0.5, zoom: 1 }, { dx: 20, dy: -10, width: 100, height: 200 })).toEqual({ focusX: 0.3, focusY: 0.55 });
    expect(dragFocus({ focusX: 0.5, focusY: 0.5, zoom: 2 }, { dx: 20, dy: 0, width: 100, height: 200 })).toEqual({ focusX: 0.4, focusY: 0.5 });
  });

  it('keeps it inside the photo', () => {
    expect(dragFocus({ focusX: 0.1, focusY: 0.9, zoom: 1 }, { dx: 500, dy: -500, width: 100, height: 100 })).toEqual({ focusX: 0, focusY: 1 });
  });
});

describe('passportNumber', () => {
  it('is two letters and seven digits, the same for a traveller every time, another for someone else', () => {
    const one = passportNumber('trav-test');
    expect(one).toMatch(/^MP\d{7}$/);
    expect(passportNumber('trav-test')).toBe(one);
    expect(passportNumber('trav-alex')).not.toBe(one);
  });
});

describe('strokesToPath', () => {
  it('writes each stroke as a line from its first point, to tenths', () => {
    expect(
      strokesToPath([
        [
          { x: 10, y: 50 },
          { x: 20.26, y: 40.04 },
        ],
        [
          { x: 100, y: 10 },
          { x: 110, y: 20 },
        ],
      ]),
    ).toBe('M10 50L20.3 40M100 10L110 20');
  });

  it('leaves out points closer than a unit, keeps a tap as a dot, and keeps it in the box', () => {
    expect(strokesToPath([[{ x: 10, y: 10 }, { x: 10.3, y: 10.2 }, { x: 15, y: 10 }]])).toBe('M10 10L15 10');
    expect(strokesToPath([[{ x: 40, y: 40 }]])).toBe('M40 40L40.5 40');
    expect(strokesToPath([[{ x: -5, y: 120 }, { x: 400, y: 50 }]])).toBe('M0 100L300 50');
    expect(strokesToPath([[], []])).toBe('');
  });

  it('draws what the server keeps as it is', () => {
    const path = strokesToPath([[{ x: 12.34, y: 56.78 }, { x: 99.99, y: 1 }, { x: 150, y: 60 }]]);
    expect(server.parseSignature(path)).toEqual({ value: path });
  });
});
