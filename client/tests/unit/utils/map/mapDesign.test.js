// A map's own design (src/utils/map/mapDesign.js): the colour rules (a copy of the server's),
// the style sheet the map wears, the places a colour can go on, and reading a map style's own
// colours from the page.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DESIGN_COLOUR,
  DESIGN_PICTURE_EDGE,
  DESIGN_PICTURE_MAX_BYTES,
  EMPTY_DESIGN,
  cleanCountryColours,
  colourablePlaces,
  designCss,
  designFor,
  readColourToken,
  readStyleColours,
  shownDesign,
  usualColourToken,
} from '@/utils/map/mapDesign';
import { pastelNumberFor } from '@/utils/map/visitStatus';
import { DESIGN_PICTURE_MAX_BYTES as SERVER_MAX_BYTES } from '../../../../../server/src/utils/mapDesigns.js';

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

describe('the design’s limits', () => {
  it('match the server’s for the picture', () => {
    expect(DESIGN_PICTURE_MAX_BYTES).toBe(SERVER_MAX_BYTES);
    expect(DESIGN_PICTURE_EDGE).toBe(2560);
  });

  it('take a colour only as "#rrggbb" in lower case', () => {
    expect(DESIGN_COLOUR.test('#1d9dda')).toBe(true);
    for (const value of ['#1D9DDA', '#fff', 'red', '#12345g', '#1234567', ' #123456']) expect(DESIGN_COLOUR.test(value), value).toBe(false);
  });
});

describe('designFor and shownDesign', () => {
  const starry = { shown: true, countries: { FR: '#112233' } };
  const map = { designs: { starry, mono: { shown: false } } };

  it('find a map’s design for a style, or null', () => {
    expect(designFor(map, 'starry')).toBe(starry);
    expect(designFor(map, 'old-map')).toBeNull();
    expect(designFor({}, 'starry')).toBeNull();
    expect(designFor(null, 'starry')).toBeNull();
  });

  it('show a design only while it’s switched on', () => {
    expect(shownDesign(starry)).toBe(starry);
    expect(shownDesign(map.designs.mono)).toBeNull();
    expect(shownDesign(null)).toBeNull();
    expect(shownDesign(undefined)).toBeNull();
  });

  it('start an empty design switched on, with nothing in it', () => {
    expect(EMPTY_DESIGN).toEqual({ shown: true, countries: {}, names: null, grid: null, hover: null, string: null, picture: null });
    expect(Object.isFrozen(EMPTY_DESIGN)).toBe(true);
  });
});

describe('cleanCountryColours', () => {
  it('keeps well-formed colours on two-letter codes', () => {
    expect(cleanCountryColours({ FR: '#aa0000', JP: '#00ff00' })).toEqual({ FR: '#aa0000', JP: '#00ff00' });
  });

  it('drops anything that could break out of a style sheet', () => {
    expect(
      cleanCountryColours({
        FR: 'red;}body{display:none',
        DE: '#AA0000',
        fr: '#aa0000',
        'GB"]{fill:red}': '#aa0000',
        GBR: '#aa0000',
        IT: 12,
        ES: null,
        JP: '#00ff00',
      }),
    ).toEqual({ JP: '#00ff00' });
  });

  it('takes nothing for no colours, or for something that isn’t an object', () => {
    expect(cleanCountryColours(null)).toEqual({});
    expect(cleanCountryColours(undefined)).toEqual({});
    expect(cleanCountryColours('#aa0000')).toEqual({});
  });
});

describe('designCss', () => {
  it('is empty for no design, or one with nothing in it', () => {
    expect(designCss(null)).toBe('');
    expect(designCss(EMPTY_DESIGN)).toBe('');
  });

  it('sets the names’ and the grid’s colours as the tokens they read', () => {
    expect(designCss({ names: '#ffffff', grid: '#102030' })).toBe('[data-map-design]{--map-names:#ffffff;--map-grid:#102030}');
    expect(designCss({ names: '#ffffff' })).toBe('[data-map-design]{--map-names:#ffffff}');
  });

  it('sets the hovered country’s colour as the token the highlight reads', () => {
    expect(designCss({ hover: '#ff00aa' })).toBe('[data-map-design]{--map-hover:#ff00aa}');
    expect(designCss({ names: '#ffffff', grid: '#102030', hover: '#00aa00' })).toBe(
      '[data-map-design]{--map-names:#ffffff;--map-grid:#102030;--map-hover:#00aa00}',
    );
    expect(designCss({ hover: null })).toBe('');
  });

  it('colours each place’s shape but the one under the pointer (Germany: no region of its own)', () => {
    expect(designCss({ countries: { DE: '#aa0000' } })).toBe('[data-map-design] svg g[data-code="DE"]:not(:hover){fill:#aa0000}');
  });

  it('dresses a region in its country’s colour unless it has its own', () => {
    const css = designCss({ countries: { ID: '#aa0000', AU: '#00aa00', XT: '#0000aa' } });
    expect(css).toContain('g[data-code="XB"]:not(:hover){fill:#aa0000}');
    expect(css).toContain('g[data-code="XT"]:not(:hover){fill:#0000aa}');
    expect(css).not.toContain('g[data-code="XH"]');
  });

  it('lets nothing but "#rrggbb" and two-letter codes in', () => {
    const css = designCss({
      names: 'red;}body{background:url(x)}',
      grid: '#FFF',
      hover: 'lime}svg{display:none',
      countries: { FR: 'blue', 'X"]{}': '#aa0000', de: '#aa0000', JP: '#00ff00' },
    });
    expect(css).toBe('[data-map-design] svg g[data-code="JP"]:not(:hover){fill:#00ff00}');
    expect(css).not.toContain('url(');
    expect(css).not.toContain('--map-names');
    expect(css).not.toContain('--map-hover');
  });

  it('puts the tokens first, then a rule per place, on one line', () => {
    const css = designCss({ names: '#000000', countries: { DE: '#aa0000', JP: '#00ff00' } });
    expect(css.split(' ')).toEqual([
      '[data-map-design]{--map-names:#000000}',
      '[data-map-design]',
      'svg',
      'g[data-code="DE"]:not(:hover){fill:#aa0000}',
      '[data-map-design]',
      'svg',
      'g[data-code="JP"]:not(:hover){fill:#00ff00}',
    ]);
  });
});

describe('colourablePlaces', () => {
  const codes = (splitUk) => colourablePlaces(splitUk).map((place) => place.code);

  it('offers the countries, Antarctica and the regions, never a pole', () => {
    const places = codes(false);
    expect(places).toContain('FR');
    expect(places).toContain('GB');
    expect(places).toContain('AQ');
    expect(places).toContain('XB');
    for (const pole of ['XN', 'QN', 'XS', 'QS']) expect(places).not.toContain(pole);
    expect(places).not.toContain('XE');
  });

  it('offers the UK’s nations in its place on a map that splits it', () => {
    const places = codes(true);
    expect(places).not.toContain('GB');
    for (const nation of ['XE', 'XC', 'XW', 'XI']) expect(places).toContain(nation);
  });

  it('lists the countries first, then Antarctica, then the regions', () => {
    const places = codes(false);
    expect(places.indexOf('AQ')).toBeGreaterThan(places.indexOf('ZW'));
    expect(places.slice(-8).sort()).toEqual(['GS', 'NC', 'XA', 'XB', 'XG', 'XH', 'XT', 'XZ']);
    expect(new Set(places).size).toBe(places.length);
  });
});

describe('usualColourToken', () => {
  it('is Antarctica’s ice, and every other place’s pastel', () => {
    expect(usualColourToken('AQ')).toBe('--map-ice');
    expect(usualColourToken('FR')).toBe(`--map-visit-${pastelNumberFor('FR')}`);
    expect(usualColourToken('XB')).toBe(`--map-visit-${pastelNumberFor('ID')}`);
  });
});

describe('readColourToken', () => {
  it('takes a token written as "#rrggbb" as it is, in lower case', () => {
    document.documentElement.style.setProperty('--map-sea', '#1D9DDA');
    expect(readColourToken('--map-sea')).toBe('#1d9dda');
    document.documentElement.style.removeProperty('--map-sea');
  });

  it('reads any other token as the browser resolves it, through a probe it takes away', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const real = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) =>
      el.tagName === 'SPAN' ? { color: 'rgb(29, 157, 218)' } : { getPropertyValue: () => 'light-dark(#fff, #000)' },
    );
    expect(readColourToken('--map-land', element)).toBe('#1d9dda');
    expect(element.children).toHaveLength(0);
    window.getComputedStyle = real;
  });

  it('keeps each channel between 0 and 255, and black for nothing it can read', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) =>
      el.tagName === 'SPAN' ? { color: 'rgb(300, 12.6, 0)' } : { getPropertyValue: () => '' },
    );
    expect(readColourToken('--x')).toBe('#ff0d00');
    vi.mocked(window.getComputedStyle).mockImplementation((el) => (el.tagName === 'SPAN' ? { color: '' } : { getPropertyValue: () => '' }));
    expect(readColourToken('--x')).toBe('#000000');
  });
});

describe('readStyleColours', () => {
  it('reads each token inside a hidden element wearing the style, then takes it away', () => {
    const style = document.createElement('style');
    style.textContent = '[data-map-style="starry"] { --map-land: #A4C8F0; --map-sea: #0b1530; }';
    document.head.appendChild(style);
    expect(readStyleColours('starry', ['--map-land', '--map-sea'])).toEqual({ '--map-land': '#a4c8f0', '--map-sea': '#0b1530' });
    expect(document.querySelector('[data-map-style]')).toBeNull();
  });

  it('never reads a design’s colours, which sit on [data-map-design]', () => {
    const style = document.createElement('style');
    style.textContent = '[data-map-style="old-map"] { --map-names: #3b2a1a; } [data-map-design] { --map-names: #ffffff; }';
    document.head.appendChild(style);
    const design = document.createElement('div');
    design.setAttribute('data-map-design', '');
    document.body.appendChild(design);
    expect(readStyleColours('old-map', ['--map-names'])).toEqual({ '--map-names': '#3b2a1a' });
  });

  it('takes its element away even when a read fails', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => {
      throw new Error('no styles');
    });
    expect(() => readStyleColours('mono', ['--map-land'])).toThrow('no styles');
    expect(document.querySelector('[data-map-style]')).toBeNull();
  });
});
