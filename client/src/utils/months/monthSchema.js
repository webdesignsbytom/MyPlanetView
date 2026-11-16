// Structured data for a "Where to go in <month>" page: only what the page shows (playbook
// M4). A CollectionPage listing the guides it links, in the order shown (at their best,
// then good), reviewed on the month's "Last checked" date.
import { collectionPageSchema } from '@/utils/seo/schema';
import { countryPagePath } from '@/utils/constants/routes';

export const monthPageSchema = (page, meta) => ({
  ...collectionPageSchema({
    path: meta.path,
    name: meta.title,
    description: meta.desc,
    items: [...page.picks.best, ...page.picks.good].map((pick) => ({ name: pick.name, path: countryPagePath(pick.slug) })),
  }),
  ...(page.lastChecked ? { lastReviewed: page.lastChecked } : {}),
});
