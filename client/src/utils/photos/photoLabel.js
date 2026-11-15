import { formatDay } from '@/utils/functions/dates';

// What a photo is called to a screen reader: its caption, else the day it was taken
export const photoLabel = (photo) => photo.caption || (photo.takenAt ? `Photo from ${formatDay(photo.takenAt)}` : 'Photo');
