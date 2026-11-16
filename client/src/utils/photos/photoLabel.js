import { formatDay } from '@/utils/functions/dates';
import { spokenVideoLength } from './videoLength';

// What a photo is called to a screen reader: its caption, else the day it was taken. A
// video says so first, with its length: "Video, 1 minute 30 seconds: Over the Nile", and
// whether it's still being prepared or couldn't be (editors only see such a video):
// "Video, 42 seconds, being prepared".
const VIDEO_STATE_WORDS = { PROCESSING: 'being prepared', FAILED: 'couldn’t be prepared' };

export function photoLabel(photo) {
  if (photo.kind === 'VIDEO') {
    const length = photo.durationS ? `Video, ${spokenVideoLength(photo.durationS)}` : 'Video';
    const what = VIDEO_STATE_WORDS[photo.videoState] ? `${length}, ${VIDEO_STATE_WORDS[photo.videoState]}` : length;
    if (photo.caption) return `${what}: ${photo.caption}`;
    return photo.takenAt ? `${what}, from ${formatDay(photo.takenAt)}` : what;
  }
  return photo.caption || (photo.takenAt ? `Photo from ${formatDay(photo.takenAt)}` : 'Photo');
}
