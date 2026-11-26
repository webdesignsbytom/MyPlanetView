import { describe, expect, it } from 'vitest';
import {
  BOOK_MAX_PX,
  BOOK_MIN_PX,
  STAMP_SHAPES,
  bookFitHeight,
  bookLeaves,
  hashOf,
  passportCover,
  photoCountText,
  stampDate,
  stampDescription,
  stampLook,
  visaLeafIndex,
} from '@/utils/passport/passportBook';
import { STAMP_GEOMETRY, fitName } from '@/utils/passport/stampShapes';

describe('hashOf', () => {
  it('gives the same unsigned 32-bit number for the same text', () => {
    expect(hashOf('landmark-1')).toBe(hashOf('landmark-1'));
    expect(hashOf('landmark-1')).not.toBe(hashOf('landmark-2'));
    expect(hashOf(42)).toBe(hashOf('42'));
    const value = hashOf('Ω emoji 🗺️');
    expect(Number.isInteger(value) && value >= 0 && value < 2 ** 32).toBe(true);
  });
});

describe('passportCover', () => {
  it('dresses the cover by the owner’s plan, Economy’s when it’s missing', () => {
    expect(passportCover({ id: 'FREE' })).toEqual({ label: 'Economy', look: 'passport-economy', frame: null });
    expect(passportCover({ id: 'REGULAR' })).toEqual({ label: 'Business Class', look: 'passport-business', frame: 'blind' });
    expect(passportCover({ id: 'PREMIUM' })).toEqual({ label: 'First Class', look: 'passport-first', frame: 'foil' });
    expect(passportCover(null).look).toBe('passport-economy');
    expect(passportCover({ id: 'GOLD' }).look).toBe('passport-economy');
  });
});

describe('stampLook', () => {
  it('gives a landmark the same shape, tilt and ink every time', () => {
    expect(stampLook('colosseum')).toEqual(stampLook('colosseum'));
  });

  it('keeps the tilt within ten degrees and uses every shape across many stamps', () => {
    const shapes = new Set();
    const inks = new Set();
    for (let i = 0; i < 200; i++) {
      const look = stampLook(`italy-${i}`);
      expect(STAMP_SHAPES).toContain(look.shape);
      expect(Number.isInteger(look.tilt)).toBe(true);
      expect(Math.abs(look.tilt)).toBeLessThanOrEqual(10);
      shapes.add(look.shape);
      inks.add(look.ink);
    }
    expect(shapes.size).toBe(STAMP_SHAPES.length);
    expect(inks.size).toBe(4);
  });
});

describe('words', () => {
  it('prints a stamp’s date as a rubber stamp does', () => {
    expect(stampDate('2019-04-12')).toBe('12 APR 2019');
    expect(stampDate(null)).toBe('');
  });

  it('counts photos', () => {
    expect(photoCountText(1)).toBe('1 photo');
    expect(photoCountText(0)).toBe('0 photos');
    expect(photoCountText(3)).toBe('3 photos');
  });

  it('describes a stamp for a screen reader', () => {
    expect(stampDescription({ name: 'Colosseum', stampedOn: '2019-04-12', isUnesco: true, photoCount: 2 })).toBe(
      'Colosseum, stamped 12 Apr 2019, UNESCO World Heritage Site, 2 photos',
    );
    expect(stampDescription({ name: 'Big Ben', stampedOn: null, isUnesco: false, photoCount: 1 })).toBe('Big Ben, stamped, 1 photo');
  });
});

describe('bookLeaves', () => {
  it('orders the cover, the travellers, a visa page per country and the totals', () => {
    const pages = [{ countryCode: 'FR' }, { countryCode: 'XE' }];
    expect(bookLeaves({ pages })).toEqual([
      { key: 'cover', kind: 'cover', label: 'Cover' },
      { key: 'travellers', kind: 'travellers', label: 'Travellers' },
      { key: 'visa-FR', kind: 'visa', label: 'France', page: pages[0] },
      { key: 'visa-XE', kind: 'visa', label: 'England', page: pages[1] },
      { key: 'totals', kind: 'totals', label: 'Totals' },
    ]);
  });
});

describe('visaLeafIndex', () => {
  const leaves = bookLeaves({ pages: [{ countryCode: 'FR' }, { countryCode: 'XE' }] });

  it('finds a place’s visa page among the leaves (the celebration opens the passport there)', () => {
    expect(visaLeafIndex(leaves, 'FR')).toBe(2);
    expect(visaLeafIndex(leaves, 'XE')).toBe(3);
  });

  it('finds none for a place with no page, or no place', () => {
    expect(visaLeafIndex(leaves, 'JP')).toBe(-1);
    expect(visaLeafIndex(leaves, null)).toBe(-1);
    expect(visaLeafIndex(leaves, '')).toBe(-1);
  });
});

describe('STAMP_GEOMETRY', () => {
  it('draws every stamp shape, with its name curve, date curve and marks', () => {
    expect(Object.keys(STAMP_GEOMETRY).sort()).toEqual([...STAMP_SHAPES].sort());
    for (const shape of Object.values(STAMP_GEOMETRY)) {
      expect(shape.width).toBeGreaterThan(0);
      expect(shape.height).toBeGreaterThan(0);
      expect(shape.name.d).toMatch(/^M/);
      expect(shape.name.length).toBeGreaterThan(0);
      expect(shape.name.max).toBeGreaterThan(0);
      expect(shape.date.d).toMatch(/^M/);
      expect(shape.marks.length).toBeGreaterThan(0);
    }
  });
});

describe('fitName', () => {
  const curve = { length: 230, max: 14 };

  it('sets a short name in capitals at the largest size', () => {
    expect(fitName('Petra', curve)).toEqual({ text: 'PETRA', size: 14 });
  });

  it('sets a longer name smaller so it fits', () => {
    const { text, size } = fitName('Historic Centre of Rome', curve);
    expect(text).toBe('HISTORIC CENTRE OF ROME');
    expect(size).toBeLessThan(14);
    expect(size).toBeGreaterThanOrEqual(7.5);
    expect(size * text.length * 0.74).toBeCloseTo(230, 5);
  });

  it('cuts a name too long even at the smallest size, with an ellipsis', () => {
    const name = 'Archaeological Ensemble of the Bend of the Boyne and Its Surrounding Monuments';
    const { text, size } = fitName(name, curve);
    expect(size).toBe(7.5);
    expect(text.endsWith('…')).toBe(true);
    expect(text.length).toBeLessThanOrEqual(Math.floor(230 / (7.5 * 0.74)));
    expect(name.toUpperCase().startsWith(text.slice(0, -1))).toBe(true);
  });
});

describe('bookFitHeight', () => {
  it('fits the book between its top and its page bar on the first view (1440×900, under the title card)', () => {
    // 900 less the bar (72), the gap above it (16) and its own from the foot (8), less the book's top
    expect(bookFitHeight({ viewport: 900, top: 265, bar: 72 })).toBe(539);
  });

  it('stays 40rem where there’s room', () => {
    expect(bookFitHeight({ viewport: 1080, top: 265, bar: 72 })).toBe(BOOK_MAX_PX);
    expect(bookFitHeight({ viewport: 2000, top: 0, bar: 72 })).toBe(BOOK_MAX_PX);
  });

  it('never below 28rem, so a spread’s pages aren’t cramped, while book and bar still fit once scrolled to', () => {
    expect(bookFitHeight({ viewport: 720, top: 265, bar: 72 })).toBe(BOOK_MIN_PX);
    expect(BOOK_MIN_PX + 72 + 16 + 8).toBeLessThanOrEqual(720);
  });

  it('on a very short screen, as tall as fits with the bar, and never under 240 pixels', () => {
    expect(bookFitHeight({ viewport: 500, top: 265, bar: 72 })).toBe(396);
    expect(bookFitHeight({ viewport: 200, top: 100, bar: 72 })).toBe(240);
  });
});
