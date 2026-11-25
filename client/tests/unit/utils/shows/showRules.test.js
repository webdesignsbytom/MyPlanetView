// Slideshows of chosen photos: the client's copy of the server's rules (utils/shows/showRules.js)
import { describe, expect, it } from 'vitest';
import {
  SHOW_DEFAULT_SECONDS,
  SHOW_DEFAULT_TITLE,
  SHOW_PHOTOS_MAX,
  SHOW_SECONDS,
  SHOW_TITLE_MAX,
  choosable,
  photoCountWords,
  showLink,
  showOrder,
} from '@/utils/shows/showRules';
import * as server from '../../../../../server/src/utils/photoShows.js';

describe('the server’s rules, copied', () => {
  it('has the same limits and defaults', () => {
    expect(SHOW_TITLE_MAX).toBe(server.SHOW_TITLE_MAX);
    expect(SHOW_PHOTOS_MAX).toBe(server.SHOW_PHOTOS_MAX);
    expect([...SHOW_SECONDS]).toEqual([...server.SHOW_SECONDS]);
    expect(SHOW_DEFAULT_SECONDS).toBe(server.SHOW_DEFAULT_SECONDS);
    expect(SHOW_DEFAULT_TITLE).toBe(server.SHOW_DEFAULT_TITLE);
  });
});

describe('showOrder', () => {
  const chosen = [
    { id: 'c', takenAt: '2024-05-01T10:00:00.000Z' },
    { id: 'none-1', takenAt: null },
    { id: 'a', takenAt: '2019-01-01T10:00:00.000Z' },
    { id: 'none-2' },
    { id: 'b', takenAt: '2021-03-01T10:00:00.000Z' },
  ];

  it('plays them as chosen', () => {
    expect(showOrder(chosen, 'chosen')).toEqual(['c', 'none-1', 'a', 'none-2', 'b']);
  });

  it('or when taken, oldest first, the undated after them in the order chosen', () => {
    expect(showOrder(chosen, 'taken')).toEqual(['a', 'b', 'c', 'none-1', 'none-2']);
  });

  it('keeps the order chosen for two taken at the same moment', () => {
    const same = [
      { id: 'y', takenAt: '2020-01-01T00:00:00.000Z' },
      { id: 'x', takenAt: '2020-01-01T00:00:00.000Z' },
    ];
    expect(showOrder(same, 'taken')).toEqual(['y', 'x']);
  });
});

describe('words and links', () => {
  it('links to the show on this site', () => {
    expect(showLink('https://example.test', 'SPN2-SHW8-TRP5')).toBe('https://example.test/show/SPN2-SHW8-TRP5');
  });

  it('counts photos', () => {
    expect(photoCountWords(1)).toBe('1 photo');
    expect(photoCountWords(1500)).toBe('1,500 photos');
  });

  it('never offers a hidden photo', () => {
    expect(choosable({ hidden: true })).toBe(false);
    expect(choosable({ hidden: false })).toBe(true);
    expect(choosable({})).toBe(true);
  });
});
