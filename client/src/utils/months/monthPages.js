// The month pages this build has, from the month-pages Vite plugin (scripts/month-pages.mjs):
// the checked ones with enough countries in a build, drafts too on the dev server.
import { HAS_MONTH_PAGES, MONTH_PAGES, loadMonthPage } from 'virtual:month-pages';

export { HAS_MONTH_PAGES, MONTH_PAGES, loadMonthPage };

// Links into the section (the country index's) wait for a checked page, even in
// development, where drafts can be opened by their address
export const CHECKED_MONTH_PAGES = MONTH_PAGES.filter((page) => page.status === 'checked');
