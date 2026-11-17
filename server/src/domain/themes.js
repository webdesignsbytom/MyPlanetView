// Monthly photo themes (docs/API.md, "Photo themes"): the themes, and the photos each map
// enters in them. Thin Prisma queries; the rules are utils/themes.js.
import { prisma } from '../prisma.js';

const THEME_SELECT = { id: true, month: true, title: true, blurb: true };

// Below editor a map's albums leave out hidden photos (videos are never entered)
const visiblePhoto = (includeHidden) => (includeHidden ? {} : { photo: { hidden: false } });

// Themes

export const findThemeById = (id) => prisma.photoTheme.findUnique({ where: { id }, select: THEME_SELECT });

export const findThemeByMonth = (month) => prisma.photoTheme.findUnique({ where: { month }, select: THEME_SELECT });

/** The themes from `from` up to (not including) `before`, newest month first. */
export const findThemesBetween = ({ from, before, take }) =>
  prisma.photoTheme.findMany({
    where: { month: { gte: from, lt: before } },
    select: THEME_SELECT,
    orderBy: { month: 'desc' },
    take,
  });

/**
 * Every theme for the admin page, newest month first, each with how many photos were
 * entered and on how many maps (a groupBy over the entries, merged in).
 */
export async function listThemesWithCounts() {
  const [themes, entries, maps] = await Promise.all([
    prisma.photoTheme.findMany({ select: { ...THEME_SELECT, createdAt: true, updatedAt: true }, orderBy: { month: 'desc' } }),
    prisma.photoThemeEntry.groupBy({ by: ['themeId'], _count: { _all: true } }),
    prisma.photoThemeEntry.groupBy({ by: ['themeId', 'mapId'] }),
  ]);
  const entryCount = new Map(entries.map((row) => [row.themeId, row._count._all]));
  const mapCount = new Map();
  for (const row of maps) mapCount.set(row.themeId, (mapCount.get(row.themeId) ?? 0) + 1);
  return themes.map((theme) => ({ ...theme, entryCount: entryCount.get(theme.id) ?? 0, mapCount: mapCount.get(theme.id) ?? 0 }));
}

export const createThemeInDB = (data) => prisma.photoTheme.create({ data, select: THEME_SELECT });

export const updateThemeInDB = (id, data) => prisma.photoTheme.update({ where: { id }, data, select: THEME_SELECT });

export const deleteThemeInDB = (id) => prisma.photoTheme.delete({ where: { id } });

export const countThemeEntries = (themeId) => prisma.photoThemeEntry.count({ where: { themeId } });

/** How many maps have a photo in the theme (the admin row's "on N maps"). */
export const countThemeMaps = async (themeId) => (await prisma.photoThemeEntry.groupBy({ by: ['mapId'], where: { themeId } })).length;

// Entries

/**
 * Enter a photo in a theme, unless the map already has `cap` photos in it (counted with
 * the map row locked, so two entries at once can't pass the cap together).
 * -> `{ created: true }`, `{ created: false }` (already in), or `{ full: true }`
 */
export const enterPhotoInTheme = ({ themeId, photoId, mapId, userId, cap }) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM "travel_map" WHERE "id" = ${mapId} FOR NO KEY UPDATE`;
    const existing = await tx.photoThemeEntry.findUnique({ where: { themeId_photoId: { themeId, photoId } }, select: { photoId: true } });
    if (existing) return { created: false };
    const count = await tx.photoThemeEntry.count({ where: { mapId, themeId } });
    if (count >= cap) return { full: true };
    await tx.photoThemeEntry.create({ data: { themeId, photoId, mapId, enteredById: userId } });
    return { created: true };
  });

/** -> true if there was an entry to remove */
export const removePhotoFromTheme = async ({ themeId, photoId }) =>
  (await prisma.photoThemeEntry.deleteMany({ where: { themeId, photoId } })).count > 0;

/** The themes a photo is entered in, newest month first: `[{ id, month, title, blurb }]`. */
export const findPhotoThemes = async (photoId) =>
  (
    await prisma.photoThemeEntry.findMany({
      where: { photoId },
      select: { theme: { select: THEME_SELECT } },
      orderBy: { theme: { month: 'desc' } },
    })
  ).map((entry) => entry.theme);

/**
 * A map's albums: every theme it has photos in, with how many, newest month first.
 * -> `[{ theme, count }]`
 */
export async function findMapThemeAlbums(mapId, { includeHidden }) {
  const rows = await prisma.photoThemeEntry.groupBy({
    by: ['themeId'],
    where: { mapId, ...visiblePhoto(includeHidden) },
    _count: { _all: true },
  });
  if (!rows.length) return [];
  const themes = await prisma.photoTheme.findMany({
    where: { id: { in: rows.map((row) => row.themeId) } },
    select: THEME_SELECT,
    orderBy: { month: 'desc' },
  });
  const count = new Map(rows.map((row) => [row.themeId, row._count._all]));
  return themes.map((theme) => ({ theme, count: count.get(theme.id) }));
}

/**
 * One page of a map's album for a theme, newest entry first: the photo ids (the caller
 * loads them as list items). `cursor` is the last photo id of the previous page.
 * -> `{ photoIds, nextCursor }`, or null when the cursor isn't in the album
 */
export async function findThemeAlbumPage({ mapId, themeId, includeHidden, cursor, limit }) {
  if (cursor) {
    const at = await prisma.photoThemeEntry.findFirst({ where: { mapId, themeId, photoId: cursor }, select: { photoId: true } });
    if (!at) return null;
  }
  const rows = await prisma.photoThemeEntry.findMany({
    where: { mapId, themeId, ...visiblePhoto(includeHidden) },
    select: { photoId: true },
    orderBy: [{ enteredAt: 'desc' }, { photoId: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { themeId_photoId: { themeId, photoId: cursor } }, skip: 1 } : {}),
  });
  const page = rows.slice(0, limit);
  return { photoIds: page.map((row) => row.photoId), nextCursor: rows.length > limit ? page[page.length - 1].photoId : null };
}

/** How many themes a map has entered (the theme badges): distinct themes with a photo in. */
export async function countMapThemesEntered(mapId, { includeHidden }) {
  const rows = await prisma.photoThemeEntry.groupBy({ by: ['themeId'], where: { mapId, ...visiblePhoto(includeHidden) } });
  return rows.length;
}
