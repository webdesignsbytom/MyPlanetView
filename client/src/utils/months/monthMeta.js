// Titles and descriptions for the "Where to go in <month>" pages, generated from their
// content and the countries they list. Pure, and used by scripts/check-meta.mjs too, so
// the build checks exactly what the pages print.
import { CompanyName } from '../constants/constants.js';
import { monthPagePath } from '../constants/routes.js';
import { MAX_DESCRIPTION, listDescription, metaTitle } from '../seo/metaText.js';
import { MONTH_LABELS } from './monthContent.js';

/**
 * `{ pageName, title, desc, path }` for a month (`content`: its file; `bestNames`: the
 * countries at their best, A–Z; `goodNames`: those also good). The description opens with
 * the month's summary and names the countries at their best, then the good ones, as many
 * whole names as fit; too short, it says how many guides it draws on.
 */
export function monthPageMeta(content, { bestNames = [], goodNames = [] } = {}) {
  const label = MONTH_LABELS[content.month - 1];
  const summary = String(content.summary || '').trim();
  const names = [...bestNames, ...goodNames];
  let desc = listDescription(summary, names, { prefix: `At their best or good in ${label}:` });
  if (desc.length < 120) {
    const more = `${desc} Each links to its guide, with the weather, festivals and customs.`;
    if (more.length <= MAX_DESCRIPTION) desc = more;
  }
  return {
    pageName: `Where to go in ${label}`,
    title: metaTitle(`Where to Go in ${label}: Countries at Their Best`, CompanyName),
    desc,
    path: monthPagePath(content.slug),
  };
}
