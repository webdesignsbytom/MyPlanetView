// Friends challenges' words (docs/API.md, "Friends challenges"): what each measure counts,
// a count in its words, where a challenge stands, and its dates. Pure.
import { formatDay } from '@/utils/functions/dates';

export const CHALLENGE_MEASURE_ORDER = ['NEW_COUNTRIES', 'COUNTRIES', 'LANDMARKS', 'THEME_PHOTOS'];

export const CHALLENGE_MEASURES = Object.freeze({
  NEW_COUNTRIES: {
    label: 'New countries',
    description: 'Countries whose first photo on your map was taken between the dates.',
    one: 'new country',
    many: 'new countries',
  },
  COUNTRIES: {
    label: 'Countries visited',
    description: 'Countries with a photo taken between the dates, new or not.',
    one: 'country',
    many: 'countries',
  },
  LANDMARKS: {
    label: 'Landmarks stamped',
    description: 'Landmarks stamped in your passport from photos taken between the dates.',
    one: 'landmark',
    many: 'landmarks',
  },
  THEME_PHOTOS: {
    label: 'Photos in the monthly themes',
    description: 'Photos entered in the monthly photo themes between the dates.',
    one: 'theme photo',
    many: 'theme photos',
  },
});

export const measureLabel = (measure) => CHALLENGE_MEASURES[measure]?.label ?? measure;

/** "3 new countries", "1 landmark" */
export function countWords(measure, count) {
  const words = CHALLENGE_MEASURES[measure];
  if (!words) return String(count);
  return `${count.toLocaleString('en-GB')} ${count === 1 ? words.one : words.many}`;
}

export const STATUS_WORDS = Object.freeze({ UPCOMING: 'Starts soon', RUNNING: 'On now', ENDED: 'Finished' });

/** "1 Jan 2027 to 31 Dec 2027" */
export const dateRange = ({ startsOn, endsOn }) => `${formatDay(startsOn)} to ${formatDay(endsOn)}`;

/** "1st", "2nd", "3rd", "11th" */
export function ordinal(n) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`;
}
