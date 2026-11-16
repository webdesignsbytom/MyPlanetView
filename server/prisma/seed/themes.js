// Example monthly photo themes (docs/API.md, "Photo themes"): last month's, this month's and
// the next ten, so the theme albums, entering and the admin page have something to show in
// development. They're EXAMPLES: the real year of themes is the user's to write
// (docs/WAITING-ON-YOU.md), on the admin page. With the demo photos seeded, the demo map has
// two photos in this month's theme and one in last month's.
import { prisma } from '../../src/prisma.js';
import { monthStart } from '../../src/utils/themes.js';
import { seedAccounts } from './users.js';

const emailOf = (role) => seedAccounts.find((a) => a.role === role).email;

// The plan's ideas first (docs/FEATURE-PLAN.md, "Monthly photo themes"), then more
export const EXAMPLE_THEMES = Object.freeze([
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
]);

const addMonths = (month, n) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + n, 1));

export async function seedExampleThemes({ now = new Date(), ownerEmail = emailOf('USER') } = {}) {
  const thisMonth = monthStart(now);
  const themes = [];
  for (const [index, theme] of EXAMPLE_THEMES.entries()) {
    themes.push(await prisma.photoTheme.create({ data: { ...theme, month: addMonths(thisMonth, index - 1) } }));
  }
  const [lastMonths, current] = themes;

  // A few of the demo photos entered, as the demo map's editors would
  const owner = await prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true } });
  const map = owner ? await prisma.travelMap.findFirst({ where: { ownerId: owner.id, isDefault: true }, select: { id: true } }) : null;
  const photos = map
    ? await prisma.photo.findMany({ where: { mapId: map.id, kind: 'PHOTO', hidden: false }, select: { id: true }, orderBy: { createdAt: 'asc' }, take: 3 })
    : [];
  const entries = [
    [current, photos[0]],
    [current, photos[1]],
    [lastMonths, photos[2]],
  ].filter(([, photo]) => photo);
  for (const [theme, photo] of entries) {
    await prisma.photoThemeEntry.create({ data: { themeId: theme.id, photoId: photo.id, mapId: map.id, enteredById: owner.id } });
  }
  console.log(`✅ Seeded ${themes.length} example photo themes${entries.length ? `, ${entries.length} demo photos entered` : ''}`);
}
