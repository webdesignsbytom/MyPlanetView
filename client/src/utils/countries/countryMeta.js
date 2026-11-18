// Titles and descriptions for the country pages, generated from their content. Pure, and
// used by scripts/check-meta.mjs too, so the build checks exactly what the pages print.
// The country's name is passed in (the page has it; the scripts look it up), so the
// pages' code doesn't carry the whole country list.
import { CompanyName } from '../constants/constants.js';
import { COUNTRIES_PAGE_URL, countryPagePath } from '../constants/routes.js';
import { MAX_DESCRIPTION, MAX_TITLE, MIN_DESCRIPTION, listDescription, metaTitle } from '../seo/metaText.js';
import { bestMonthsText } from './countryContent.js';
import { COUNTRIES_SECTION } from './countryRoutes.js';

// A country's name inside a sentence: "the United States", "the Netherlands", "the
// Caribbean Netherlands", "the Republic of the Congo"
const WITH_THE = /^(United |Philippines$|Bahamas$|Gambia$|Maldives$|Comoros$|Seychelles$|Vatican City$)|(Islands|Republic|Emirates|Netherlands|of the Congo)$/;
export const nameInSentence = (name) => (WITH_THE.test(name) ? `the ${name}` : name);

// The page's title, shortened for a long name so it's never cut mid-phrase ("Saint Vincent
// and the Grenadines: Best Time to Visit")
const TITLE_ENDINGS = [': Best Time to Visit and Local Customs', ': Best Time to Visit and Customs', ': Best Time to Visit'];
const titleFor = (name) => TITLE_ENDINGS.map((ending) => `${name}${ending}`).find((title) => title.length <= MAX_TITLE) ?? name;

// The first candidate within the description limits, else the first short enough (so
// check-meta names the problem rather than printing a cut sentence)
const pickDescription = (candidates) =>
  candidates.find((text) => text.length >= MIN_DESCRIPTION && text.length <= MAX_DESCRIPTION) ||
  candidates.find((text) => text.length <= MAX_DESCRIPTION) ||
  candidates[0];

// { pageName, title, desc, path } for one country's content (`name`: the country's name,
// from utils/map/countries.js). The description opens with the country and its best
// months (the page's own fact, in the first 100 characters), then the page's summary,
// which keeps each one different; a short pair gets a last sentence. Too long? Shorten
// the summary: check-meta fails rather than cut it.
export function countryPageMeta(content, name) {
  const named = nameInSentence(name);
  const summary = String(content.summary || '').trim();
  const best = bestMonthsText(content.whenToGo?.months || []);
  const lead = best ? `The best months to visit ${named} are ${best}.` : `When to go to ${named}, its festivals and local customs.`;

  return {
    pageName: name,
    title: metaTitle(titleFor(name), CompanyName),
    desc: pickDescription([`${lead} ${summary}`, `${lead} ${summary} Festivals, customs and tipping are covered too.`]),
    path: countryPagePath(content.slug),
  };
}

// { pageName, title, desc, path } for the index, from the guides it lists (by name)
export function countriesIndexMeta(names) {
  // Short enough that one name brings it over the minimum, and a few more still fit
  const lead = 'Travel guides by country: the best months to visit, the weather, festivals, local customs and tipping.';
  return {
    pageName: COUNTRIES_SECTION.name,
    title: metaTitle('Country Guides: When to Go and Local Customs', CompanyName),
    desc: listDescription(lead, names, { prefix: 'Guides include' }),
    path: COUNTRIES_PAGE_URL,
  };
}
