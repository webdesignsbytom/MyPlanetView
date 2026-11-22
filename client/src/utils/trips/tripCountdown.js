// The countdown to the next trip (22 Nov 2026, the user's wish, from "what else can we do to
// compete"): "12 days until Japan in spring", and whether the trip's month suits the place,
// from its country guide. Pure.
import { MONTH_NAMES, bestMonthsText } from '@/utils/countries/countryContent';

// Shown from a year ahead
export const COUNTDOWN_DAYS = 365;

const dayNumber = (ymd) => {
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};

/** Whole days from `today` to `startDate` (both "YYYY-MM-DD"). */
export const daysUntil = (startDate, today) => dayNumber(startDate) - dayNumber(today);

/** "12 days until Japan in spring", "1 day until …", "Japan in spring starts today". */
export function countdownWords(title, days) {
  if (days <= 0) return `${title} starts today`;
  return `${days.toLocaleString('en-GB')} ${days === 1 ? 'day' : 'days'} until ${title}`;
}

/**
 * The trip's month against its country's guide (`{ name, months }`, January to December
 * 'best' | 'good' | 'avoid'): "April is the best time for Japan.", "… a good time …; the best
 * is …", "April isn't the best time for Japan: the best is …". '' without a guide.
 */
export function whenWords(guide, startDate) {
  if (!guide?.months?.length || !startDate) return '';
  const month = Number(String(startDate).slice(5, 7)) - 1;
  const name = MONTH_NAMES[month];
  const best = bestMonthsText(guide.months);
  const rating = guide.months[month];
  if (rating === 'best') return `${name} is the best time for ${guide.name}.`;
  if (rating === 'good') return best ? `${name} is a good time for ${guide.name}; the best is ${best}.` : `${name} is a good time for ${guide.name}.`;
  return best ? `${name} isn’t the best time for ${guide.name}: the best is ${best}.` : '';
}
