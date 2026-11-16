// The country pages this build has, from the country-pages Vite plugin
// (scripts/country-pages.mjs): the checked ones in a build, drafts too on the dev server.
import { COUNTRY_PAGES, HAS_COUNTRY_PAGES, loadCountryIndex, loadCountryPage } from 'virtual:country-pages';
// Utils
import { countryRoutesFor } from './countryRoutes.js';

export { COUNTRY_PAGES, HAS_COUNTRY_PAGES, loadCountryIndex, loadCountryPage };

// '/countries' and '/countries/<slug>' for each page, or nothing at all
export const COUNTRY_ROUTES = countryRoutesFor(COUNTRY_PAGES);

// Links to the section (the footer's) wait for a page that's been checked, even in
// development, where drafts can be opened by their address
export const HAS_CHECKED_COUNTRY_PAGES = COUNTRY_PAGES.some((page) => page.status === 'checked');
