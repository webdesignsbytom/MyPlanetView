// A map design's colour for the strings between places (src/utils/map/mapDesign.js;
// docs/API.md "Strings", "Map designs")
import { describe, expect, it } from 'vitest';
import { EMPTY_DESIGN, designCss, splitOpacity, withOpacity } from '@/utils/map/mapDesign';

describe('the strings’ colour in a design', () => {
  it('starts as the style’s usual one', () => {
    expect(EMPTY_DESIGN.string).toBeNull();
    expect(designCss({ string: null })).toBe('');
  });

  it('sets --map-string, which the strings read, with the other tokens', () => {
    expect(designCss({ string: '#1d4ed8' })).toBe('[data-map-design]{--map-string:#1d4ed8}');
    expect(designCss({ names: '#000000', hover: '#00ff00', string: '#1d4ed8' })).toBe(
      '[data-map-design]{--map-names:#000000;--map-hover:#00ff00;--map-string:#1d4ed8}',
    );
  });

  it('lets nothing but "#rrggbb" or "#rrggbbaa" in', () => {
    for (const string of ['red', '#FFF', 'url(x)', '#1d4ed8;}body{x:y', '#1d4ed8800', '#1d4ed8f', 12]) expect(designCss({ string })).toBe('');
  });

  // See-through strings (25 Nov 2026, the user's wish); the other colours stay opaque
  it('can be see-through, and only the strings', () => {
    expect(designCss({ string: '#1d4ed866' })).toBe('[data-map-design]{--map-string:#1d4ed866}');
    expect(designCss({ names: '#00000066', grid: '#ffffff80', hover: '#00ff0080' })).toBe('');
  });
});

// Two colours twisted together, as baker's twine (25 Nov 2026, the user's wish)
describe('a second colour twisted into the strings', () => {
  it('starts with none: strings of one colour', () => {
    expect(EMPTY_DESIGN.stringTwist).toBeNull();
    expect(designCss({ string: '#1d4ed8', stringTwist: null })).toBe('[data-map-design]{--map-string:#1d4ed8}');
  });

  it('shows the twine: the second colour, its width and strands', () => {
    expect(designCss({ string: '#c8102e', stringTwist: '#ffffff' })).toBe(
      '[data-map-design]{--map-string:#c8102e;--map-string-2:#ffffff;--map-string-width:3.6px;--map-string-twist:inline}',
    );
    // With the style's usual first colour, only the twine's own
    expect(designCss({ string: null, stringTwist: '#ffffff' })).toBe(
      '[data-map-design]{--map-string-2:#ffffff;--map-string-width:3.6px;--map-string-twist:inline}',
    );
  });

  it('keeps a see-through twine’s colours opaque, its opacity on the string as a whole', () => {
    expect(designCss({ string: '#c8102e66', stringTwist: '#ffffff' })).toBe(
      '[data-map-design]{--map-string:#c8102e;--map-string-alpha:0.4;--map-string-2:#ffffff;--map-string-width:3.6px;--map-string-twist:inline}',
    );
  });

  it('lets nothing but an opaque "#rrggbb" in as the second colour', () => {
    for (const stringTwist of ['white', '#ffffff80', '#fff', '#ffffff;}body{x:y', 12]) {
      expect(designCss({ string: '#c8102e', stringTwist })).toBe('[data-map-design]{--map-string:#c8102e}');
    }
  });
});

describe('a colour’s opacity', () => {
  it('splits into the picker’s colour and a whole percent, 100 with none', () => {
    expect(splitOpacity('#1d4ed8')).toEqual({ hex: '#1d4ed8', opacity: 100 });
    expect(splitOpacity('#1d4ed880')).toEqual({ hex: '#1d4ed8', opacity: 50 });
    expect(splitOpacity('#1d4ed866')).toEqual({ hex: '#1d4ed8', opacity: 40 });
    expect(splitOpacity('#1d4ed800')).toEqual({ hex: '#1d4ed8', opacity: 0 });
    expect(splitOpacity(null)).toEqual({ hex: '#000000', opacity: 100 });
    expect(splitOpacity('red')).toEqual({ hex: '#000000', opacity: 100 });
  });

  it('joins again, with no opacity digits while fully opaque', () => {
    expect(withOpacity('#1d4ed8', 100)).toBe('#1d4ed8');
    expect(withOpacity('#1d4ed8', 50)).toBe('#1d4ed880');
    expect(withOpacity('#1d4ed8', 5)).toBe('#1d4ed80d');
    expect(withOpacity('#1d4ed8', 0)).toBe('#1d4ed800');
    expect(withOpacity('#1d4ed8', 140)).toBe('#1d4ed8');
  });

  it('gives back the slider’s every step', () => {
    for (let percent = 0; percent <= 100; percent += 5) expect(splitOpacity(withOpacity('#123456', percent)).opacity).toBe(percent);
  });
});
