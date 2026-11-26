// Mock mode only: monthly photo themes (docs/API.md, "Photo themes"), as the server's
// utils/themes.js and seed/themes.js: months (UTC), which theme runs, a theme as it's sent,
// an admin's input, and the example year of themes. Themes are kept as
// `{ id, month: 'YYYY-MM', title, blurb }`, entries as `{ themeId, photoId, mapId, enteredById, enteredAt }`.
export const THEME_LIMITS = Object.freeze({ title: 60, blurb: 300, entriesPerMap: 20, recent: 12 });

// The server's suggested themes (src/utils/themeIdeas.js; a test compares them): the admin page's
// "Fill the empty months" gives them out, and the seed's example year is the first twelve
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

// The server's example themes (prisma/seed/themes.js): last month's, this month's and ten more
export const EXAMPLE_THEMES = Object.freeze(THEME_IDEAS.slice(0, 12));

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** "2026-11" for the month `date` falls in (UTC). */
export const monthOf = (date = new Date()) => date.toISOString().slice(0, 7);

/** "2026-11" moved `n` months. */
export function addMonths(month, n) {
  const [year, m] = month.split('-').map(Number);
  return monthOf(new Date(Date.UTC(year, m - 1 + n, 1)));
}

const monthStartIso = (month) => `${month}-01T00:00:00.000Z`;

/** A theme as the API sends it (the server's themeView). */
export const themeView = (theme, now = new Date()) => ({
  id: theme.id,
  month: theme.month,
  title: theme.title,
  blurb: theme.blurb ?? null,
  startsAt: monthStartIso(theme.month),
  endsAt: monthStartIso(addMonths(theme.month, 1)),
  running: theme.month === monthOf(now),
});

export const themeId = (month) => `theme-${month}`;

/**
 * The seed's entries: two of the test user's photos in this month's theme, one in last
 * month's, entered by the test user a few days ago.
 */
export function exampleThemeEntries(now = new Date(), { mapId, userId, current, last }) {
  const thisMonth = monthOf(now);
  const daysAgo = (days) => new Date(now.getTime() - days * 86400000).toISOString();
  return [
    ...current.map((photoId, index) => ({ themeId: themeId(thisMonth), photoId, mapId, enteredById: userId, enteredAt: daysAgo(index + 1) })),
    ...last.map((photoId) => ({ themeId: themeId(addMonths(thisMonth, -1)), photoId, mapId, enteredById: userId, enteredAt: daysAgo(20) })),
  ];
}

/**
 * The example themes from last month to ten months on, so a store made any month has a
 * running theme (a store from an earlier month gets the months it's missing).
 */
export function exampleThemes(now = new Date()) {
  const first = addMonths(monthOf(now), -1);
  return EXAMPLE_THEMES.map((theme, index) => {
    const month = addMonths(first, index);
    return { id: themeId(month), month, ...theme, createdAt: now.toISOString(), updatedAt: now.toISOString() };
  });
}

export function ensureThemes(db, now = new Date()) {
  if (!Array.isArray(db.themes)) db.themes = [];
  if (!Array.isArray(db.themeEntries)) db.themeEntries = [];
  const months = new Set(db.themes.map((theme) => theme.month));
  for (const theme of exampleThemes(now)) if (!months.has(theme.month)) db.themes.push(theme);
}

/** An admin's theme, cleaned (the server's parseThemeInput). -> `{ ok, data }` or `{ ok: false, message }` */
export function parseThemeInput(body, { existing = null, now = new Date() } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, message: 'invalid' };
  const data = {};
  if (!existing || body.month !== undefined) {
    const match = typeof body.month === 'string' ? MONTH_PATTERN.exec(body.month) : null;
    if (!match || Number(match[1]) < 2000) return { ok: false, message: 'invalid' };
    if (body.month < monthOf(now)) return { ok: false, message: 'monthPast' };
    data.month = body.month;
  }
  if (!existing || body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
    if (!title || title.length > THEME_LIMITS.title) return { ok: false, message: 'invalid' };
    data.title = title;
  }
  if (!existing || body.blurb !== undefined) {
    if (body.blurb != null && typeof body.blurb !== 'string') return { ok: false, message: 'invalid' };
    const blurb = body.blurb == null ? null : body.blurb.replace(/<[^>]*>/g, '').trim() || null;
    if (blurb && blurb.length > THEME_LIMITS.blurb) return { ok: false, message: 'invalid' };
    data.blurb = blurb;
  }
  return { ok: true, data };
}

/** The themes a photo is in, newest month first (a photo's detail carries them). */
export function photoThemes(db, photoId) {
  const ids = new Set((db.themeEntries || []).filter((entry) => entry.photoId === photoId).map((entry) => entry.themeId));
  return (db.themes || [])
    .filter((theme) => ids.has(theme.id))
    .sort((a, b) => (a.month < b.month ? 1 : -1))
    .map((theme) => themeView(theme));
}

const titleKey = (title) => String(title || '').trim().toLowerCase();

/**
 * The server's suggestThemes (utils/themeIdeas.js), with months as 'YYYY-MM': `[{ month, title,
 * blurb }]` for each month of `now`'s and the 11 after with no theme in `existing`, from the
 * ideas not used in the year before or ahead, then any not set ahead.
 */
export function suggestThemes(existing, now = new Date(), ideas = THEME_IDEAS) {
  const thisMonth = monthOf(now);
  const ahead = Array.from({ length: 12 }, (_, i) => addMonths(thisMonth, i));
  const from = addMonths(thisMonth, -11);
  const until = addMonths(thisMonth, 12);
  const taken = new Set(existing.map((theme) => theme.month));
  const near = existing.filter((theme) => theme.month >= from && theme.month < until);
  const usedNear = new Set(near.map((theme) => titleKey(theme.title)));
  const usedAhead = new Set(near.filter((theme) => theme.month >= thisMonth).map((theme) => titleKey(theme.title)));
  const pool = [...ideas.filter((idea) => !usedNear.has(titleKey(idea.title))), ...ideas.filter((idea) => usedNear.has(titleKey(idea.title)) && !usedAhead.has(titleKey(idea.title)))];
  const out = [];
  for (const month of ahead) {
    if (taken.has(month)) continue;
    const idea = pool.shift();
    if (!idea) break;
    out.push({ month, title: idea.title, blurb: idea.blurb });
  }
  return out;
}
