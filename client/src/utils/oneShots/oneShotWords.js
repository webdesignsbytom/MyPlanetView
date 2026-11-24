// Life's One Shots' words (24 Nov 2026, the user's wish and name): the lists, their groups,
// how far along each list is, and a tick's when and where.
import { ONE_SHOTS, ONE_SHOT_GROUPS, ONE_SHOT_LISTS } from './oneShotItems';
import { formatMomentDate } from '@/utils/moments/momentDates';
import { countryName } from '@/utils/map/countries';
import { countryOf } from '@/utils/map/ukNations';

export const ONE_SHOTS_NAME = 'Life’s One Shots';

export const ONE_SHOT_LIST_LABELS = Object.freeze({ WILDLIFE: 'Wildlife', WONDERS: 'Nature’s wonders', JOURNEYS: 'Journeys and feats' });

// A tick's word ("Seen", "Done"), and the form's "who" legend, by list
export const ONE_SHOT_TICK_WORDS = Object.freeze({ WILDLIFE: 'Seen', WONDERS: 'Seen', JOURNEYS: 'Done' });
export const ONE_SHOT_WHO_LEGENDS = Object.freeze({ WILDLIFE: 'Who saw it', WONDERS: 'Who saw it', JOURNEYS: 'Who did it' });

// "12 of 80 animals"
export const ONE_SHOT_LIST_NOUNS = Object.freeze({ WILDLIFE: ['animal', 'animals'], WONDERS: ['wonder', 'wonders'], JOURNEYS: ['journey or feat', 'journeys and feats'] });

// Each group's heading, by list (the journeys' "water" isn't the wonders')
const GROUP_LABELS = Object.freeze({
  'WILDLIFE:safari': 'On safari',
  'WILDLIFE:asia': 'Asia',
  'WILDLIFE:americas': 'The Americas',
  'WILDLIFE:oceania': 'Australia and New Zealand',
  'WILDLIFE:cold': 'The cold north and south',
  'WILDLIFE:ocean': 'In the ocean',
  'WILDLIFE:birds': 'Birds',
  'WONDERS:sky': 'In the sky',
  'WONDERS:volcanoes': 'Volcanoes',
  'WONDERS:water': 'Water and ice',
  'WONDERS:land': 'Land and life',
  'JOURNEYS:rail': 'By rail',
  'JOURNEYS:foot': 'On foot',
  'JOURNEYS:road': 'On the road',
  'JOURNEYS:water': 'On the water',
  'JOURNEYS:lines': 'Lines on the globe',
  'JOURNEYS:thrills': 'Thrills',
});

export const oneShotGroupLabel = (list, group) => GROUP_LABELS[`${list}:${group}`] || group;

/** A list's items in its groups, in order: `[{ group, label, items }]`. */
export function oneShotGroups(list) {
  return ONE_SHOT_GROUPS[list].map((group) => ({
    group,
    label: oneShotGroupLabel(list, group),
    items: ONE_SHOTS.filter((shot) => shot.list === list && shot.group === group),
  }));
}

/** How far along each list is, from the ticks: `{ WILDLIFE: { have, total }, … }`. */
export function oneShotProgress(ticks = []) {
  const ticked = new Set(ticks.map((tick) => tick.itemKey));
  return Object.fromEntries(
    ONE_SHOT_LISTS.map((list) => {
      const items = ONE_SHOTS.filter((shot) => shot.list === list);
      return [list, { have: items.filter((shot) => ticked.has(shot.key)).length, total: items.length }];
    }),
  );
}

/** "12 of 80 animals" */
export function progressWords(list, { have, total }) {
  const [one, many] = ONE_SHOT_LIST_NOUNS[list];
  return `${have} of ${total} ${total === 1 ? one : many}`;
}

/** A tick's when and where: "March 2024, in Kenya", "In Kenya", "12 Mar 2024", or ''. */
export function seenWords(tick) {
  if (!tick) return '';
  const when = tick.seenOn ? formatMomentDate({ happenedOn: tick.seenOn, datePrecision: tick.datePrecision }) : '';
  const where = tick.countryCode ? countryName(tick.countryCode) : '';
  if (when && where) return `${when}, in ${where}`;
  if (where) return `In ${where}`;
  return when;
}

/**
 * A place's Life's One Shots (its country's: a UK nation's are the UK's, a region's its
 * country's): `seen`, the ticks made there (`[{ item, tick }]`, in the ticks' order), and
 * `toSee`, the items usually seen there that the map hasn't ticked anywhere yet (an item
 * ticked somewhere else is neither: it's been seen). -> `{ seen, toSee }`
 */
export function oneShotsInPlace(code, ticks = []) {
  const country = countryOf(code);
  const ticked = new Set(ticks.map((tick) => tick.itemKey));
  const byKey = new Map(ONE_SHOTS.map((shot) => [shot.key, shot]));
  return {
    seen: ticks
      .filter((tick) => tick.countryCode && countryOf(tick.countryCode) === country && byKey.has(tick.itemKey))
      .map((tick) => ({ item: byKey.get(tick.itemKey), tick })),
    toSee: ONE_SHOTS.filter((shot) => (shot.countries.includes(country) || shot.countries.includes(code)) && !ticked.has(shot.key)),
  };
}
