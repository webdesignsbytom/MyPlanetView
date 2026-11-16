// The "Where to go in <month>" pages, for the build (format: src/utils/months/monthContent.js):
// - readMonthFiles(): every month file, parsed and checked (check-meta);
// - publishedMonthPages() / publishedMonthRoutes() / publishedMonthSitemap(): the pages a
//   production build has (prerender, sitemap, check-seo);
// - monthDraftLeaksIn(dir): a draft month's text in a build's output (check-seo);
// - monthPagesPlugin(): the Vite plugin that serves them to the app as virtual modules.
//
// A page is built when its file is checked AND the checked country guides give it at least
// MONTH_MIN_COUNTRIES countries rated 'best' or 'good' that month. The dev server shows
// drafts too (and draws on draft guides), as the country pages do.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Content
import { COUNTRY_BY_CODE } from '../src/utils/map/countries.js';
import { MONTH_SLUGS, isMonthPublishable, monthContentProblems, monthPicks } from '../src/utils/months/monthContent.js';
import { monthPagePath } from '../src/utils/constants/routes.js';
import { COUNTRY_CONTENT_DIR, countryGuideContent } from './country-pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MONTH_CONTENT_DIR = path.join(root, 'src', 'content', 'months');

// Every month file: { file, content, problems }
export function readMonthFiles() {
  if (!fs.existsSync(MONTH_CONTENT_DIR)) return [];
  return fs
    .readdirSync(MONTH_CONTENT_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const problems = [];
      let content = null;
      try {
        content = JSON.parse(fs.readFileSync(path.join(MONTH_CONTENT_DIR, file), 'utf8'));
      } catch (err) {
        problems.push(`not valid JSON (${err.message})`);
      }
      if (content) {
        problems.push(...monthContentProblems(content));
        if (content.slug && file !== `${content.slug}.json`) problems.push(`the file should be called ${content.slug}.json`);
      }
      return { file, content, problems };
    })
    .sort((a, b) => (a.content?.month ?? 99) - (b.content?.month ?? 99));
}

const guideRows = (guides) =>
  guides.map((guide) => ({ code: guide.code, slug: guide.slug, name: COUNTRY_BY_CODE[guide.code]?.name ?? guide.code, status: guide.status, whenToGo: guide.whenToGo, lastChecked: guide.lastChecked }));

/**
 * The month pages: each month file (checked, unless drafts are wanted) with `picks` from
 * the guides, kept when there are enough countries. A checked file with problems stops the
 * build; a broken draft is only left out.
 */
function monthPages({ includeDrafts, onSkip = () => {} }) {
  const guides = guideRows(countryGuideContent({ includeDrafts, onSkip }));
  const pages = [];
  for (const { file, content, problems } of readMonthFiles()) {
    const checked = content?.status === 'checked';
    if (problems.length) {
      const message = `src/content/months/${file}: ${problems.join('; ')}`;
      if (checked) throw new Error(message);
      onSkip(message);
      continue;
    }
    if (!checked && !includeDrafts) continue;
    const picks = monthPicks(content.month, guides);
    if (!isMonthPublishable(picks)) {
      onSkip(`src/content/months/${file}: too few countries at their best or good in ${content.slug} (the guides give ${picks.best.length + picks.good.length})`);
      continue;
    }
    // When the page last changed: its own check, or a guide it lists
    const listed = new Set([...picks.best, ...picks.good, ...picks.regions].map((pick) => pick.code));
    const dates = [content.lastChecked, ...guides.filter((g) => listed.has(g.code)).map((g) => g.lastChecked)].filter(Boolean);
    pages.push({ ...content, picks, lastChanged: dates.sort().at(-1) ?? null });
  }
  return pages;
}

export const publishedMonthPages = () => monthPages({ includeDrafts: false });
export const publishedMonthRoutes = () => publishedMonthPages().map((page) => monthPagePath(page.slug));
// Sitemap entries: { route, lastmod } (the newest of the month's check and its guides')
export const publishedMonthSitemap = () => publishedMonthPages().map((page) => ({ route: monthPagePath(page.slug), lastmod: page.lastChanged }));

// --- Drafts never ship --------------------------------------------------------------------

// Long runs of a draft month's own words, plain ASCII without quotes or backslashes, so they
// read the same in HTML and in a minified chunk
const draftNeedles = (content) =>
  [content.summary, ...(content.intro || [])]
    .filter((text) => typeof text === 'string')
    .map((text) => text.split(/[^\x20\x21\x23-\x5B\x5D-\x7E]+/).sort((a, b) => b.length - a.length)[0].trim())
    .filter((needle) => needle.length >= 24);

const SHIPPED_TEXT = /\.(html|js|mjs|css|json|xml|txt)$/;
function filesIn(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...filesIn(full));
    else if (SHIPPED_TEXT.test(entry.name)) found.push(full);
  }
  return found;
}

// A draft month's page file, or its text anywhere in what would be uploaded
export function monthDraftLeaksIn(dir) {
  const published = new Set(publishedMonthPages().map((page) => page.slug));
  const drafts = readMonthFiles().filter(({ content }) => content && !published.has(content.slug));
  const leaks = [];
  for (const { file, content } of drafts) {
    if (content.slug && fs.existsSync(path.join(dir, 'where-to-go', `${content.slug}.html`))) {
      leaks.push(`where-to-go/${content.slug}.html was built from ${file}, which isn't published`);
    }
  }
  const needles = drafts.flatMap(({ file, content }) => draftNeedles(content).map((needle) => ({ file, needle })));
  for (const full of filesIn(dir)) {
    const text = fs.readFileSync(full, 'utf8');
    for (const { file, needle } of needles) {
      if (text.includes(needle)) leaks.push(`${path.relative(dir, full).split(path.sep).join('/')} has text from ${file}, which isn't published`);
    }
  }
  return leaks;
}

// --- The Vite plugin ------------------------------------------------------------------

// virtual:month-pages        the list (month, slug, status) and a loader for each page
// virtual:month-page/<slug>  one month's whole page (its file and its picks)
const PAGES_ID = 'virtual:month-pages';
const PAGE_PREFIX = 'virtual:month-page/';
const RESOLVED = '\0';

function pagesModule(pages) {
  const list = pages.map(({ month, slug, status }) => ({ month, slug, status }));
  const loaders = pages.map(({ slug }) => `  ${JSON.stringify(slug)}: () => import(${JSON.stringify(`${PAGE_PREFIX}${slug}`)}),`);
  return [
    `export const MONTH_PAGES = ${JSON.stringify(list)};`,
    `export const HAS_MONTH_PAGES = ${pages.length > 0};`,
    `const LOADERS = {\n${loaders.join('\n')}\n};`,
    'export const loadMonthPage = (slug) => LOADERS[slug]().then((module) => module.default);',
  ].join('\n');
}

export function monthPagesPlugin() {
  let includeDrafts = false;
  let logger = console;
  const pages = () => monthPages({ includeDrafts, onSkip: (message) => logger.warn(`⚠️  Month page left out: ${message}`) });

  return {
    name: 'month-pages',
    configResolved(config) {
      includeDrafts = config.command === 'serve';
      logger = config.logger;
    },
    resolveId(id) {
      if (id === PAGES_ID || id.startsWith(PAGE_PREFIX)) return `${RESOLVED}${id}`;
      return null;
    },
    load(id) {
      if (!id.startsWith(`${RESOLVED}virtual:month-`)) return null;
      const virtualId = id.slice(RESOLVED.length);
      const all = pages();
      if (virtualId === PAGES_ID) return pagesModule(all);
      const slug = virtualId.slice(PAGE_PREFIX.length);
      if (!MONTH_SLUGS.includes(slug)) this.error(`No such month: ${slug}`);
      const page = all.find((p) => p.slug === slug);
      if (!page) this.error(`No month page for ${slug}`);
      return `export default ${JSON.stringify(page)};`;
    },
    // A month or guide file changed: reload, with the virtual modules built afresh
    configureServer(server) {
      const folder = (dir) => (process.platform === 'win32' ? path.resolve(dir).toLowerCase() : path.resolve(dir));
      const watched = new Set([folder(MONTH_CONTENT_DIR), folder(COUNTRY_CONTENT_DIR)]);
      server.watcher.add(MONTH_CONTENT_DIR);
      server.watcher.on('all', (_event, file) => {
        if (!watched.has(folder(path.dirname(file)))) return;
        for (const module of server.moduleGraph.idToModuleMap.values()) {
          if (module.id?.startsWith(`${RESOLVED}virtual:month-`)) server.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
