// The words for a badge's story (27 Nov 2026, the user's wish: "click on an achieved badge and see
// ... what they did to earn it"; docs/API.md "Badges and goals"): the server sends what the badge
// counts, in order, and which one earned it (`earnedWith`); these say so. Pure.
import { REGIONS } from '@/utils/constants/regions';
import { CONTINENT_LABELS, countryName } from '@/utils/map/countries';
import { ONE_SHOT_BY_KEY } from '@/utils/oneShots/oneShotItems';
import { formatMomentDate } from '@/utils/moments/momentDates';
import { monthLabel } from '@/utils/themes/themeWords';
import { formatDay } from '@/utils/functions/dates';
import { COLLECTION_TIER_LABELS } from './collections';

const ORDINAL_WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

/** 1 -> "first" … 10 -> "tenth", then 11 -> "11th", 21 -> "21st", 112 -> "112th". */
export function ordinal(n) {
  if (n >= 1 && n <= ORDINAL_WORDS.length) return ORDINAL_WORDS[n - 1];
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  return `${n.toLocaleString('en-GB')}${suffix}`;
}

// "The Nordic countries" -> "the Nordic countries", in a sentence
const regionName = (key) => (REGIONS[key]?.name || key).replace(/^The /, 'the ');

/** What an item is called: a place's name, a landmark's, a One Shot's, a theme's title. */
export function storyItemName(story, item) {
  if (!item) return '';
  if (story.kind === 'stamps') return item.name;
  if (story.kind === 'oneShots') return ONE_SHOT_BY_KEY.get(item.itemKey)?.name || item.itemKey;
  if (story.kind === 'themes') return item.title;
  return countryName(item.code);
}

/**
 * When it happened, as people read it: a place's first visit ("12 Jun 2014"; one traveller's,
 * "on Lisbon, 8 Mar 2025"), a stamp's day, a One Shot's day, month or year, a theme's month.
 * Empty when it has no date.
 */
export function storyItemWhen(story, item) {
  if (!item) return '';
  if (story.kind === 'themes') return monthLabel(item.month);
  if (story.kind === 'oneShots') return formatMomentDate({ happenedOn: item.on, datePrecision: item.datePrecision || 'DAY' });
  const day = formatDay(item.on);
  if (item.trip) return day ? `On ${item.trip.title}, ${day}` : `On ${item.trip.title}`;
  return day;
}

/** Where it was, when that isn't the item itself: a stamp's or a One Shot's place. */
export function storyItemWhere(story, item) {
  if (!item?.code || story.kind === 'places') return '';
  return countryName(item.code);
}

const ONE_SHOT_UNITS = { oneShotsWildlife: 'animal', oneShotsWonders: 'wonder of nature', oneShotsJourneys: 'great journey' };

/**
 * What the one that earned it was, as a label over its name: "Your tenth country" (Peru), "Your
 * first passport stamp" (the Eiffel Tower). A label, never a sentence round the name, so a name
 * that wants "the" ("United Kingdom") still reads right. For one traveller (`name`), theirs:
 * "Ann’s tenth country". Null when nothing earned it yet (fewer than it needs: storyShortfall).
 */
export function storyLabel(story, { name = null } = {}) {
  const item = story.earnedWith === null ? null : story.items[story.earnedWith];
  if (!item) return null;
  const your = name ? `${name}’s` : 'Your';
  const nth = ordinal(story.need);
  switch (story.measure) {
    case 'countries':
      return `${your} ${nth} country`;
    case 'allCountries':
      return 'The last country on the map';
    case 'continent':
      return `${your} first country in ${CONTINENT_LABELS[story.continent] || story.continent}`;
    case 'inhabitedContinents':
      return `${your} sixth continent: ${CONTINENT_LABELS[item.continent] || item.continent}`;
    case 'place':
      return `${name || 'You'} made it to`;
    case 'region':
      return `The last of ${regionName(story.region)}`;
    case 'landmarks':
      return `${your} ${nth} passport stamp`;
    case 'unesco':
      return `${your} ${nth} World Heritage Site`;
    case 'collection':
      return `Won ${countryName(story.place)}’s ${COLLECTION_TIER_LABELS[story.tier]?.toLowerCase() || story.tier}`;
    case 'bigFive':
      return 'The last of the Big Five';
    case 'themes':
      return `${your} ${nth} monthly theme`;
    default:
      return ONE_SHOT_UNITS[story.measure] ? `${your} ${nth} ${ONE_SHOT_UNITS[story.measure]}` : null;
  }
}

/**
 * A photo badge's sentence: "Your 100th photo went on the map on 3 Mar 2024." (it counts what's
 * on the map, so the one that reached the number is the 100th put there).
 */
export function photoHeadline(story) {
  if (!story.photo) return null;
  const what = story.photo.video ? 'photo or video' : 'photo';
  return `Your ${ordinal(story.need)} ${what} went on the map on ${formatDay(story.photo.addedOn)}.`;
}

/**
 * When a badge, earned, has fewer things to show than it needed (a country taken off the map
 * since, or a hidden photo's stamp a viewer can't see): "It was earned with 10; 9 show on the map
 * now." Null otherwise.
 */
export function storyShortfall(story) {
  if (story.kind === 'photos' ? story.photo : story.earnedWith !== null) return null;
  return `It was earned with ${story.need.toLocaleString('en-GB')}; ${story.have.toLocaleString('en-GB')} ${story.have === 1 ? 'shows' : 'show'} on the map now.`;
}

const LIST_HEADINGS = {
  places: 'In the order you went',
  stamps: 'In the order stamped',
  oneShots: 'In the order seen',
  themes: 'In the order entered',
};

/** The list's heading ("In the order you went"), or null when there's no list to show (one thing). */
export function storyListHeading(story) {
  if (story.items.length < 2) return null;
  if (story.measure === 'oneShotsJourneys') return 'In the order done';
  return LIST_HEADINGS[story.kind] || null;
}
