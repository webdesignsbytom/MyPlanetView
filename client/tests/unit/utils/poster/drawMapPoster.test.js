import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POSTER_LOOKS, POSTER_SIZES, PRINT_DPI, drawMapPoster, posterPixels, posterPng, posterSize, printablePixels } from '@/utils/poster/drawMapPoster';
import { mapPosterOptions, posterFileBase, posterSubtitle } from '@/utils/poster/posterOptions';
import { pngInfo } from '@/utils/poster/pngDpi';
import { POSTER_COLOURS } from '@/utils/constants/brandColours';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
import { FakePath2D, fakeContext, fillsOf, textsDrawn } from '../shareCard/fakeCanvas';

let contexts;
// The largest canvas this pretend browser can draw, in pixels
let canvasLimit;

beforeEach(() => {
  contexts = [];
  canvasLimit = Infinity;
  vi.stubGlobal('Path2D', FakePath2D);
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
  it('lists landscape sizes and looks, A3 for an unknown one', () => {
    expect(POSTER_SIZES.map((s) => s.id)).toEqual(['A4', 'A3', 'A2', '70x50']);
    for (const size of POSTER_SIZES) expect(size.mm[0]).toBeGreaterThan(size.mm[1]);
    expect(POSTER_LOOKS.map((l) => l.id)).toEqual(['atlas', 'paper']);
    expect(posterSize('A2').id).toBe('A2');
    expect(posterSize('B5').id).toBe('A3');
  });

  it('works out the pixels at a print resolution', () => {
    expect(PRINT_DPI).toBe(300);
    expect(posterPixels('A4')).toEqual({ width: 3508, height: 2480 });
    expect(posterPixels('70x50', 150)).toEqual({ width: 4134, height: 2953 });
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

  it('gives null when even 150 dpi won’t fit, or there’s no canvas', () => {
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
    expect(ctx.calls[0]).toMatchObject({ name: 'fillRect', args: [0, 0, 2000, 1414], fillStyle: POSTER_COLOURS.atlas.paper });
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
    expect(new Set(fillsOf(ctx, COUNTRY_SHAPES.DE))).toEqual(new Set([POSTER_COLOURS.atlas.land]));
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
      fileBase: 'our-map',
    });
    expect(mapPosterOptions({ name: 'x' })).toMatchObject({ highlight: [], colours: null, splitUk: false });
  });
});
