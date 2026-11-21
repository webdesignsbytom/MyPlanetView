// "Your year in travel" (docs/API.md "Year in travel"; 21 Nov 2026, the user's wish, from the
// business review: a December recap made to share, as Polarsteps' Unpacked is): which year
// to show, which slides a recap gets, its share card, and the session's recaps.
import { getYearRecap } from '@/api/travelApi';
import { shownDesign } from '@/utils/map/mapDesign';

/** The year to show: last year in January, this year otherwise. */
export const recapYearFor = (now = new Date()) => (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());

/** December and January: the map offers the year's recap with a tag (RecapTag). */
export const isRecapSeason = (now = new Date()) => now.getMonth() === 11 || now.getMonth() === 0;

/** Whether a year has anything to show (as the server's recapHasAnything). */
export const recapHasAnything = (recap) =>
  Boolean(recap && (recap.places.length || recap.photos || recap.videos || recap.trips.length || recap.moments));

const word = (n, one, many) => (n === 1 ? one : many);

/** The slides, in order: only those with something to show, the share card last. */
export function recapSlides(recap) {
  if (!recapHasAnything(recap)) return [];
  const slides = ['cover'];
  if (recap.places.length) slides.push('places');
  if (recap.photos || recap.videos) slides.push('photos');
  if (recap.stamps?.count) slides.push('stamps');
  if (recap.trips.length || recap.moments) slides.push('trips');
  slides.push('share');
  return slides;
}

/** The year's share card (drawShareCard's options): its places coloured in, three numbers. */
export function recapCardOptions(recap, map) {
  const stats = [{ value: recap.countries, label: word(recap.countries, 'country', 'countries') }];
  if (recap.newCountries.length) stats.push({ value: recap.newCountries.length, label: word(recap.newCountries.length, 'new country', 'new countries') });
  if (recap.photos) stats.push({ value: recap.photos, label: word(recap.photos, 'photo', 'photos') });
  if (stats.length < 3 && recap.stamps?.count) stats.push({ value: recap.stamps.count, label: word(recap.stamps.count, 'landmark', 'landmarks') });
  if (stats.length < 3 && recap.trips.length) stats.push({ value: recap.trips.length, label: word(recap.trips.length, 'trip', 'trips') });
  return {
    kicker: map.name,
    title: `${recap.year} in travel`,
    highlight: recap.places,
    stats: stats.slice(0, 3),
    splitUk: Boolean(map.splitUk),
    colours: shownDesign(map.design)?.countries ?? null,
    fileName: `my-planet-view-${recap.year}.png`,
    shareText: `My ${recap.year} in travel: ${recap.countries} ${word(recap.countries, 'country', 'countries')}.`,
  };
}

// The session's recaps, one request each (the tag and the dialog share them)
const recaps = new Map();
export function loadYearRecap(mapId, year) {
  const key = `${mapId}:${year}`;
  if (!recaps.has(key)) {
    recaps.set(
      key,
      getYearRecap(mapId, year).then(
        ({ recap }) => recap,
        (err) => {
          recaps.delete(key);
          throw err;
        },
      ),
    );
  }
  return recaps.get(key);
}
