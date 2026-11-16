// The addresses a set of country pages makes: the index and one per country, or none at
// all (no index without a page to list). Pure and tiny: App.jsx's eager bundle and the
// build scripts both use it.
import { COUNTRIES_PAGE_URL, countryPagePath } from '../constants/routes.js';

// The section, named one way everywhere: the index's h1, the breadcrumb, the footer link
export const COUNTRIES_SECTION = { name: 'Countries', href: COUNTRIES_PAGE_URL };

export const countryRoutesFor = (pages) =>
  pages.length ? [COUNTRIES_PAGE_URL, ...pages.map((page) => countryPagePath(page.slug))] : [];
