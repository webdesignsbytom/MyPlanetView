// Distances people know (24 Nov 2026, the user's wish: "if they have gone 40000km we can say
// thats once round the world. if they have been 380000 km we can say thats the distance to
// the moon"): the statistics and the flight log say what a distance is like, by the nearest of
// these. Rounded figures, as the crow flies unless said; the reach of each is the next's
// start, so a distance between two is "further than" the smaller. Pure.
import { aboutDistance } from './travelStatWords';

// `far` follows "as far as"; `once` and `times(n)` are the ones that read better as multiples
export const DISTANCE_COMPARISONS = [
  // The Kármán line, where space begins
  { id: 'edge-of-space', km: 100, far: 'the edge of space, straight up' },
  // Its orbit, about 400 km up
  { id: 'space-station', km: 400, far: 'the International Space Station, straight up' },
  // The French Way, from Saint-Jean-Pied-de-Port
  { id: 'camino', km: 780, far: 'the Camino de Santiago, from the Pyrenees to Santiago' },
  // By road it's 1,407 km
  { id: 'lands-end', km: 970, far: 'Land’s End to John o’ Groats' },
  { id: 'london-rome', km: 1434, far: 'London to Rome' },
  { id: 'london-moscow', km: 2500, far: 'London to Moscow' },
  { id: 'danube', km: 2850, far: 'the Danube, from the Black Forest to the Black Sea' },
  // The Moon's diameter
  { id: 'across-the-moon', km: 3475, far: 'the Moon, from one side to the other' },
  { id: 'new-york-los-angeles', km: 3944, far: 'New York to Los Angeles' },
  { id: 'london-new-york', km: 5570, far: 'London to New York' },
  { id: 'nile', km: 6650, far: 'the Nile, from its source to the sea' },
  { id: 'trans-siberian', km: 9289, far: 'the Trans-Siberian Railway, Moscow to Vladivostok' },
  // The Earth's mean diameter
  { id: 'through-the-earth', km: 12742, far: 'a tunnel straight through the Earth' },
  { id: 'london-sydney', km: 16990, far: 'London to Sydney' },
  // Every branch, as China's survey of 2012 measured it
  { id: 'great-wall', km: 21196, far: 'every branch of the Great Wall of China' },
  { id: 'pan-american', km: 30000, far: 'the Pan-American Highway, from Alaska to Argentina' },
  // At the equator
  { id: 'round-the-world', km: 40075, once: 'once round the world', times: (n) => `${n} round the world` },
  { id: 'light-second', km: 299792, far: 'light travels in a second' },
  // On average
  { id: 'moon', km: 384400, far: 'the Moon' },
  { id: 'moon-and-back', km: 768800, far: 'the Moon and back', times: (n) => `as far as the Moon and back ${n}` },
];

// A distance up to 12% short of a thing counts as "nearly" it; within 5% either side, "about"
const REACH = 1.12;
const NEARLY_BELOW = 0.95;
const ABOUT_UP_TO = 1.05;
// Past a quarter more, the things that read as multiples say how many
const MULTIPLES_FROM = 1.25;

// Halves under 3, whole numbers under 20, then fives
const niceMultiple = (r) => (r < 3 ? Math.round(r * 2) / 2 : r < 20 ? Math.round(r) : Math.round(r / 5) * 5);
const SPOKEN = { 1.5: 'one and a half times', 2: 'twice', 2.5: 'two and a half times' };
const timesWords = (n) => SPOKEN[n] ?? `${n.toLocaleString('en-GB')} times`;

/**
 * What a distance is like: `{ id, words }` ("nearly once round the world", "about as far as the
 * Moon", "further than London to Sydney", "about 3 times round the world"), or null for none
 * (nothing, or less than the smallest).
 */
export function distanceComparison(km) {
  if (!(km > 0)) return null;
  const item = [...DISTANCE_COMPARISONS].reverse().find((c) => c.km <= km * REACH);
  if (!item) return null;
  const r = km / item.km;
  const as = (q) => (item.once ? `${q} ${item.once}` : `${q} as far as ${item.far}`);
  let words;
  if (r < NEARLY_BELOW) words = as('nearly');
  else if (r <= ABOUT_UP_TO) words = as('about');
  else if (!item.times) words = `further than ${item.far}`;
  else if (r < MULTIPLES_FROM) words = item.once ? `more than ${item.once}` : `further than ${item.far}`;
  else words = `about ${item.times(timesWords(niceMultiple(r)))}`;
  return { id: item.id, words };
}

/** "27,300 km is nearly as far as the Pan-American Highway, from Alaska to Argentina.", or null. */
export function distanceSentence(km, unit = 'km') {
  const like = distanceComparison(km);
  if (!like) return null;
  const distance = aboutDistance(km, unit);
  return `${distance.value} ${distance.unit} is ${like.words}.`;
}

/** The words alone, starting with a capital: "About twice round the world", or null. */
export function distanceLike(km) {
  const like = distanceComparison(km);
  return like ? like.words.charAt(0).toUpperCase() + like.words.slice(1) : null;
}
