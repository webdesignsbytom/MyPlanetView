import { describe, expect, it } from 'vitest';
import { photoLabel } from '@/utils/photos/photoLabel';
import { formatVideoLength, spokenVideoLength } from '@/utils/photos/videoLength';

describe('formatVideoLength', () => {
  it('shows minutes and seconds', () => {
    expect(formatVideoLength(42)).toBe('0:42');
    expect(formatVideoLength(90)).toBe('1:30');
    expect(formatVideoLength(180)).toBe('3:00');
    expect(formatVideoLength(59.6)).toBe('1:00');
  });

  it('shows nothing as 0:00', () => {
    expect(formatVideoLength(undefined)).toBe('0:00');
    expect(formatVideoLength(-5)).toBe('0:00');
    expect(formatVideoLength('soon')).toBe('0:00');
  });
});

describe('spokenVideoLength', () => {
  it('says the length in words', () => {
    expect(spokenVideoLength(1)).toBe('1 second');
    expect(spokenVideoLength(42)).toBe('42 seconds');
    expect(spokenVideoLength(60)).toBe('1 minute');
    expect(spokenVideoLength(61)).toBe('1 minute 1 second');
    expect(spokenVideoLength(150)).toBe('2 minutes 30 seconds');
    expect(spokenVideoLength(0)).toBe('0 seconds');
  });
});

describe('photoLabel', () => {
  it('names a photo by its caption, else its day', () => {
    expect(photoLabel({ caption: 'Sunset', takenAt: '2025-06-14T19:00:00Z' })).toBe('Sunset');
    expect(photoLabel({ takenAt: '2025-06-14T19:00:00Z' })).toBe('Photo from 14 Jun 2025');
    expect(photoLabel({})).toBe('Photo');
  });

  it('says a video is one, with its length', () => {
    expect(photoLabel({ kind: 'VIDEO', durationS: 90, caption: 'Over the Nile' })).toBe('Video, 1 minute 30 seconds: Over the Nile');
    expect(photoLabel({ kind: 'VIDEO', durationS: 42, takenAt: '2025-06-14' })).toBe('Video, 42 seconds, from 14 Jun 2025');
    expect(photoLabel({ kind: 'VIDEO' })).toBe('Video');
  });

  it('says when a video is still being prepared, or couldn’t be', () => {
    expect(photoLabel({ kind: 'VIDEO', durationS: 42, videoState: 'PROCESSING' })).toBe('Video, 42 seconds, being prepared');
    expect(photoLabel({ kind: 'VIDEO', videoState: 'FAILED', caption: 'Rapids' })).toBe('Video, couldn’t be prepared: Rapids');
    expect(photoLabel({ kind: 'VIDEO', durationS: 5, videoState: 'READY' })).toBe('Video, 5 seconds');
  });
});
