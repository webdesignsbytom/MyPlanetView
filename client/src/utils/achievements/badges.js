// The words for each site badge (docs/API.md, "Badges and goals"). The server keeps the
// list and counts progress (server/src/utils/badges.js); it sends each badge's `key` and
// `group`, and the client names them here. A key the client doesn't know yet still shows,
// under a plain name, so a badge added on the server never breaks the page.
import { INHABITED_CONTINENTS, REGIONS } from '@/utils/constants/regions';
import { CONTINENT_LABELS } from '@/utils/map/countries';
import { listNames } from './goals';

// The groups, in the order the suitcase shows them
export const BADGE_GROUPS = [
  { id: 'countries', label: 'Countries' },
  { id: 'continents', label: 'Continents' },
  { id: 'special', label: 'Special places' },
  { id: 'regions', label: 'Regions' },
  { id: 'landmarks', label: 'Landmarks' },
  { id: 'photos', label: 'Photos' },
  { id: 'themes', label: 'Monthly themes' },
];

const COUNTRY_WORDS = { 1: 'First country', 5: 'Five countries', 10: 'Ten countries', 25: '25 countries', 50: '50 countries', 100: '100 countries' };
const continentKey = (continent) => continent.toLowerCase().replace(/_/g, '-');

const WORDS = {
  ...Object.fromEntries(
    Object.entries(COUNTRY_WORDS).map(([need, name]) => [
      `countries-${need}`,
      {
        name,
        short: need,
        description:
          need === '1'
            ? 'Your first country visited or lived in.'
            : `${need} countries visited or lived in. Antarctica and the poles count apart.`,
      },
    ]),
  ),
  ...Object.fromEntries(
    INHABITED_CONTINENTS.map((continent) => [
      `continent-${continentKey(continent)}`,
      { name: CONTINENT_LABELS[continent], description: `A first country in ${CONTINENT_LABELS[continent]}.` },
    ]),
  ),
  'countries-all': {
    name: 'All countries',
    short: 'All',
    description: 'Every country on the map visited or lived in. Antarctica and the poles count apart.',
  },
  'continents-all': { name: 'Six continents', short: '6', description: 'A country on each of the six continents people live on.' },
  antarctica: { name: 'Antarctica', description: 'Antarctica visited. The South Pole brings it with it.' },
  'north-pole': { name: 'North Pole', description: 'The geographic North Pole, at the top of the world.' },
  'south-pole': { name: 'South Pole', description: 'The geographic South Pole, in the middle of Antarctica.' },
  ...Object.fromEntries(
    Object.entries(REGIONS).map(([key, region]) => [
      `region-${key}`,
      {
        name: region.name.replace(/^The /, ''),
        description:
          `Every country in ${region.name.replace(/^The /, 'the ')}: ${listNames(region.codes, region.codes.length)}.` +
          (region.splitUkCodes
            ? ` On a map that shows the UK as its nations: ${listNames(region.splitUkCodes, region.splitUkCodes.length)}.`
            : ''),
      },
    ]),
  ),
  'landmarks-1': { name: 'First stamp', short: '1', description: 'A first landmark stamped: a photo of it confirmed on the map.' },
  'landmarks-10': { name: 'Ten stamps', short: '10', description: '10 landmarks stamped in the passport.' },
  'landmarks-50': { name: '50 stamps', short: '50', description: '50 landmarks stamped in the passport.' },
  'unesco-5': { name: 'Five World Heritage Sites', short: '5', description: '5 UNESCO World Heritage Sites stamped.' },
  'unesco-25': { name: '25 World Heritage Sites', short: '25', description: '25 UNESCO World Heritage Sites stamped.' },
  'photos-100': { name: '100 photos', short: '100', description: '100 photos on the map.' },
  'photos-1000': { name: '1,000 photos', short: '1k', description: '1,000 photos on the map.' },
  'themes-3': { name: 'Three themes', short: '3', description: 'Photos entered in 3 monthly themes.' },
  'themes-6': { name: 'Six themes', short: '6', description: 'Photos entered in 6 monthly themes.' },
  'themes-12': { name: 'A year of themes', short: '12', description: 'Photos entered in 12 monthly themes.' },
};

/** `{ name, description, short? }` for a badge key (`short`: the number on its sticker). */
export function badgeWords(key) {
  return WORDS[key] || { name: key.replace(/-/g, ' '), description: '' };
}

/** The group's label ("Regions"). */
export const badgeGroupLabel = (group) => BADGE_GROUPS.find((g) => g.id === group)?.label || group;
