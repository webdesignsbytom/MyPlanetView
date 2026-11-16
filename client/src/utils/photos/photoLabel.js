import { formatDay } from '@/utils/functions/dates';
import { spokenVideoLength } from './videoLength';

// What a photo is called to a screen reader: its caption, else the day it was taken. A
// video says so first, with its length: "Video, 1 minute 30 seconds: Over the Nile".
export function photoLabel(photo) {
  if (photo.kind === 'VIDEO') {
    const what = photo.durationS ? `Video, ${spokenVideoLength(photo.durationS)}` : 'Video';
    if (photo.caption) return `${what}: ${photo.caption}`;
    return photo.takenAt ? `${what}, from ${formatDay(photo.takenAt)}` : what;
  }
  return photo.caption || (photo.takenAt ? `Photo from ${formatDay(photo.takenAt)}` : 'Photo');
}
