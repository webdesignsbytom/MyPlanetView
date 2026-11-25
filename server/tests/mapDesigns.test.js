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
  VISITED_LOOKS,
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
    for (const value of ['#fff', 'red', 'rgb(0,0,0)', '#12345g', '#1234567', '#11223380', 12, {}, undefined, 'url(x)']) {
      expect(cleanColour(value).ok).toBe(false);
    }
  });
  it('takes an opacity only when asked, kept as "#rrggbb" when fully opaque', () => {
    expect(cleanColour('#C8102E80', { alpha: true })).toEqual({ ok: true, value: '#c8102e80' });
    expect(cleanColour('#c8102e00', { alpha: true })).toEqual({ ok: true, value: '#c8102e00' });
    expect(cleanColour('#c8102eFF', { alpha: true })).toEqual({ ok: true, value: '#c8102e' });
    expect(cleanColour('#c8102e', { alpha: true })).toEqual({ ok: true, value: '#c8102e' });
    expect(cleanColour(null, { alpha: true })).toEqual({ ok: true, value: null });
    for (const value of ['#c8102e8', '#c8102e8g', '#c8102e800', 'rgba(0,0,0,0.5)']) {
      expect(cleanColour(value, { alpha: true }).ok).toBe(false);
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
    // The strings may be see-through (25 Nov 2026, the user's wish); the other colours never
    expect(parseDesignChange({ string: '#1D4ED866' })).toEqual({ data: { stringColour: '#1d4ed866' }, codes: [] });
    expect(parseDesignChange({ string: '#1d4ed8ff' })).toEqual({ data: { stringColour: '#1d4ed8' }, codes: [] });
    expect(parseDesignChange({ names: '#00000080' })).toEqual({ error: 'invalidDesignColour' });
    expect(parseDesignChange({ hover: '#ff00ff80' })).toEqual({ error: 'invalidDesignColour' });
    expect(parseDesignChange({ countries: { FR: '#aa000080' } })).toEqual({ error: 'invalidDesignColour' });
    // A second colour twisted in, as baker's twine (25 Nov 2026, the user's wish): opaque only
    expect(parseDesignChange({ stringTwist: '#FFFFFF' })).toEqual({ data: { stringTwistColour: '#ffffff' }, codes: [] });
    expect(parseDesignChange({ stringTwist: null })).toEqual({ data: { stringTwistColour: null }, codes: [] });
    expect(parseDesignChange({ stringTwist: '#ffffff80' })).toEqual({ error: 'invalidDesignColour' });
    expect(parseDesignChange({ stringTwist: 'white' })).toEqual({ error: 'invalidDesignColour' });
    // The planned strings' own colour and twist, as the visited ones' (25 Nov 2026, the user's wish)
    expect(parseDesignChange({ plannedString: '#1D4ED880', plannedStringTwist: '#FFFFFF' })).toEqual({
      data: { plannedStringColour: '#1d4ed880', plannedStringTwistColour: '#ffffff' },
      codes: [],
    });
    expect(parseDesignChange({ plannedString: null, plannedStringTwist: null })).toEqual({
      data: { plannedStringColour: null, plannedStringTwistColour: null },
      codes: [],
    });
    expect(parseDesignChange({ plannedStringTwist: '#ffffff80' })).toEqual({ error: 'invalidDesignColour' });
    expect(parseDesignChange({ plannedString: 'blue' })).toEqual({ error: 'invalidDesignColour' });
  });
  // How visited places show, and their colour (25 Nov 2026, the user's wish)
  it('reads how visited places show, in any case, and their colour', () => {
    expect(VISITED_LOOKS).toEqual(['BADGE', 'COLOUR', 'BOTH']);
    expect(parseDesignChange({ visitedLook: 'colour', visited: '#7C3AED' })).toEqual({ data: { visitedColour: '#7c3aed', visitedLook: 'COLOUR' }, codes: [] });
    expect(parseDesignChange({ visitedLook: 'BOTH' })).toEqual({ data: { visitedLook: 'BOTH' }, codes: [] });
    expect(parseDesignChange({ visited: null })).toEqual({ data: { visitedColour: null }, codes: [] });
    expect(parseDesignChange({ visitedLook: 'STICKER' })).toEqual({ error: 'invalidDesign' });
    expect(parseDesignChange({ visitedLook: 1 })).toEqual({ error: 'invalidDesign' });
    // Opaque only
    expect(parseDesignChange({ visited: '#7c3aed80' })).toEqual({ error: 'invalidDesignColour' });
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
