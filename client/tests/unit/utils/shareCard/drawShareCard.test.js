import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  MAP_BOTTOM_NO_ANTARCTICA,
  MAP_BOTTOM_WITH_ANTARCTICA,
  MAP_TOP,
  MAP_WIDTH,
  drawMap,
  drawShareCard,
  fittedText,
  font,
  loadFonts,
  nameLines,
  namesOf,
} from '@/utils/shareCard/drawShareCard';
import { mapCardOptions, mapCardStats } from '@/utils/shareCard/cardOptions';
import { SHARE_CARD_COLOURS as C } from '@/utils/constants/brandColours';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
import { UK_NATION_SHAPES } from '@/utils/map/ukNationShapes';
import { pastelNumberFor } from '@/utils/map/visitStatus';
import { FakePath2D, fakeContext, fillsOf, textsDrawn } from './fakeCanvas';

let contexts;
let blobFor;
beforeEach(() => {
  contexts = [];
  blobFor = (type) => new Blob(['png'], { type });
  vi.stubGlobal('Path2D', FakePath2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
    const ctx = fakeContext(this);
    contexts.push(ctx);
    return ctx;
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) => callback(blobFor(type)));
});

describe('font and loadFonts', () => {
  it('writes a canvas font', () => {
    expect(font(30)).toBe('30px TravelFont');
    expect(font(28, 'Poppins', '600')).toBe('600 28px Poppins');
  });

  it('waits for the card’s fonts where the browser can, and carries on if one fails', async () => {
    await expect(loadFonts()).resolves.toBeUndefined();
    const load = vi.fn().mockRejectedValue(new Error('offline'));
    Object.defineProperty(document, 'fonts', { value: { load }, configurable: true });
    try {
      await expect(loadFonts()).resolves.toBeUndefined();
      expect(load).toHaveBeenCalledWith('84px TravelFont');
    } finally {
      delete document.fonts;
    }
  });
});

describe('fittedText', () => {
  it('draws at the largest size that fits', () => {
    const ctx = fakeContext();
    expect(fittedText(ctx, 'Short', { x: 10, y: 20, width: 500, max: 40, min: 20, family: 'Poppins' })).toBe(40);
    expect(ctx.fillText).toHaveBeenCalledWith('Short', 10, 20);
  });

  it('shrinks to fit, then cuts it short with an ellipsis at the smallest', () => {
    const ctx = fakeContext();
    // Ten characters at half the size each: 100 px wide at 20
    expect(fittedText(ctx, 'abcdefghij', { x: 0, y: 0, width: 100, max: 40, min: 10, family: 'Poppins' })).toBe(20);
    expect(ctx.fillText).toHaveBeenLastCalledWith('abcdefghij', 0, 0);
    fittedText(ctx, 'a very long title indeed', { x: 0, y: 0, width: 60, max: 20, min: 10, family: 'Poppins' });
    const shown = ctx.fillText.mock.calls.at(-1)[0];
    expect(shown.endsWith('…')).toBe(true);
    expect(ctx.measureText(shown).width).toBeLessThanOrEqual(60);
  });
});

describe('namesOf', () => {
  it('names the places A to Z, leaving out regions and unknown codes', () => {
    expect(namesOf(new Set(['JP', 'XB', 'FR', 'XE', 'AQ', 'ZZ']))).toEqual(['Antarctica', 'England', 'France', 'Japan']);
  });
});

describe('nameLines', () => {
  const ctx = fakeContext();
  ctx.font = '10px Poppins'; // 5 px a character

  it('joins the names on lines no wider than the room', () => {
    expect(nameLines(ctx, ['France', 'Japan', 'Peru'], 1000, 3)).toEqual(['France · Japan · Peru']);
    expect(nameLines(ctx, ['France', 'Japan', 'Peru'], 80, 3)).toEqual(['France · Japan', 'Peru']);
  });

  it('ends the last line with how many more there are when they don’t fit', () => {
    const names = ['France', 'Japan', 'Peru', 'Chile', 'Italy', 'Spain', 'Kenya', 'Nepal', 'Oman'];
    const lines = nameLines(ctx, names, 120, 2);
    expect(lines).toEqual(['France · Japan · Peru', 'Chile · and 5 more']);
    const shown = lines.join(' · ').split(' · ').filter((part) => !part.startsWith('and '));
    const more = Number(/and (\d+) more/.exec(lines[1])[1]);
    expect(shown.length + more).toBe(names.length);
    for (const line of lines) expect(ctx.measureText(line).width).toBeLessThanOrEqual(120);
  });

  it('puts a single name too long for the room on a line of its own', () => {
    expect(nameLines(ctx, ['A very long country name'], 10, 2)).toEqual(['A very long country name']);
  });
});

describe('drawMap', () => {
  const box = { x: 70, y: 262, width: 1000, height: 0 };

  it('colours the places in their pastels, a design’s colour, or a region’s country’s, the rest plain land', () => {
    const ctx = fakeContext();
    const height = drawMap(ctx, { box, highlight: new Set(['FR', 'JP', 'XT']), splitUk: false, colours: { JP: '#abcdef', AU: '#010203' }, withAntarctica: false });
    expect(height).toBe(((MAP_BOTTOM_NO_ANTARCTICA - MAP_TOP) * 1000) / MAP_WIDTH);
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.FR))).toEqual(new Set([C.visits[pastelNumberFor('FR') - 1]]));
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.JP))).toEqual(new Set(['#abcdef']));
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.XT))).toEqual(new Set(['#010203']));
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.DE))).toEqual(new Set([C.land]));
    expect(fillsOf(ctx, COUNTRY_SHAPES.AQ)).toEqual([]);
    expect(ctx.strokeRect).toHaveBeenLastCalledWith(70, 262, 1000, 0);
  });

  it('draws Antarctica in ice, and the UK as its nations on a split map', () => {
    const ctx = fakeContext();
    const height = drawMap(ctx, { box, highlight: new Set(['XC']), splitUk: true, colours: {}, withAntarctica: true });
    expect(height).toBe(((MAP_BOTTOM_WITH_ANTARCTICA - MAP_TOP) * 1000) / MAP_WIDTH);
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.AQ))).toEqual(new Set([C.ice]));
    // The UK's own outline isn't drawn: none of its shapes that no nation shares
    const nationPaths = new Set(Object.values(UK_NATION_SHAPES).flat());
    expect(fillsOf(ctx, COUNTRY_SHAPES.GB.filter((d) => !nationPaths.has(d)))).toEqual([]);
    expect(new Set(fillsOf(ctx, UK_NATION_SHAPES.XC))).toEqual(new Set([C.visits[pastelNumberFor('XC') - 1]]));
  });

  it('draws a marked micro-state as a dot, and an unmarked one not at all', () => {
    const ctx = fakeContext();
    drawMap(ctx, { box, highlight: new Set(), splitUk: false, colours: {}, withAntarctica: false });
    expect(ctx.arc).not.toHaveBeenCalled();
    drawMap(ctx, { box, highlight: new Set(['MC']), splitUk: false, colours: {}, withAntarctica: false, dotRadius: 5 });
    expect(ctx.arc).toHaveBeenCalledTimes(1);
    expect(ctx.arc.mock.calls[0][2]).toBeCloseTo(5 / (1000 / MAP_WIDTH));
  });
});

describe('drawShareCard', () => {
  it('draws a 1080 × 1350 PNG with the kicker, title, numbers, names and the site', async () => {
    const blob = await drawShareCard({
      kicker: 'My travel map',
      title: 'Our map',
      highlight: ['FR', 'JP'],
      stats: [
        { value: 12, label: 'countries' },
        { value: 1500, label: 'photos' },
        { value: 'x', label: 'extra' },
        { value: 4, label: 'never shown' },
      ],
    });
    expect(blob.type).toBe('image/png');
    const ctx = contexts.at(-1);
    expect([ctx.canvas.width, ctx.canvas.height]).toEqual([CARD_WIDTH, CARD_HEIGHT]);
    const texts = textsDrawn(ctx);
    expect(texts.slice(0, 2)).toEqual(['MY TRAVEL MAP', 'Our map']);
    expect(texts).toEqual(expect.arrayContaining(['12', 'countries', '1,500', 'photos', 'x', 'France · Japan', 'myplanetview.com']));
    expect(texts).not.toContain('never shown');
  });

  // A country collection's card (24 Nov 2026): the medal in its metal where the map goes
  it('draws a medal instead of the map, in its metal, with the metal’s name', async () => {
    await drawShareCard({ kicker: 'Gold medal', title: 'Malta', medal: 'gold', stats: [{ value: 3, label: 'landmarks stamped' }] });
    const ctx = contexts.at(-1);
    const texts = textsDrawn(ctx);
    expect(texts).toEqual(expect.arrayContaining(['GOLD MEDAL', 'Malta', 'GOLD', '3', 'landmarks stamped', 'myplanetview.com']));
    // No map: no place's shape filled
    expect(fillsOf(ctx, COUNTRY_SHAPES.FR)).toEqual([]);
    const arcs = ctx.calls.filter((c) => c.name === 'arc');
    expect(arcs).toHaveLength(2);
    expect(ctx.calls.filter((c) => c.name === 'fill').map((c) => c.fillStyle)).toEqual(expect.arrayContaining([C.medals.gold.face, C.medals.gold.rim, ...C.ribbon]));
  });

  // 24 Nov 2026, the user's wish: a one-country trip on that country's own map with its regions
  describe('close up (mapView: fit)', () => {
    // The card's map box: the clip rectangle drawn for the map
    const mapBox = (ctx) => ctx.calls.find((c) => c.name === 'rect' && c.args[0] === 70 && c.args[1] === 262)?.args;

    it('draws one country on its own map: every region in its pastel, no world', async () => {
      const { default: italy } = await import('@/utils/map/countryMaps/IT.js');
      await drawShareCard({ title: 'Italian summer', highlight: ['IT'], mapView: 'fit' });
      const ctx = contexts.at(-1);
      // No world map: France's shapes aren't drawn
      expect(fillsOf(ctx, COUNTRY_SHAPES.FR)).toEqual([]);
      // Each province, in its own pastel
      for (const area of italy.areas.slice(0, 5)) {
        expect(fillsOf(ctx, area.paths)).toEqual(area.paths.map(() => C.visits[area.colour - 1]));
      }
      // Taller than the world map's box: Italy's shape asks for it, within the limit
      expect(mapBox(ctx)[3]).toBeGreaterThan(400);
      expect(mapBox(ctx)[3]).toBeLessThanOrEqual(600);
      expect(textsDrawn(ctx)).toEqual(expect.arrayContaining(['Italy', 'myplanetview.com']));
    });

    it('crops the world round neighbours', async () => {
      await drawShareCard({ title: 'Iberia', highlight: ['ES', 'PT'], mapView: 'fit' });
      const ctx = contexts.at(-1);
      // The world's shapes, Spain in its pastel, scaled up well past the whole world's
      expect(fillsOf(ctx, COUNTRY_SHAPES.ES)[0]).toBe(C.visits[pastelNumberFor('ES') - 1]);
      const scale = ctx.calls.find((c) => c.name === 'scale').args[0];
      expect(scale).toBeGreaterThan(((CARD_WIDTH - 140) / MAP_WIDTH) * 4);
    });

    it('keeps the whole world for places far apart, and for a card that doesn’t ask', async () => {
      await drawShareCard({ title: 'Far', highlight: ['US', 'JP'], mapView: 'fit' });
      const far = contexts.at(-1);
      expect(far.calls.find((c) => c.name === 'scale').args[0]).toBeCloseTo((CARD_WIDTH - 140) / MAP_WIDTH, 9);
      await drawShareCard({ title: 'Italy', highlight: ['IT'] });
      const world = contexts.at(-1);
      expect(fillsOf(world, COUNTRY_SHAPES.IT).length).toBeGreaterThan(0);
      expect(world.calls.find((c) => c.name === 'scale').args[0]).toBeCloseTo((CARD_WIDTH - 140) / MAP_WIDTH, 9);
    });
  });

  it('leaves out the kicker when there’s none', async () => {
    await drawShareCard({ title: '2026 in travel' });
    expect(textsDrawn(contexts.at(-1))[0]).toBe('2026 in travel');
  });

  it('says when the picture couldn’t be made', async () => {
    blobFor = () => null;
    await expect(drawShareCard({ title: 'x' })).rejects.toThrow('The picture couldn’t be made.');
  });
});

describe('cardOptions', () => {
  it('picks up to three numbers: countries, continents, then landmarks, photos or trips', () => {
    expect(mapCardStats({ countries: 1, continents: 1, landmarks: 3, photos: 9 })).toEqual([
      { value: 1, label: 'country' },
      { value: 1, label: 'continent' },
      { value: 3, label: 'landmarks' },
    ]);
    expect(mapCardStats({ countries: 2, continents: 2, photos: 1 })[2]).toEqual({ value: 1, label: 'photo' });
    expect(mapCardStats({ countries: 2, continents: 2, trips: 4 })[2]).toEqual({ value: 4, label: 'trips' });
    expect(mapCardStats({})).toEqual([
      { value: 0, label: 'countries' },
      { value: 0, label: 'continents' },
    ]);
    expect(mapCardStats(null)).toEqual([]);
  });

  it('makes a map’s card, in the shown design’s colours', () => {
    const map = {
      name: 'Our map',
      splitUk: true,
      stats: { countries: 1, continents: 1 },
      visits: [
        { countryCode: 'FR', status: 'LIVED' },
        { countryCode: 'JP', status: 'WANT_TO_GO' },
      ],
    };
    expect(mapCardOptions(map, { countries: { FR: '#112233' } })).toEqual({
      kicker: 'My travel map',
      title: 'Our map',
      highlight: ['FR'],
      stats: mapCardStats(map.stats),
      splitUk: true,
      colours: { FR: '#112233' },
      fileName: 'my-planet-view-map.png',
      shareText: 'My travel map: 1 country so far.',
    });
    expect(mapCardOptions({ name: 'x' })).toMatchObject({ highlight: [], colours: null, splitUk: false, shareText: 'My travel map: 0 countries so far.' });
  });
});
