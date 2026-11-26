// Vs mode's words (26 Nov 2026; docs/API.md "Vs mode"): what each category is called, how its
// numbers read, the medals and places, and the join link.
import { vsJoinPath } from '@/utils/constants/routes';

export const VS_CATEGORY_LABELS = Object.freeze({
  countries: 'Countries',
  unCountries: 'UN countries',
  continents: 'Continents',
  landmarks: 'Landmarks stamped',
  worldHeritage: 'World Heritage Sites',
  oneShots: 'Life’s One Shots',
  badges: 'Badges',
  flights: 'Flights',
  daysAway: 'Days away',
  distanceKm: 'Distance travelled',
});

export const MEDAL_LABELS = Object.freeze({ gold: 'Gold', silver: 'Silver', bronze: 'Bronze' });

/** A category's label ("Landmarks stamped"); a category the client doesn't know reads as its key. */
export const categoryLabel = (category) => VS_CATEGORY_LABELS[category] || category;

/** A number as it reads: "1,234", "12,345 km"; a dash for someone not counted. */
export function valueWords(category, value) {
  if (value === null || value === undefined) return '–';
  const n = Number(value).toLocaleString('en-GB');
  return category === 'distanceKm' ? `${n} km` : n;
}

/** "1st", "2nd", "3rd", "4th", "11th", "21st". */
export function placeWords(place) {
  if (!place) return '';
  const tens = place % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[place % 10] || 'th';
  return `${place}${suffix}`;
}

/** "2 gold, 1 silver", or "No medals yet". */
export function medalsWords({ gold = 0, silver = 0, bronze = 0 }) {
  const parts = [gold ? `${gold} gold` : '', silver ? `${silver} silver` : '', bronze ? `${bronze} bronze` : ''].filter(Boolean);
  return parts.length ? parts.join(', ') : 'No medals yet';
}

/** The comparison's join link on this site (wherever it's running). */
export const vsJoinLink = (origin, code) => `${origin}${vsJoinPath(code)}`;
