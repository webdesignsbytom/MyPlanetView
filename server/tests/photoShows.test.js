// Slideshows of chosen photos (25 Nov 2026; docs/API.md "Photo slideshows"): the rules
// (src/utils/photoShows.js), pure, and their codes kept out of the logs.
import { describe, expect, it } from 'vitest';
import {
  SHOWS_PER_MAP,
  SHOW_DEFAULT_SECONDS,
  SHOW_PHOTOS_MAX,
  SHOW_SECONDS,
  parseShowPhotoIds,
  parseShowSeconds,
  showablePhotoIds,
} from '../src/utils/photoShows.js';
import { redactUrl } from '../src/utils/redactUrl.js';

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('parseShowPhotoIds', () => {
  it('takes 1 to 500 different photo ids, in their order', () => {
    expect(parseShowPhotoIds([id(2), id(1)])).toEqual([id(2), id(1)]);
    expect(parseShowPhotoIds([id(1)])).toEqual([id(1)]);
    const most = Array.from({ length: SHOW_PHOTOS_MAX }, (_, i) => id(i));
    expect(parseShowPhotoIds(most)).toHaveLength(SHOW_PHOTOS_MAX);
  });

  it('refuses none, too many, a repeat, or anything that isn’t a photo id', () => {
    expect(parseShowPhotoIds([])).toBeNull();
    expect(parseShowPhotoIds(Array.from({ length: SHOW_PHOTOS_MAX + 1 }, (_, i) => id(i)))).toBeNull();
    expect(parseShowPhotoIds([id(1), id(1)])).toBeNull();
    expect(parseShowPhotoIds(['not-an-id'])).toBeNull();
    expect(parseShowPhotoIds([id(1), 7])).toBeNull();
    expect(parseShowPhotoIds(id(1))).toBeNull();
    expect(parseShowPhotoIds(undefined)).toBeNull();
  });
});

describe('parseShowSeconds', () => {
  it('takes 3, 5 or 8, and gives the default when none is given', () => {
    for (const seconds of SHOW_SECONDS) expect(parseShowSeconds(seconds)).toBe(seconds);
    expect(parseShowSeconds(undefined)).toBe(SHOW_DEFAULT_SECONDS);
    expect(SHOW_SECONDS).toContain(SHOW_DEFAULT_SECONDS);
  });

  it('refuses any other number, or a number as text', () => {
    for (const bad of [0, 4, 10, -3, 5.5, '5', true]) expect(parseShowSeconds(bad)).toBeNull();
  });
});

describe('showablePhotoIds', () => {
  it('keeps the show’s order, leaving out what a viewer can’t see any more', () => {
    expect(showablePhotoIds([id(3), id(1), id(2)], [id(2), id(3)])).toEqual([id(3), id(2)]);
    expect(showablePhotoIds([id(1)], [])).toEqual([]);
  });
});

it('guards a map against a runaway script, well beyond what a person makes', () => {
  expect(SHOWS_PER_MAP).toBeGreaterThanOrEqual(100);
});

it('keeps a show’s code out of the logs', () => {
  expect(redactUrl('/api/show/SPN2-SHW8-TRP5')).toBe('/api/show/:code');
  expect(redactUrl('/api/show/SPN2SHW8TRP5/photos?order=show&limit=30')).toMatch(/^\/api\/show\/:code\/photos\?/);
  // Its editors' routes carry ids, not codes
  expect(redactUrl('/api/photo-shows/0f3c/reset-link')).toBe('/api/photo-shows/0f3c/reset-link');
});
