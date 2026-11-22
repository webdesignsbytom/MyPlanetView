// @vitest-environment node
// The mock's shuffled slideshow order (src/dev/mock/shuffle.js), a copy of the server's
// utils/shuffle.js: the two must give the same order for the same seed, or a show started
// in mock mode would page differently from the real one.
import { describe, expect, it } from 'vitest';
import { pageAfter, parseShuffleSeed, shuffled } from '@/dev/mock/shuffle';
import * as server from '../../../../../server/src/utils/shuffle.js';

const ids = Array.from({ length: 40 }, (_, i) => `photo-${String(i).padStart(2, '0')}`);

describe('parseShuffleSeed', () => {
  it('takes a whole number from 1 to 2^31 − 1, written as digits', () => {
    expect(parseShuffleSeed('1')).toBe(1);
    expect(parseShuffleSeed('2147483647')).toBe(2147483647);
    expect(parseShuffleSeed('0042')).toBe(42);
  });

  it('refuses anything else', () => {
    for (const value of ['0', '2147483648', '-1', '1.5', '1e3', ' 7', '', 'abc', '12345678901', undefined, null, 7]) {
      expect(parseShuffleSeed(value)).toBeNull();
    }
  });

  it('answers as the server does', () => {
    for (const value of ['1', '0', '99', '2147483647', '2147483648', 'x', '9999999999', 5, undefined]) {
      expect(parseShuffleSeed(value)).toBe(server.parseShuffleSeed(value));
    }
  });
});

describe('shuffled', () => {
  it('gives the same order for the same seed, whatever order the ids came in', () => {
    const a = shuffled(ids, 12345);
    const b = shuffled([...ids].reverse(), 12345);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual(ids);
  });

  it('gives another order for another seed', () => {
    expect(shuffled(ids, 1)).not.toEqual(shuffled(ids, 2));
  });

  it('never changes the list it was given', () => {
    const list = ['b', 'a', 'c'];
    shuffled(list, 9);
    expect(list).toEqual(['b', 'a', 'c']);
  });

  it('copes with no ids and one id', () => {
    expect(shuffled([], 3)).toEqual([]);
    expect(shuffled(['only'], 3)).toEqual(['only']);
  });

  it('matches the server for many seeds', () => {
    for (const seed of [1, 2, 7, 42, 1000, 65537, 123456789, 2147483647]) {
      expect(shuffled(ids, seed)).toEqual(server.shuffled(ids, seed));
    }
  });
});

describe('pageAfter', () => {
  const list = ['a', 'b', 'c', 'd', 'e'];

  it('gives the first page with no cursor', () => {
    expect(pageAfter(list, null, 2)).toEqual({ ids: ['a', 'b'], more: true });
  });

  it('gives the page after the cursor, saying when there is more', () => {
    expect(pageAfter(list, 'b', 2)).toEqual({ ids: ['c', 'd'], more: true });
    expect(pageAfter(list, 'c', 2)).toEqual({ ids: ['d', 'e'], more: false });
    expect(pageAfter(list, 'e', 2)).toEqual({ ids: [], more: false });
  });

  it('answers null for a cursor that is no longer in the list', () => {
    expect(pageAfter(list, 'z', 2)).toBeNull();
  });

  it('matches the server', () => {
    for (const [cursor, limit] of [[null, 3], ['a', 1], ['d', 5], ['x', 2], [undefined, 10]]) {
      expect(pageAfter(list, cursor, limit)).toEqual(server.pageAfter(list, cursor, limit));
    }
  });
});
