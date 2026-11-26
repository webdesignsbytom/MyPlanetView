// Example monthly photo themes (docs/API.md, "Photo themes"): last month's, this month's and
// the next ten, so the theme albums, entering and the admin page have something to show in
// development. They're EXAMPLES: production's are written on the admin page, or filled from
// the same suggestions with its "Fill the empty months" (src/utils/themeIdeas.js). With the demo photos seeded, the demo map has
// two photos in this month's theme and one in last month's.
import { prisma } from '../../src/prisma.js';
import { monthStart } from '../../src/utils/themes.js';
import { THEME_IDEAS } from '../../src/utils/themeIdeas.js';
import { seedAccounts } from './users.js';

const emailOf = (role) => seedAccounts.find((a) => a.role === role).email;

// The first twelve of the suggested themes (src/utils/themeIdeas.js), which the admin page's
// "Fill the empty months" gives a real year too
export const EXAMPLE_THEMES = Object.freeze(THEME_IDEAS.slice(0, 12));

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
