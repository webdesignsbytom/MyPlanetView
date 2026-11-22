import { describe, expect, it } from 'vitest';
import { copyContents, copyPlaceName, copyStatusText } from '@/utils/travelCopies/travelCopyWords';

describe('copyContents', () => {
  it('lists what’s in a request, leaving out what there’s none of', () => {
    expect(copyContents({ photos: 140, trips: 2, moments: 3 })).toBe('140 photos, 2 trips and 3 moments');
    expect(copyContents({ photos: 1, moments: 1 })).toBe('1 photo and 1 moment');
    expect(copyContents({ trips: 1 })).toBe('1 trip');
    expect(copyContents({ photos: 1200 })).toBe('1,200 photos');
    expect(copyContents({})).toBe('nothing');
  });
});

describe('copyPlaceName', () => {
  it('names a country, or the photos with none', () => {
    expect(copyPlaceName('IE')).toBe('Ireland');
    expect(copyPlaceName(null)).toBe('Photos with no country');
  });
});

describe('copyStatusText', () => {
  it('says a request is waiting, to the person who asked and to the owner', () => {
    expect(copyStatusText({ status: 'PENDING', mine: true })).toBe('Waiting for an answer');
    expect(copyStatusText({ status: 'PENDING', mine: false })).toBe('Waiting for you to approve or decline');
  });

  it('says how far the copying has got', () => {
    expect(copyStatusText({ status: 'APPROVED', photos: 140, progress: { done: 60 } })).toBe('Copying: 60 of 140 photos');
    expect(copyStatusText({ status: 'APPROVED', photos: 0, progress: { done: 0 } })).toBe('Copying…');
  });

  it('says it was declined, or what was copied and what didn’t fit', () => {
    expect(copyStatusText({ status: 'DECLINED' })).toBe('Declined');
    expect(copyStatusText({ status: 'DONE', progress: { copied: 140, skipped: 12 } })).toBe('Copied 140 photos (12 photos didn’t fit)');
    expect(copyStatusText({ status: 'DONE', progress: { copied: 1, skipped: 1 } })).toBe('Copied 1 photo (1 photo didn’t fit)');
    expect(copyStatusText({ status: 'DONE', progress: { copied: 0, skipped: 0 } })).toBe('Copied');
  });
});
