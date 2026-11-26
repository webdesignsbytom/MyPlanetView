// Suggested monthly photo themes (docs/API.md "Photo themes"; 26 Nov 2026, the user's wish:
// production had none until an admin wrote a year of them). The admin page's "Fill the empty
// months" (POST /users/admin/themes/suggested) gives each month of the coming year that has no
// theme one of these, one not used in the year before or the year ahead, in this order; the
// admin can change or delete any before its month starts. Any season, either hemisphere. The
// dev seed's example year is the first twelve (prisma/seed/themes.js). Pure, so tested on its
// own (tests/themeIdeas.test.js); the mock's copy is client/src/dev/mock/themeIdeas.js.
import { monthKey, monthStart } from './themes.js';

export const THEME_IDEAS = Object.freeze([
  { title: 'Doors', blurb: 'Front doors, gates, hatches and arches: the ones you stopped to photograph.' },
  { title: 'Worst weather', blurb: 'Rain on the lens, fog on the view, the beach day that never was.' },
  { title: 'Street food', blurb: 'Whatever you ate standing up, from a stall, a van or a window.' },
  { title: 'Lost', blurb: 'The wrong turn, the closed road, the map held upside down.' },
  { title: 'The view from the window', blurb: 'Hotels, trains, planes and borrowed sofas: what you woke up to.' },
  { title: 'The bad selfie', blurb: 'Half a face and a famous landmark. The worse, the better.' },
  { title: 'Signs', blurb: 'Signs you couldn’t read, signs you wish you hadn’t, signs that made you laugh.' },
  { title: 'Breakfast', blurb: 'The first meal of the day, wherever the day started.' },
  { title: 'Getting there', blurb: 'Buses, ferries, tuk-tuks, platforms and departure boards.' },
  { title: 'Water', blurb: 'Seas, lakes, fountains, puddles and the rain itself.' },
  { title: 'Animals', blurb: 'Cats on walls, cows on roads, gulls after your chips.' },
  { title: 'Night', blurb: 'After dark: lit streets, night markets and the stars from somewhere new.' },
  { title: 'Markets', blurb: 'Stalls, crates, scales and haggling: the markets you wandered through.' },
  { title: 'Up high', blurb: 'Rooftops, towers, mountain tops and the view from the top of the stairs.' },
  { title: 'One colour', blurb: 'A blue door, a red tram, a yellow wall: one colour everywhere you looked.' },
  { title: 'Bridges', blurb: 'Rope, stone and steel, and the ones you weren’t sure about crossing.' },
  { title: 'Souvenirs', blurb: 'What came home with you, from the fridge magnet to the rug in the hall.' },
  { title: 'Coffee and tea', blurb: 'Cups, pots and the café you went back to every morning.' },
  { title: 'First and last light', blurb: 'The early start or the end of the day: the sky doing its best.' },
  { title: 'Reflections', blurb: 'Puddles, lakes, shop windows and somebody’s sunglasses.' },
  { title: 'Up close', blurb: 'A shell, a tile, a stamp, a leaf: the small things on the way.' },
  { title: 'Steps', blurb: 'Up to temples, down to beaches, and round and round inside towers.' },
  { title: 'A seat at last', blurb: 'Benches, hammocks and station waiting rooms: where you finally sat down.' },
  { title: 'Old and new', blurb: 'A glass tower beside a church, a tram past a castle: two ages in one picture.' },
]);

const addMonths = (month, n) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + n, 1));
const titleKey = (title) => String(title || '').trim().toLowerCase();

/**
 * The themes to add at `now`: `[{ month (a month start), title, blurb }]`, one for each month of
 * this one and the 11 after that has no theme in `existing` (`[{ month, title }]`), each an idea
 * whose title isn't among the themes from 11 months back to those ahead; once those run out,
 * any not already set for a month ahead. Fewer than the empty months when even those run out.
 */
export function suggestThemes(existing, now = new Date(), ideas = THEME_IDEAS) {
  const thisMonth = monthStart(now);
  const ahead = Array.from({ length: 12 }, (_, i) => addMonths(thisMonth, i));
  const from = addMonths(thisMonth, -11).getTime();
  const until = addMonths(thisMonth, 12).getTime();
  const taken = new Set(existing.map((theme) => monthKey(new Date(theme.month))));
  const near = existing.filter((theme) => {
    const at = new Date(theme.month).getTime();
    return at >= from && at < until;
  });
  const usedNear = new Set(near.map((theme) => titleKey(theme.title)));
  const usedAhead = new Set(near.filter((theme) => new Date(theme.month).getTime() >= thisMonth.getTime()).map((theme) => titleKey(theme.title)));
  const pool = [...ideas.filter((idea) => !usedNear.has(titleKey(idea.title))), ...ideas.filter((idea) => usedNear.has(titleKey(idea.title)) && !usedAhead.has(titleKey(idea.title)))];

  const out = [];
  for (const month of ahead) {
    if (taken.has(monthKey(month))) continue;
    const idea = pool.shift();
    if (!idea) break;
    out.push({ month, title: idea.title, blurb: idea.blurb });
  }
  return out;
}
