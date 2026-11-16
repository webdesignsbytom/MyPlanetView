import { describe, it, expect } from 'vitest';
import { pageAfter, parseShuffleSeed, shuffled } from '../src/utils/shuffle.js';

const ids = [...Array(50)].map((_, i) => `id-${String(i).padStart(2, '0')}`);

describe('the shuffled slideshow', () => {
  it('takes a whole-number seed only', () => {
    expect(parseShuffleSeed('42')).toBe(42);
    for (const bad of [undefined, '', '0', '-1', '1.5', 'abc', '99999999999', '2147483648']) expect(parseShuffleSeed(bad)).toBeNull();
  });

  it('gives the same order for the same seed, whatever order the ids came in', () => {
    const a = shuffled(ids, 7);
    expect(shuffled([...ids].reverse(), 7)).toEqual(a);
    expect(shuffled(ids, 8)).not.toEqual(a);
    expect([...a].sort()).toEqual(ids);
  });

  it('pages through every id once', () => {
    const order = shuffled(ids, 99);
    const seen = [];
    let cursor;
    for (;;) {
      const page = pageAfter(order, cursor, 12);
      seen.push(...page.ids);
      if (!page.more) break;
      cursor = page.ids[page.ids.length - 1];
    }
    expect(seen).toEqual(order);
    expect(pageAfter(order, 'gone', 12)).toBeNull();
  });
});
