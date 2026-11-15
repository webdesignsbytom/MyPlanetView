import { prisma } from '../prisma.js';

// Counts for list views (map and trip summaries).
//
// A `_count` in a Prisma select joins a GROUP BY over the whole child table, so
// every list counted every user's photos, trips and stops. These count only
// the rows of the parents already loaded: `WHERE "<field>" IN (...) GROUP BY`.

/**
 * How many `model` rows each parent in `ids` has, as a Map of id → count (a
 * parent with none is missing). No query when `ids` is empty.
 */
export async function countPerParent(model, field, ids, where = {}) {
  if (!ids.length) return new Map();
  const rows = await prisma[model].groupBy({
    by: [field],
    where: { [field]: { in: ids }, ...where },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row[field], row._count._all]));
}

/**
 * Photos per map or trip (`field` is `mapId` or `tripId`). Hidden photos count
 * only for the parents whose `includeHidden[i]` is true (the caller is an
 * editor or the owner there). At most two queries, run together.
 */
export async function countPhotosPer(field, ids, includeHidden) {
  const [all, visible] = await Promise.all([
    countPerParent('photo', field, ids.filter((_, i) => includeHidden[i])),
    countPerParent('photo', field, ids.filter((_, i) => !includeHidden[i]), { hidden: false }),
  ]);
  return new Map([...visible, ...all]);
}
