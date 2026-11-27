// A postcard drawn on two canvases (utils/postcards/drawPostcard.js), against a stand-in canvas
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HAND,
  POSTCARD_HEIGHT,
  POSTCARD_WIDTH,
  arcText,
  canvasPng,
  drawBack,
  drawCover,
  drawFront,
  drawModel,
  drawPostcard,
  blockLetterLines,
  insetFor,
  loadImage,
  loadPostcardImages,
  messageLayout,
  paletteFor,
} from '@/utils/postcards/drawPostcard';
import { POSTCARD_COLOURS } from '@/utils/constants/brandColours';
import { FakePath2D, fakeContext, textsDrawn } from '../shareCard/fakeCanvas';

const img = (w, h, name = 'img') => ({ naturalWidth: w, naturalHeight: h, name });
const OUTLINE = { paths: ['M0 0 L10 0 L10 10 Z'], viewBox: '0 0 10 10' };
const ART = {
  kind: 'COUNTRY',
  placeName: 'France',
  subtitle: 'Paris, Banks of the Seine',
  cover: { url: '/c.webp', isPoster: false },
  poster: { url: '/p.webp', ratio: 2 / 3 },
  outline: OUTLINE,
  colour: '#ff6d6a',
  stamp: 'model',
  stampModel: { id: 'eiffel-tower', url: '/m.webp', aspect: 0.6 },
  credit: 'Photo: A. B., CC BY-SA 4.0',
};
const IMAGES = { cover: img(1200, 800, 'cover'), poster: img(800, 1200, 'poster'), stampModel: img(192, 320, 'model') };
const CARD = { kind: 'COUNTRY', countryCode: 'FR', style: 'classic', message: 'Bonjour Gran!\nParis is lovely.', toName: 'Gran', fromName: 'Charlie', sentAt: '2026-11-26T10:00:00.000Z' };
const drawnImages = (ctx) => ctx.calls.filter((c) => c.name === 'drawImage').map((c) => c.args[0]?.name);

beforeEach(() => {
  vi.stubGlobal('Path2D', FakePath2D);
});

describe('the styles', () => {
  it('has each style’s colours and edge, and the classic for one it doesn’t know', () => {
    expect(paletteFor('night')).toBe(POSTCARD_COLOURS.night);
    expect(paletteFor('neon')).toBe(POSTCARD_COLOURS.classic);
    expect(insetFor('airmail')).toBeGreaterThan(insetFor('classic'));
    expect(insetFor('neon')).toBe(insetFor('classic'));
  });
});

describe('the words', () => {
  it('lays a message out with its own line breaks, as big as fits', () => {
    const ctx = fakeContext();
    const short = messageLayout(ctx, 'Hi Gran!\n\nSunny here.', { w: 500, h: 400 });
    expect(short.size).toBe(40);
    expect(short.lines).toEqual(['Hi Gran!', '', 'Sunny here.']);
    expect(ctx.font).toContain(HAND);
  });

  it('shrinks a long one to fit, and cuts it short at the smallest size', () => {
    const ctx = fakeContext();
    const long = messageLayout(ctx, 'word '.repeat(120), { w: 400, h: 300 });
    expect(long.size).toBeLessThan(40);
    expect(long.lines.length * long.lineHeight).toBeLessThanOrEqual(300 + long.lineHeight);
    const huge = messageLayout(ctx, 'word '.repeat(2000), { w: 200, h: 100, min: 22 });
    expect(huge.size).toBe(22);
    expect(huge.lines.at(-1).endsWith('…')).toBe(true);
  });

  it('sets a place’s name in big capitals, on one line when it fits, else two or three', () => {
    const ctx = fakeContext();
    const france = blockLetterLines(ctx, 'France', { width: 1000 });
    expect(france.lines).toEqual(['FRANCE']);
    expect(france.size).toBeGreaterThan(200);
    const bosnia = blockLetterLines(ctx, 'Bosnia and Herzegovina', { width: 1000 });
    expect(bosnia.lines.length).toBeGreaterThan(1);
    expect(bosnia.lines.join(' ')).toBe('BOSNIA AND HERZEGOVINA');
    expect(ctx.font).toContain('700');
  });

  it('writes round a circle, a letter at a time', () => {
    const ctx = fakeContext();
    arcText(ctx, 'PERU', { cx: 100, cy: 100, r: 50 });
    expect(textsDrawn(ctx)).toEqual(['P', 'E', 'R', 'U']);
    expect(ctx.rotate).toHaveBeenCalledTimes(4);
  });
});

describe('the pictures', () => {
  it('crops a picture to fill its box, round its middle', () => {
    const ctx = fakeContext();
    drawCover(ctx, img(400, 200), { x: 0, y: 0, w: 100, h: 100 });
    expect(ctx.drawImage.mock.calls[0].slice(1)).toEqual([100, 0, 200, 200, 0, 0, 100, 100]);
  });

  it('stands a model on its ground, never wider than its room', () => {
    const ctx = fakeContext();
    expect(drawModel(ctx, img(100, 100), 2, { cx: 100, bottom: 200, height: 100, maxWidth: 100 })).toEqual({ x: 50, y: 150, w: 100, h: 50 });
  });

  it('loads the cover, the poster and the stamp’s model, an address once', async () => {
    const load = vi.fn(async (src) => (src ? img(10, 10, src) : null));
    const images = await loadPostcardImages({ ...ART, cover: { url: '/p.webp', isPoster: true } }, load);
    expect(images.cover.name).toBe('/p.webp');
    expect(images.poster).toBe(images.cover);
    expect(images.stampModel.name).toBe('/m.webp');
    expect(load).toHaveBeenCalledTimes(2);
    expect(await loadPostcardImages({ ...ART, cover: null, stampModel: null, poster: null }, load)).toEqual({ cover: null, poster: null, stampModel: null });
  });

  it('gives no picture for no address', async () => {
    await expect(loadImage(null)).resolves.toBeNull();
  });

  it('asks another site for a picture with CORS (so the canvas can be saved), never this site’s own or a blob', async () => {
    const made = [];
    class FakeImage {
      constructor() {
        made.push(this);
      }

      set src(value) {
        this.source = value;
        if (value.includes('broken')) this.onerror();
        else this.onload();
      }
    }
    vi.stubGlobal('Image', FakeImage);
    try {
      const other = await loadImage('https://media.example.com/poster.webp?canvas=1');
      expect(other.crossOrigin).toBe('anonymous');
      expect(other.source).toBe('https://media.example.com/poster.webp?canvas=1');
      expect((await loadImage('/local-media/poster.webp')).crossOrigin).toBeUndefined();
      expect((await loadImage(`${window.location.origin}/assets/model.webp`)).crossOrigin).toBeUndefined();
      expect((await loadImage('blob:http://x/1')).crossOrigin).toBeUndefined();
      // One that can't be had: drawn without it
      await expect(loadImage('https://media.example.com/broken.webp')).resolves.toBeNull();
      expect(made).toHaveLength(5);
    } finally {
      vi.unstubAllGlobals();
      vi.stubGlobal('Path2D', FakePath2D);
    }
  });
});

describe('the front', () => {
  let contexts;
  beforeEach(() => {
    // The faces of the big letters are drawn on a canvas of their own
    contexts = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
      const ctx = fakeContext(this);
      contexts.push(ctx);
      return ctx;
    });
  });
  const stroked = (ctx) => ctx.calls.filter((c) => c.name === 'strokeText').map((c) => c.args[0]);

  it('covers the card with its photo, then “Greetings from” on a ribbon over the place’s name in big letters', () => {
    const ctx = fakeContext();
    drawFront(ctx, CARD, ART, IMAGES);
    // The photo across the card inside its edge
    const cover = ctx.calls.find((c) => c.name === 'drawImage');
    expect(cover.args[0].name).toBe('cover');
    expect(cover.args.slice(5)).toEqual([18, 18, 1164, 764]);
    expect(textsDrawn(ctx)).toContain('Greetings from');
    // The letters' 3D side and outline on the card, their faces the photo cut to them
    expect(textsDrawn(ctx).filter((t) => t === 'FRANCE').length).toBeGreaterThan(5);
    expect(stroked(ctx)).toContain('FRANCE');
    const [faces, mask] = contexts;
    expect(faces.calls.find((c) => c.name === 'drawImage').args[0].name).toBe('cover');
    // Cut to a mask of the letters, drawn on its own
    expect(textsDrawn(mask)).toEqual(['FRANCE']);
    expect(faces.calls.some((c) => c.name === 'drawImage' && c.args[0] === mask.canvas)).toBe(true);
    expect(ctx.calls.some((c) => c.name === 'drawImage' && c.args[0] === faces.canvas)).toBe(true);
    // What the photo is of, under the letters
    expect(stroked(ctx)).toContain('Paris, Banks of the Seine');
  });

  it('shades the photo towards its edges, and gives vintage and night their wash', () => {
    const ctx = fakeContext();
    drawFront(ctx, CARD, ART, IMAGES);
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    const vintage = fakeContext();
    drawFront(vintage, { ...CARD, style: 'vintage' }, ART, IMAGES);
    expect(vintage.calls.some((c) => c.name === 'fillRect' && c.fillStyle === POSTCARD_COLOURS.vintage.tint)).toBe(true);
    const night = fakeContext();
    drawFront(night, { ...CARD, style: 'night' }, ART, IMAGES);
    expect(night.calls.some((c) => c.name === 'fillRect' && c.fillStyle === POSTCARD_COLOURS.night.tint)).toBe(true);
    const classic = fakeContext();
    drawFront(classic, CARD, ART, IMAGES);
    expect(classic.calls.some((c) => c.name === 'fillRect' && c.fillStyle === POSTCARD_COLOURS.vintage.tint)).toBe(false);
  });

  it('draws the outline on the sea when the place has no photo or poster, the letters’ faces plain', () => {
    const ctx = fakeContext();
    drawFront(ctx, CARD, { ...ART, cover: null, subtitle: null }, { ...IMAGES, cover: null });
    expect(ctx.calls.some((c) => c.name === 'fill' && c.args[0]?.d === OUTLINE.paths[0])).toBe(true);
    // The faces plain: no photo drawn on them, only the mask that cuts them
    const [faces, mask] = contexts;
    expect(faces.calls.filter((c) => c.name === 'drawImage').map((c) => c.args[0])).toEqual([mask.canvas]);
    expect(stroked(ctx)).not.toContain('Paris, Banks of the Seine');
  });

  it('sets a long name on more lines, the photo through every line', () => {
    const ctx = fakeContext();
    drawFront(ctx, { ...CARD, countryCode: 'BA' }, { ...ART, placeName: 'Bosnia and Herzegovina' }, IMAGES);
    const lines = [...new Set(stroked(ctx).filter((t) => /^[A-Z ]+$/.test(t)))];
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe('BOSNIA AND HERZEGOVINA');
    // Every line on the one mask, which cuts the faces once
    const [faces, mask] = contexts;
    expect(textsDrawn(mask)).toEqual(lines);
    expect(faces.calls.filter((c) => c.name === 'drawImage' && c.args[0] === mask.canvas)).toHaveLength(1);
  });

  it('edges an airmail card in stripes', () => {
    const ctx = fakeContext();
    drawFront(ctx, { ...CARD, style: 'airmail' }, ART, IMAGES);
    const stripes = POSTCARD_COLOURS.airmail.stripes;
    const fills = ctx.calls.filter((c) => c.name === 'fill').map((c) => c.fillStyle);
    expect(fills).toEqual(expect.arrayContaining([...stripes]));
  });
});

describe('the back', () => {
  it('writes the message, who it’s from and to, the stamp, the postmark and the site', () => {
    const ctx = fakeContext();
    drawBack(ctx, CARD, ART, IMAGES);
    const texts = textsDrawn(ctx);
    expect(texts).toEqual(expect.arrayContaining(['POST CARD', 'Bonjour Gran!', 'Paris is lovely.', 'Charlie', 'To:', 'Gran', '26 NOV', '2026', 'Photo: A. B., CC BY-SA 4.0  ·  myplanetview.com']));
    // The stamp's model, and the place round the postmark a letter at a time
    expect(drawnImages(ctx)).toEqual(['model']);
    expect(texts).toEqual(expect.arrayContaining(['F', 'R', 'A', 'N', 'C', 'E']));
  });

  it('credits a landmark’s photo, and says “by air mail” on an airmail card', () => {
    const ctx = fakeContext();
    drawBack(ctx, { ...CARD, style: 'airmail', toName: null, fromName: null }, { ...ART, credit: 'Photo: A. B., CC BY-SA 4.0' }, IMAGES);
    const texts = textsDrawn(ctx);
    expect(texts).toContain('BY AIR MAIL');
    expect(texts).toContain('Photo: A. B., CC BY-SA 4.0  ·  myplanetview.com');
    expect(texts).not.toContain('Gran');
  });

  it('puts the poster on the stamp when there’s no model, else the outline', () => {
    const ctx = fakeContext();
    drawBack(ctx, CARD, { ...ART, stampModel: null }, { ...IMAGES, stampModel: null });
    expect(drawnImages(ctx)).toEqual(['poster']);
    const bare = fakeContext();
    drawBack(bare, CARD, { ...ART, stampModel: null }, { ...IMAGES, stampModel: null, poster: null });
    expect(drawnImages(bare)).toEqual([]);
  });
});

describe('drawPostcard', () => {
  it('draws both sides at 1200 × 800 from the pictures given, and makes PNGs of them', async () => {
    const contexts = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
      const ctx = fakeContext(this);
      contexts.push(ctx);
      return ctx;
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) => callback(new Blob(['png'], { type })));
    const { front, back } = await drawPostcard(CARD, ART, IMAGES);
    expect([front.width, front.height, back.width, back.height]).toEqual([POSTCARD_WIDTH, POSTCARD_HEIGHT, POSTCARD_WIDTH, POSTCARD_HEIGHT]);
    // The front, the back, and the big letters' faces and their mask
    expect(contexts).toHaveLength(4);
    expect(contexts.filter((ctx) => textsDrawn(ctx).includes('POST CARD'))).toHaveLength(1);
    const blob = await canvasPng(front);
    expect(blob.type).toBe('image/png');
    vi.restoreAllMocks();
  });
});
