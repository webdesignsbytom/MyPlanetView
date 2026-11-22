// @vitest-environment node
// A landmark's photo and its credit (src/utils/map/landmarkPhotoInfo.js), and the generated
// credits it reads (landmarkPhotos.js). The media address is mocked.
import { describe, expect, it, vi } from 'vitest';
import { landmarkPhotoInfo } from '@/utils/map/landmarkPhotoInfo';
import { LANDMARK_PHOTOS, LICENCES } from '@/utils/map/landmarkPhotos';

vi.mock('@/utils/media/mediaUrl', () => ({ mediaUrlFrom: ({ objectKey }) => `https://cdn.test/${objectKey}` }));

const data = {
  LICENCES: [
    ['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0'],
    ['Public domain', ''],
  ],
  LANDMARK_PHOTOS: {
    'eiffel-tower': [480, 640, 'Jane Doe', 0, 'Tour Eiffel, Paris (2019).jpg'],
    'old-bridge': [480, 320, 'Someone', 9, 'Bridge.jpg'],
  },
};

describe('landmarkPhotoInfo', () => {
  it('gives the photo’s two files, size and credit', () => {
    expect(landmarkPhotoInfo(data, 'eiffel-tower')).toEqual({
      avif: 'https://cdn.test/landmarkPhotos/eiffel-tower-480.avif',
      webp: 'https://cdn.test/landmarkPhotos/eiffel-tower-480.webp',
      width: 480,
      height: 640,
      author: 'Jane Doe',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Tour_Eiffel%2C_Paris_(2019).jpg',
    });
  });

  it('gives an empty licence for one it doesn’t know', () => {
    const info = landmarkPhotoInfo(data, 'old-bridge');
    expect(info.licence).toBe('');
    expect(info.licenceUrl).toBe('');
  });

  it('is null for a landmark with no photo, or before the credits have loaded', () => {
    expect(landmarkPhotoInfo(data, 'diy-gid-biy')).toBeNull();
    expect(landmarkPhotoInfo(null, 'eiffel-tower')).toBeNull();
    expect(landmarkPhotoInfo({}, 'eiffel-tower')).toBeNull();
  });

  it('reads the real credits', () => {
    const [slug] = Object.keys(LANDMARK_PHOTOS);
    const info = landmarkPhotoInfo({ LICENCES, LANDMARK_PHOTOS }, slug);
    expect(info.avif).toBe(`https://cdn.test/landmarkPhotos/${slug}-${LANDMARK_PHOTOS[slug][0]}.avif`);
    expect(info.licence).toBe(LICENCES[LANDMARK_PHOTOS[slug][3]][0]);
  });
});

describe('the generated credits', () => {
  it('have a licence name for each, with a link unless it needs none', () => {
    for (const [name, url] of LICENCES) {
      expect(name).toBeTruthy();
      if (url) expect(url).toMatch(/^https:\/\//);
    }
  });

  it('give every photo a slug, a size within 480 × 640, an author, a known licence and a Commons file', () => {
    const entries = Object.entries(LANDMARK_PHOTOS);
    expect(entries.length).toBeGreaterThan(1300);
    for (const [slug, [width, height, author, licenceAt, file]] of entries) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(width > 0 && width <= 480, slug).toBe(true);
      expect(height > 0 && height <= 640, slug).toBe(true);
      expect(typeof author, slug).toBe('string');
      expect(LICENCES[licenceAt], slug).toBeDefined();
      expect(file, slug).toMatch(/\.(jpe?g|png|tiff?|webp)$/i);
    }
  });
});
