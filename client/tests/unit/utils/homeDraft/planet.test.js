// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { HOME_DRAFT_PLACES } from '@/utils/homeDraft/destinations';
import { chooseNextCard, countryShape, INITIAL_CARDS, RECENT_MS, wrap } from '@/utils/homeDraft/planet';

const byId = (id) => HOME_DRAFT_PLACES.find((place) => place.id === id);
const ids = (places) => places.map((place) => place?.id ?? null);

// A stand-in for makePlanet's engine: the places in view, and each one's height on the
// screen by its latitude (north at the top)
const engineShowing = (visible) => ({
  canShow: (place) => visible.includes(place.id),
  screenY: (place) => -place.point[1],
});

const everyPhotoReady = new Set(HOME_DRAFT_PLACES.map((place) => place.id));

describe('wrap', () => {
  it('keeps a longitude in -180 to 180', () => {
    expect(wrap(0)).toBe(0);
    expect(wrap(190)).toBe(-170);
    expect(wrap(-190)).toBe(170);
    expect(wrap(540)).toBe(-180);
    expect(wrap(-45)).toBe(-45);
  });
});

describe('the cards and countries', () => {
  it('opens on Japan, Thailand and Australia', () => {
    expect(ids(INITIAL_CARDS)).toEqual(['392', '764', '036']);
  });

  it('has an outline for every destination’s country', () => {
    for (const place of HOME_DRAFT_PLACES) {
      const shape = countryShape(place.id);
      expect(shape?.type, place.country).toBe('GeometryCollection');
      expect(shape.geometries.length, place.country).toBeGreaterThan(0);
    }
    expect(countryShape('999')).toBeUndefined();
  });
});

describe('chooseNextCard', () => {
  const base = { places: HOME_DRAFT_PLACES, ready: everyPhotoReady, recent: new Map(), now: 100000, lon: 0, nextSlot: 0 };

  it('changes a card whose place has turned out of view', () => {
    const cards = [byId('392'), byId('764'), byId('036')];
    // Thailand has gone; Indonesia is in view
    const { slot, place } = chooseNextCard({ ...base, cards, engine: engineShowing(['392', '036', '360']) });
    expect(slot).toBe(1);
    expect(place.id).toBe('360');
  });

  it('otherwise changes the card whose turn it is', () => {
    const cards = [byId('392'), byId('764'), byId('036')];
    const { slot } = chooseNextCard({ ...base, cards, nextSlot: 2, engine: engineShowing(['392', '764', '036', '360']) });
    expect(slot).toBe(2);
  });

  it('only puts on a place in view, with its photo ready, that isn’t on a card already', () => {
    const cards = [byId('392'), byId('764'), byId('036')];
    const engine = engineShowing(['392', '764', '036', '360', '410']);
    expect(chooseNextCard({ ...base, cards, engine, ready: new Set(['410']) }).place.id).toBe('410');
    expect(chooseNextCard({ ...base, cards, engine, ready: new Set(['392']) }).place).toBeNull();
    expect(chooseNextCard({ ...base, cards, engine: engineShowing(['392', '764', '036']) }).place).toBeNull();
  });

  it('leaves out a place shown lately while another will do, but takes it rather than none', () => {
    const cards = [byId('392'), byId('764'), byId('036')];
    const engine = engineShowing(['392', '764', '036', '360', '410']);
    const recent = new Map([['360', base.now - 1000]]);
    expect(chooseNextCard({ ...base, cards, engine, recent, nextSlot: 1 }).place.id).toBe('410');
    expect(chooseNextCard({ ...base, cards, engine, recent, nextSlot: 1, ready: new Set(['360']) }).place.id).toBe('360');
    // Long enough ago, it counts again
    const longAgo = new Map([['360', base.now - RECENT_MS - 1]]);
    expect(chooseNextCard({ ...base, cards, engine: engineShowing(['764', '036', '360']), recent: longAgo }).place.id).toBe('360');
  });

  it('keeps the lines in top-to-bottom order before anything else', () => {
    // Thailand's card (the middle one) changes. With the globe at 170°E New Zealand is nearer
    // the middle of the view, but its place is below Australia's, so their lines would cross;
    // South Korea fits between Japan and Australia
    const cards = [byId('392'), byId('764'), byId('036')];
    const engine = engineShowing(['392', '036', '554', '410']);
    const { slot, place } = chooseNextCard({ ...base, lon: 170, cards, engine });
    expect(slot).toBe(1);
    expect(place.id).toBe('410');
    // With South Korea's photo not ready, New Zealand it is
    expect(chooseNextCard({ ...base, lon: 170, cards, engine, ready: new Set(['554']) }).place.id).toBe('554');
  });
});

