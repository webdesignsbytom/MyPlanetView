// The photos a postcard's front can have from a place (27 Nov 2026; docs/API.md "Postcards"): its
// landmarks whose Commons photo is big enough for a card (postcardPhotos.js), each with its group,
// c a city, w the wilderness, l a landmark. Only the maker imports this.
import { POSTCARD_PHOTOS } from '@/utils/postcards/postcardPhotos';
import { COUNTRY_LANDMARKS } from '@/content/countries/landmarks.generated';
import { countryOf } from '@/utils/map/ukNations';

/**
 * The place's landmarks with a photo big enough for a card's front, cities first, then the
 * wilderness, then landmarks; in each, those on the country guide's list of its best-known first,
 * then A to Z: `{ landmark, group }`
 */
export const photoItems = (landmarks, code) => {
  const fame = new Map((COUNTRY_LANDMARKS[countryOf(code)] || []).map((l, i) => [l.wikidataId, i]));
  const rank = (landmark) => fame.get(landmark.wikidataId) ?? Infinity;
  return landmarks
    .filter((landmark) => POSTCARD_PHOTOS[landmark.slug])
    .map((landmark) => ({ landmark, group: POSTCARD_PHOTOS[landmark.slug] }))
    .sort(
      (a, b) =>
        'cwl'.indexOf(a.group) - 'cwl'.indexOf(b.group) ||
        (rank(a.landmark) === rank(b.landmark) ? 0 : rank(a.landmark) - rank(b.landmark)) ||
        a.landmark.name.localeCompare(b.landmark.name),
    );
};
