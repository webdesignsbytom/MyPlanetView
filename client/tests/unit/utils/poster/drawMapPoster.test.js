import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CUSTOM_SIZE,
  POSTER_LOOKS,
  POSTER_SIZES,
  PRINT_DPI,
  customSize,
  drawMapPoster,
  parseCustomSize,
  posterFilePart,
  posterLook,
  posterPixels,
  posterPng,
  posterSize,
  printablePixels,
} from '@/utils/poster/drawMapPoster';
import { mapPosterOptions, posterColoursFor, posterFileBase, posterSubtitle } from '@/utils/poster/posterOptions';
import { MAP_STYLES } from '@/utils/map/mapStyles';
import { pngInfo } from '@/utils/poster/pngDpi';
import { POSTER_COLOURS } from '@/utils/constants/brandColours';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
import { FakePath2D, fakeContext, fillsOf, textsDrawn } from '../shareCard/fakeCanvas';

let contexts;
// The largest canvas this pretend browser can draw, in pixels
let canvasLimit;
// The pictures this pretend browser loads (jsdom loads none): their addresses, and whether
// they fail
let picturesLoaded;
let picturesFail;

// A picture that "loads" a moment after its address is set, 1792 × 1024
class FakeImage {
  constructor() {
    this.naturalWidth = 1792;
    this.naturalHeight = 1024;
  }
  set src(url) {
    this.url = url;
    picturesLoaded.push(url);
    setTimeout(() => (picturesFail ? this.onerror?.() : this.onload?.()), 0);
  }
  get src() {
    return this.url;
  }
}

beforeEach(() => {
  contexts = [];
  canvasLimit = Infinity;
  picturesLoaded = [];
  picturesFail = false;
  vi.stubGlobal('Path2D', FakePath2D);
  vi.stubGlobal('Image', FakeImage);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
    const canvas = this;
    const ctx = fakeContext(canvas);
    ctx.getImageData = () => ({ data: [0, 0, 0, canvas.width * canvas.height <= canvasLimit ? 255 : 0] });
    contexts.push(ctx);
    return ctx;
  });
});

const readBytes = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.readAsArrayBuffer(blob);
  });

describe('paper sizes', () => {
  it('lists landscape sizes, A3 for an unknown one', () => {
    expect(POSTER_SIZES.map((s) => s.id)).toEqual(['A4', 'A3', 'A2', '70x50']);
    for (const size of POSTER_SIZES) expect(size.mm[0]).toBeGreaterThan(size.mm[1]);
    expect(posterSize('A2').id).toBe('A2');
    expect(posterSize('B5').id).toBe('A3');
    expect(posterFilePart('A2')).toBe('A2');
  });

  it('works out the pixels at a print resolution', () => {
    expect(PRINT_DPI).toBe(300);
    expect(posterPixels('A4')).toEqual({ width: 3508, height: 2480 });
    expect(posterPixels('70x50', 150)).toEqual({ width: 4134, height: 2953 });
  });

  // 27 Nov 2026, the user's wish: a custom size option
  it('makes a custom size of any shape, to a millimetre, wide or tall', () => {
    const size = customSize(60, 40);
    expect(size).toEqual({ id: CUSTOM_SIZE, label: '60 × 40 cm', file: '60x40cm', mm: [600, 400] });
    expect(posterSize(size)).toBe(size);
    expect(posterFilePart(size)).toBe('60x40cm');
    expect(posterPixels(size)).toEqual({ width: 7087, height: 4724 });
    expect(customSize(29.74, 42.06)).toMatchObject({ label: '29.7 × 42.1 cm', file: '29.7x42.1cm', mm: [297, 421] });
    expect(posterPixels(customSize(30, 40))).toEqual({ width: 3543, height: 4724 });
  });

  it('reads the custom size typed in, or says what’s wrong with it', () => {
    expect(parseCustomSize('60', '40')).toEqual({ size: customSize(60, 40) });
    expect(parseCustomSize(' 42,5 ', '29.7')).toEqual({ size: customSize(42.5, 29.7) });
    expect(parseCustomSize('10', '150').size.mm).toEqual([100, 1500]);
    expect(parseCustomSize('', '40')).toEqual({ error: 'Type the width and the height in centimetres.' });
    expect(parseCustomSize('60', ' ')).toEqual({ error: 'Type the width and the height in centimetres.' });
    expect(parseCustomSize('60cm', '40')).toEqual({ error: 'The width and the height are numbers of centimetres, such as 60 or 42.5.' });
    expect(parseCustomSize('-5', '40').error).toMatch(/^The width and the height are numbers/);
    expect(parseCustomSize('9.9', '40')).toEqual({ error: 'Each side is 10 to 150 cm.' });
    expect(parseCustomSize('60', '150.1')).toEqual({ error: 'Each side is 10 to 150 cm.' });
  });
});

describe('looks', () => {
  // 27 Nov 2026, the user's wish: "all the map types as the look options"
  it('offers every map style, named as Settings names them, then Old paper', () => {
    expect(POSTER_LOOKS.map((l) => l.id)).toEqual([...MAP_STYLES.map((style) => style.id), 'paper']);
    expect(POSTER_LOOKS.map((l) => l.label)).toEqual(['World map', 'Black and white', 'Old map', 'Starry night', 'Engraved ocean', 'Old paper']);
    for (const look of POSTER_LOOKS) expect(POSTER_COLOURS[look.id], look.id).toBeDefined();
    // The pictured styles' seas are their own pictures
    expect(POSTER_LOOKS.filter((l) => l.picture).map((l) => l.id)).toEqual(['old-map', 'starry', 'engraved']);
    expect(posterLook('engraved').picture).toMatch(/engraved-ocean-1774\.webp/);
    expect(posterLook('nope').id).toBe('animated');
  });
});

describe('printablePixels', () => {
  it('gives 300 dpi where the browser can draw it', () => {
    expect(printablePixels('A3')).toEqual({ ...posterPixels('A3', 300), dpi: 300 });
  });

  it('steps down to the best this browser’s canvas takes', () => {
    canvasLimit = 4000 * 3000;
    const { width, height } = posterPixels('A3', 200);
    expect(printablePixels('A3')).toEqual({ width, height, dpi: 200 });
  });

  it('takes a custom size, down to 100 dpi for the biggest', () => {
    expect(printablePixels(customSize(30, 40))).toEqual({ width: 3543, height: 4724, dpi: 300 });
    canvasLimit = 6000 * 6000;
    expect(printablePixels(customSize(150, 150))).toEqual({ width: 5906, height: 5906, dpi: 100 });
  });

  it('gives null when even 100 dpi won’t fit, or there’s no canvas', () => {
    canvasLimit = 100;
    expect(printablePixels('A2')).toBeNull();
    HTMLCanvasElement.prototype.getContext.mockReturnValue(null);
    expect(printablePixels('A4')).toBeNull();
  });
});

describe('drawMapPoster', () => {
  const options = { width: 2000, height: 1414, title: 'Charlie & Alex’s travels', subtitle: '8 countries · 2 continents', highlight: ['FR', 'JP'] };

  it('draws the paper, the title, the numbers in capitals, the names and the site', async () => {
    const canvas = await drawMapPoster(options);
    expect([canvas.width, canvas.height]).toEqual([2000, 1414]);
    const ctx = contexts.at(-1);
    expect(ctx.calls[0]).toMatchObject({ name: 'fillRect', args: [0, 0, 2000, 1414], fillStyle: POSTER_COLOURS.animated.paper });
    const texts = textsDrawn(ctx);
    expect(texts[0]).toBe('Charlie & Alex’s travels');
    expect(texts).toContain('8 COUNTRIES · 2 CONTINENTS');
    expect(texts).toContain('France · Japan');
    expect(texts.at(-1)).toBe('myplanetview.com');
  });

  it('colours the places in, in the design’s colours when it has them', async () => {
    await drawMapPoster({ ...options, colours: { FR: '#123456', bad: 'red' } });
    const ctx = contexts.at(-1);
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.FR))).toEqual(new Set(['#123456']));
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.DE))).toEqual(new Set([POSTER_COLOURS.animated.land]));
  });

  it('draws each map style’s look in its own colours: Black and white’s greys', async () => {
    await drawMapPoster({ ...options, look: 'mono' });
    const ctx = contexts.at(-1);
    expect(ctx.calls[0].fillStyle).toBe(POSTER_COLOURS.mono.paper);
    expect(ctx.calls.find((c) => c.name === 'fillRect' && c.fillStyle === POSTER_COLOURS.mono.sea)).toBeDefined();
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.DE))).toEqual(new Set([POSTER_COLOURS.mono.land]));
    // France in one of the style's greys, never a pastel
    const [france] = new Set(fillsOf(ctx, COUNTRY_SHAPES.FR));
    expect(POSTER_COLOURS.mono.visits).toContain(france);
    expect(picturesLoaded).toEqual([]);
    expect(ctx.calls.some((c) => c.name === 'drawImage')).toBe(false);
  });

  it('draws a pictured style’s sea as its picture, covering the map, the places over it', async () => {
    await drawMapPoster({ ...options, look: 'starry' });
    const ctx = contexts.at(-1);
    expect(picturesLoaded).toEqual([posterLook('starry').picture]);
    const index = ctx.calls.findIndex((c) => c.name === 'drawImage');
    expect(index).toBeGreaterThan(-1);
    // Cover: the 1792 × 1024 picture fills the map's box, wider than it or as wide
    const [, , , drawnWidth, drawnHeight] = ctx.calls[index].args;
    const sea = ctx.calls.findLast((c, i) => i < index && c.name === 'fillRect');
    expect(sea.fillStyle).toBe(POSTER_COLOURS.starry.sea);
    expect(drawnWidth).toBeGreaterThanOrEqual(sea.args[2] - 0.001);
    expect(drawnHeight).toBeGreaterThanOrEqual(sea.args[3] - 0.001);
    expect(drawnWidth / drawnHeight).toBeCloseTo(1792 / 1024, 5);
    // The land after the picture; a visited place in the night's own "visited" colour
    expect(ctx.calls.findIndex((c) => c.name === 'fill')).toBeGreaterThan(index);
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.FR))).toEqual(new Set([POSTER_COLOURS.starry.visits[0]]));
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.DE))).toEqual(new Set([POSTER_COLOURS.starry.land]));
    expect(textsDrawn(ctx)[0]).toBe('Charlie & Alex’s travels');
    expect(ctx.calls.find((c) => c.name === 'fillText').fillStyle).toBe(POSTER_COLOURS.starry.title);
  });

  it('keeps the plain sea when a style’s picture can’t load', async () => {
    picturesFail = true;
    await drawMapPoster({ ...options, look: 'engraved' });
    const ctx = contexts.at(-1);
    expect(ctx.calls.some((c) => c.name === 'drawImage')).toBe(false);
    expect(ctx.calls.find((c) => c.name === 'fillRect' && c.fillStyle === POSTER_COLOURS.engraved.sea)).toBeDefined();
  });

  it('keeps a tall custom poster’s lettering in proportion to its width', async () => {
    await drawMapPoster({ ...options, width: 1400, height: 2000 });
    const tall = contexts.at(-1);
    await drawMapPoster({ ...options, width: 1400, height: 1000 });
    const wide = contexts.at(-1);
    // The frame and the site's line are the same size on both: the unit follows the width
    const frame = (ctx) => ctx.calls.find((c) => c.name === 'strokeRect').args[0];
    expect(frame(tall)).toBeCloseTo(frame(wide), 5);
    const site = (ctx) => Number(/([\d.]+)px/.exec(ctx.calls.findLast((c) => c.name === 'fillText').font)[1]);
    expect(site(tall)).toBeCloseTo(site(wide), 5);
    expect(site(wide)).toBeCloseTo(20, 5);
  });

  it('brings the title down to the map on a tall sheet, and leaves a landscape one’s where it was', async () => {
    const titleY = (ctx) => ctx.calls.find((c) => c.name === 'fillText').args[2];
    const mapTop = (ctx) => ctx.calls.find((c) => c.name === 'rect').args[1];
    await drawMapPoster({ ...options, width: 1400, height: 2000 });
    const tall = contexts.at(-1);
    await drawMapPoster(options);
    const wide = contexts.at(-1);
    // A3's shape: the title at its usual height (160 thousandths of the height), the map below
    // the numbers' line (262 thousandths) or lower
    expect(titleY(wide)).toBeCloseTo(160 * 1.414, 3);
    expect(mapTop(wide)).toBeGreaterThanOrEqual(262 * 1.414 - 0.001);
    // The tall one (its unit 1400 / 1.4 / 1000 = 1 pixel): the title well down the sheet, the
    // map 102 units under it, as close as on a landscape sheet whose map fills its height
    expect(titleY(tall)).toBeGreaterThan(400);
    expect(mapTop(tall) - titleY(tall)).toBeCloseTo(102, 5);
  });

  it('draws in the old paper look, without names or numbers when asked, and with a title when the map has none', async () => {
    await drawMapPoster({ ...options, title: '', subtitle: '', look: 'paper', showNames: false });
    const ctx = contexts.at(-1);
    expect(ctx.calls[0].fillStyle).toBe(POSTER_COLOURS.paper.paper);
    expect(textsDrawn(ctx)).toEqual(['My travels', 'myplanetview.com']);
  });

  it('draws Antarctica only when it’s one of the places', async () => {
    await drawMapPoster(options);
    expect(fillsOf(contexts.at(-1), COUNTRY_SHAPES.AQ)).toEqual([]);
    await drawMapPoster({ ...options, highlight: ['XS'] });
    expect(fillsOf(contexts.at(-1), COUNTRY_SHAPES.AQ).length).toBeGreaterThan(0);
  });
});

describe('posterPng', () => {
  it('makes the canvas a PNG that says its print resolution', async () => {
    const png = await import('node:zlib').then(({ deflateSync, crc32 }) => {
      const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
      const chunk = (type, data) => {
        const body = [...Array.from(type, (c) => c.charCodeAt(0)), ...data];
        return [...u32(data.length), ...body, ...u32(crc32(Uint8Array.from(body)))];
      };
      return Uint8Array.from([
        ...[137, 80, 78, 71, 13, 10, 26, 10],
        ...chunk('IHDR', [...u32(3), ...u32(2), 8, 6, 0, 0, 0]),
        ...chunk('IDAT', [...deflateSync(new Uint8Array(26))]),
        ...chunk('IEND', []),
      ]);
    });
    const canvas = { toBlob: (callback, type) => callback({ type, arrayBuffer: async () => png.buffer }) };
    const blob = await posterPng(canvas, 250);
    expect(blob.type).toBe('image/png');
    expect(pngInfo(await readBytes(blob))).toEqual({ width: 3, height: 2, dpi: 250 });
  });

  it('says when the browser couldn’t make it', async () => {
    await expect(posterPng({ toBlob: (callback) => callback(null) })).rejects.toThrow('The poster couldn’t be made: try a smaller size.');
  });
});

describe('posterOptions', () => {
  it('words the numbers line', () => {
    expect(posterSubtitle({ countries: 8, continents: 2, countriesInWorld: 228 })).toBe('8 countries · 2 continents · 3.5% of the world');
    expect(posterSubtitle({ countries: 1, continents: 1 })).toBe('1 country · 1 continent');
    expect(posterSubtitle({ countries: 0, continents: 0, countriesInWorld: 228 })).toBe('0 countries · 0 continents');
    expect(posterSubtitle(null)).toBe('');
  });

  it('makes a safe file name from the map’s name', () => {
    expect(posterFileBase('Charlie & Alex’s travels')).toBe('charlie-alex-s-travels');
    expect(posterFileBase('Ålesund – Café')).toBe('alesund-cafe');
    expect(posterFileBase('')).toBe('my-map');
    expect(posterFileBase('!!!')).toBe('my-map');
    expect(posterFileBase('a'.repeat(80))).toHaveLength(60);
  });

  it('takes the map’s name, numbers, places visited or lived in, and the shown design’s colours', () => {
    const map = {
      name: 'Our map',
      splitUk: 1,
      stats: { countries: 2, continents: 1 },
      visits: [
        { countryCode: 'FR', status: 'VISITED' },
        { countryCode: 'ES', status: 'LIVED' },
        { countryCode: 'JP', status: 'WANT_TO_GO' },
      ],
    };
    expect(mapPosterOptions(map, { countries: { FR: '#112233' } })).toEqual({
      title: 'Our map',
      subtitle: '2 countries · 1 continent',
      highlight: ['FR', 'ES'],
      splitUk: true,
      colours: { FR: '#112233' },
      look: 'animated',
      coloursByLook: { animated: null, mono: null, 'old-map': null, starry: null, engraved: null, paper: { FR: '#112233' } },
      fileBase: 'our-map',
    });
    expect(mapPosterOptions({ name: 'x' })).toMatchObject({ highlight: [], colours: null, splitUk: false, look: 'animated' });
  });

  // 27 Nov 2026: the poster starts in the map's own style, each look with that style's design
  it('starts in the map’s style, each style’s look wearing that style’s design when it shows', () => {
    const map = {
      name: 'Our map',
      designs: {
        starry: { shown: true, countries: { FR: '#aa0000' } },
        mono: { shown: false, countries: { FR: '#00aa00' } },
      },
    };
    const poster = mapPosterOptions(map, map.designs.starry, 'starry');
    expect(poster.look).toBe('starry');
    expect(poster.coloursByLook).toMatchObject({ starry: { FR: '#aa0000' }, mono: null, animated: null, paper: { FR: '#aa0000' } });
    expect(posterColoursFor(poster, 'starry')).toEqual({ FR: '#aa0000' });
    expect(posterColoursFor(poster, 'mono')).toBeNull();
    expect(posterColoursFor(poster, 'paper')).toEqual({ FR: '#aa0000' });
    expect(mapPosterOptions(map, null, 'jupiter').look).toBe('animated');
    // An older options object, without looks' colours, keeps the shown design's
    expect(posterColoursFor({ colours: { FR: '#123456' } }, 'old-map')).toEqual({ FR: '#123456' });
  });
});
