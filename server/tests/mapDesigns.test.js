// A map's own design: the colour and picture rules (src/utils/mapDesigns.js), pure.
import { describe, expect, it } from 'vitest';
import {
  DESIGN_MAX_COLOURS,
  DESIGN_PICTURE_MAX_BYTES,
  checkDesignPicture,
  cleanColour,
  isColourablePlace,
  parseDesignChange,
  storedColours,
} from '../src/utils/mapDesigns.js';

describe('cleanColour', () => {
  it('keeps "#rrggbb", in lower case', () => {
    expect(cleanColour('#1D9DDA')).toEqual({ ok: true, value: '#1d9dda' });
    expect(cleanColour(' #ffffff ')).toEqual({ ok: true, value: '#ffffff' });
  });
  it('takes null as the usual colour', () => {
    expect(cleanColour(null)).toEqual({ ok: true, value: null });
  });
  it('refuses anything else', () => {
    for (const value of ['#fff', 'red', 'rgb(0,0,0)', '#12345g', '#1234567', 12, {}, undefined, 'url(x)']) {
      expect(cleanColour(value).ok).toBe(false);
    }
  });
});

describe('parseDesignChange', () => {
  it('reads every field', () => {
    expect(parseDesignChange({ shown: false, names: '#FFFFFF', grid: null, hover: '#22AA44', countries: { FR: '#AA0000', GB: null } })).toEqual({
      data: { shown: false, namesColour: '#ffffff', gridColour: null, hoverColour: '#22aa44', countryColours: { FR: '#aa0000' } },
      codes: ['FR'],
    });
  });
  it('leaves out what is not sent', () => {
    expect(parseDesignChange({ names: '#000000' })).toEqual({ data: { namesColour: '#000000' }, codes: [] });
    // The hover colour alone, and back to the style's usual one
    expect(parseDesignChange({ hover: '#ff00ff' })).toEqual({ data: { hoverColour: '#ff00ff' }, codes: [] });
    expect(parseDesignChange({ hover: null })).toEqual({ data: { hoverColour: null }, codes: [] });
    // The strings' colour (docs/API.md "Strings"), and back to the style's usual red
    expect(parseDesignChange({ string: '#1D4ED8' })).toEqual({ data: { stringColour: '#1d4ed8' }, codes: [] });
    expect(parseDesignChange({ string: null })).toEqual({ data: { stringColour: null }, codes: [] });
    expect(parseDesignChange({ string: 'red' })).toEqual({ error: 'invalidDesignColour' });
  });
  it('empties the colours with an empty set', () => {
    expect(parseDesignChange({ countries: {} })).toEqual({ data: { countryColours: {} }, codes: [] });
  });
  it('refuses an empty change, a bad switch or a bad colour', () => {
    expect(parseDesignChange({})).toEqual({ error: 'invalidDesign' });
    expect(parseDesignChange(null)).toEqual({ error: 'invalidDesign' });
    expect(parseDesignChange({ shown: 'yes' })).toEqual({ error: 'invalidDesign' });
    expect(parseDesignChange({ names: 'white' })).toEqual({ error: 'invalidDesignColour' });
    expect(parseDesignChange({ hover: 'green' })).toEqual({ error: 'invalidDesignColour' });
    expect(parseDesignChange({ hover: '#0f0' })).toEqual({ error: 'invalidDesignColour' });
    expect(parseDesignChange({ countries: { FR: 'blue' } })).toEqual({ error: 'invalidDesignColour' });
  });
  it('refuses a list, a code that is not a place code, or too many', () => {
    expect(parseDesignChange({ countries: ['FR'] })).toEqual({ error: 'invalidDesign' });
    expect(parseDesignChange({ countries: { fr: '#000000' } })).toEqual({ error: 'invalidDesignPlace' });
    expect(parseDesignChange({ countries: JSON.parse('{"__proto__":"#000000"}') })).toEqual({ error: 'invalidDesignPlace' });
    const many = Object.fromEntries(Array.from({ length: DESIGN_MAX_COLOURS + 1 }, (_, i) => [`A${i}`, '#000000']));
    expect(parseDesignChange({ countries: many })).toEqual({ error: 'invalidDesign' });
  });
});

describe('isColourablePlace', () => {
  it('takes countries, Antarctica, the nations and regions', () => {
    for (const place of [
      { code: 'FR', kind: 'COUNTRY' },
      { code: 'AQ', kind: 'SPECIAL' },
      { code: 'XE', kind: 'NATION' },
      { code: 'XH', kind: 'REGION' },
    ]) {
      expect(isColourablePlace(place)).toBe(true);
    }
  });
  it('never a pole or an unknown place', () => {
    expect(isColourablePlace({ code: 'XN', kind: 'SPECIAL' })).toBe(false);
    expect(isColourablePlace({ code: 'QS', kind: 'SPECIAL' })).toBe(false);
    expect(isColourablePlace(undefined)).toBe(false);
  });
});

describe('storedColours', () => {
  it('keeps only well-formed entries', () => {
    expect(storedColours({ FR: '#aa0000', bad: '#000000', GB: 'red' })).toEqual({ FR: '#aa0000' });
    expect(storedColours(null)).toEqual({});
    expect(storedColours(['#000000'])).toEqual({});
  });
});

describe('checkDesignPicture', () => {
  it('takes a web image up to the limit', () => {
    expect(checkDesignPicture({ contentType: 'image/webp', bytes: 1000 })).toBeNull();
    expect(checkDesignPicture({ contentType: 'image/jpeg', bytes: DESIGN_PICTURE_MAX_BYTES })).toBeNull();
  });
  it('refuses other types, bad sizes and big files', () => {
    expect(checkDesignPicture({ contentType: 'image/svg+xml', bytes: 10 })).toBe('designPictureType');
    expect(checkDesignPicture({ contentType: 'image/gif', bytes: 10 })).toBe('designPictureType');
    expect(checkDesignPicture({ contentType: 'image/png', bytes: 0 })).toBe('designPictureInvalid');
    expect(checkDesignPicture({ contentType: 'image/png', bytes: 1.5 })).toBe('designPictureInvalid');
    expect(checkDesignPicture({ contentType: 'image/png', bytes: DESIGN_PICTURE_MAX_BYTES + 1 })).toBe('designPictureTooLarge');
  });
});
