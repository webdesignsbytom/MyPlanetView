// The country pages' content files (src/content/countries/<code>.json), for the build:
// - readCountryFiles(): every file, parsed and checked (check-meta, check-seo);
// - publishedCountryContent() / publishedCountryRoutes(): the checked pages only, which is
//   all a production build has (prerender, sitemap);
// - countryPagesPlugin(): the Vite plugin that serves them to the app as virtual modules.
//
// Drafts are viewable on the dev server (npm run dev, dev:mock) and never built: in a
// build, the virtual modules hold only checked pages, so a draft's route, its text and its
// chunk never reach dist/. With nothing checked, there's no /countries and no country page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Content
import { COUNTRY_BY_CODE, CONTINENT_LABELS } from '../src/utils/map/countries.js';
import { isCheckedContent } from '../src/utils/countries/countryContent.js';
import { countryContentProblems } from '../src/utils/countries/countryContentChecks.js';
import { countryRoutesFor } from '../src/utils/countries/countryRoutes.js';
import { COUNTRY_LANDMARKS, LANDMARK_PHOTOS, LICENCES } from '../src/content/countries/landmarks.generated.js';
import { FESTIVAL_PHOTOS, LICENCES as FESTIVAL_LICENCES } from '../src/content/countries/festivalPhotos.generated.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const COUNTRY_CONTENT_DIR = path.join(root, 'src', 'content', 'countries');

const byName = (a, b) => (COUNTRY_BY_CODE[a.code]?.name || a.code).localeCompare(COUNTRY_BY_CODE[b.code]?.name || b.code);

// Every content file: { file, content, problems } (problems empty when it's fine)
export function readCountryFiles() {
  if (!fs.existsSync(COUNTRY_CONTENT_DIR)) return [];
  return fs
    .readdirSync(COUNTRY_CONTENT_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const problems = [];
      let content = null;
      try {
        content = JSON.parse(fs.readFileSync(path.join(COUNTRY_CONTENT_DIR, file), 'utf8'));
      } catch (err) {
        problems.push(`not valid JSON (${err.message})`);
      }
      if (content) {
        problems.push(...countryContentProblems(content));
        const expected = `${String(content.code || '').toLowerCase()}.json`;
        if (file !== expected) problems.push(`the file should be called ${expected}`);
      }
      return { file, content, problems };
    });
}

// Pages that can be shown: valid, and checked unless drafts are wanted (the dev server).
// A checked page with problems stops the build; a broken draft is only left out.
function usableContent({ includeDrafts, onSkip = () => {} }) {
  const usable = [];
  const slugs = new Map();
  for (const { file, content, problems } of readCountryFiles()) {
    const checked = isCheckedContent(content);
    if (problems.length) {
      const message = `src/content/countries/${file}: ${problems.join('; ')}`;
      if (checked) throw new Error(message);
      onSkip(message);
      continue;
    }
    if (!checked && !includeDrafts) continue;
    if (slugs.has(content.slug)) throw new Error(`src/content/countries/${file}: slug "${content.slug}" is also in ${slugs.get(content.slug)}`);
    slugs.set(content.slug, file);
    usable.push(content);
  }
  return usable.sort(byName);
}

export const publishedCountryContent = () => usableContent({ includeDrafts: false });
// The guides a month page draws on (scripts/month-pages.mjs): the checked ones, drafts too on
// the dev server
export const countryGuideContent = ({ includeDrafts = false, onSkip } = {}) => usableContent({ includeDrafts, onSkip });
export const publishedCountryRoutes = () => countryRoutesFor(publishedCountryContent());

// Sitemap entries: { route, lastmod } for each checked guide (its lastChecked date: when it
// was last checked, and so last changed) and the index (the newest of those), or none
export function publishedCountrySitemap(pages = publishedCountryContent()) {
  const [index, ...guides] = countryRoutesFor(pages);
  if (!index) return [];
  const lastmods = pages.map((page) => page.lastChecked);
  return [
    { route: index, lastmod: lastmods.slice().sort().at(-1) },
    ...guides.map((route, i) => ({ route, lastmod: lastmods[i] })),
  ];
}

// --- Drafts never ship --------------------------------------------------------------------

// A few long runs of a draft's own text, in plain ASCII without quotes or backslashes, so
// they read the same in HTML and in a minified chunk (which may escape é, ñ or ")
const draftNeedles = (content) =>
  [content.summary, ...(content.overview || []), content.whenToGo?.weather]
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

// Problems in a build's output (dist/, or a verify build's folder): a draft's page file,
// or a draft's text anywhere in what would be uploaded
export function draftLeaksIn(dir) {
  const drafts = readCountryFiles().filter(({ content }) => content && !isCheckedContent(content));
  const leaks = [];
  for (const { file, content } of drafts) {
    if (content.slug && fs.existsSync(path.join(dir, 'countries', `${content.slug}.html`))) {
      leaks.push(`countries/${content.slug}.html was built from the draft ${file}`);
    }
  }
  const needles = drafts.flatMap(({ file, content }) => draftNeedles(content).map((needle) => ({ file, needle })));
  for (const full of filesIn(dir)) {
    const text = fs.readFileSync(full, 'utf8');
    for (const { file, needle } of needles) {
      if (text.includes(needle)) leaks.push(`${path.relative(dir, full).split(path.sep).join('/')} has text from the draft ${file}`);
    }
  }
  return leaks;
}

// --- The Vite plugin ------------------------------------------------------------------

// virtual:country-pages    the list every page needs (routes, the footer link): code,
//                          slug and status, plus loaders for the two below
// virtual:country-page/xx  one country's whole page (content, name, landmarks)
// virtual:country-index    the rows of the /countries index
const PAGES_ID = 'virtual:country-pages';
const INDEX_ID = 'virtual:country-index';
const PAGE_PREFIX = 'virtual:country-page/';
const RESOLVED = '\0';

// A photo's credit entry ([width, height, author, licence's place, Commons file]) as the page
// data's `photo` (utils/countries/guidePhotos.js reads it)
const photoOf = (entry, licences) => {
  if (!entry) return null;
  const [width, height, author, licenceAt, file] = entry;
  const [licence, licenceUrl] = licences[licenceAt] || ['', ''];
  return { width, height, author, licence, licenceUrl, file };
};

// A festival's key, as images/src/tools/festival-photos.mjs makes it: "<code>-<name slug>"
const festivalKey = (code, name) =>
  `${code.toLowerCase()}-${String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;

const pageData = (content) => {
  const country = COUNTRY_BY_CODE[content.code];
  // Each landmark and festival with its photo (images/src/tools/landmark-photos.mjs and
  // festival-photos.mjs), so the pre-rendered page has them
  const landmarks = (COUNTRY_LANDMARKS[content.code] ?? []).map((landmark) => {
    const photo = photoOf(LANDMARK_PHOTOS[landmark.slug], LICENCES);
    return photo ? { ...landmark, photo } : landmark;
  });
  const festivals = (content.whenToGo.festivals || []).map((festival) => {
    const key = festivalKey(content.code, festival.name);
    const photo = photoOf(FESTIVAL_PHOTOS[key], FESTIVAL_LICENCES);
    return { ...festival, key, ...(photo ? { photo } : {}) };
  });
  return { ...content, whenToGo: { ...content.whenToGo, festivals }, name: country.name, landmarks };
};

const indexRow = (content) => {
  const country = COUNTRY_BY_CODE[content.code];
  return {
    code: content.code,
    slug: content.slug,
    status: content.status,
    lastChecked: content.lastChecked,
    name: country.name,
    continent: CONTINENT_LABELS[country.continent] ?? 'Elsewhere',
    summary: content.summary,
    months: content.whenToGo.months,
  };
};

function pagesModule(pages) {
  const list = pages.map(({ code, slug, status }) => ({ code, slug, status }));
  const loaders = pages.map(({ code, slug }) => `  ${JSON.stringify(slug)}: () => import(${JSON.stringify(`${PAGE_PREFIX}${code.toLowerCase()}`)}),`);
  return [
    `export const COUNTRY_PAGES = ${JSON.stringify(list)};`,
    `export const HAS_COUNTRY_PAGES = ${pages.length > 0};`,
    `const LOADERS = {\n${loaders.join('\n')}\n};`,
    'export const loadCountryPage = (slug) => LOADERS[slug]().then((module) => module.default);',
    pages.length
      ? `export const loadCountryIndex = () => import(${JSON.stringify(INDEX_ID)}).then((module) => module.default);`
      : 'export const loadCountryIndex = () => Promise.resolve([]);',
  ].join('\n');
}

export function countryPagesPlugin() {
  let includeDrafts = false;
  let logger = console;

  const pages = () => usableContent({ includeDrafts, onSkip: (message) => logger.warn(`⚠️  Country page left out: ${message}`) });

  return {
    name: 'country-pages',
    configResolved(config) {
      // The dev server shows drafts (with a banner); a build never has them
      includeDrafts = config.command === 'serve';
      logger = config.logger;
    },
    resolveId(id) {
      if (id === PAGES_ID || id === INDEX_ID || id.startsWith(PAGE_PREFIX)) return `${RESOLVED}${id}`;
      return null;
    },
    load(id) {
      if (!id.startsWith(`${RESOLVED}virtual:country-`)) return null;
      const virtualId = id.slice(RESOLVED.length);
      const all = pages();
      if (virtualId === PAGES_ID) return pagesModule(all);
      if (virtualId === INDEX_ID) return `export default ${JSON.stringify(all.map(indexRow))};`;
      const code = virtualId.slice(PAGE_PREFIX.length).toUpperCase();
      const content = all.find((page) => page.code === code);
      if (!content) this.error(`No country page for ${code}`);
      return `export default ${JSON.stringify(pageData(content))};`;
    },
    // A content file changed: reload, with the virtual modules built afresh
    configureServer(server) {
      // Windows paths may differ only in the drive letter's case (c: or C:)
      const folder = (dir) => (process.platform === 'win32' ? path.resolve(dir).toLowerCase() : path.resolve(dir));
      const contentDir = folder(COUNTRY_CONTENT_DIR);
      server.watcher.add(COUNTRY_CONTENT_DIR);
      server.watcher.on('all', (_event, file) => {
        if (folder(path.dirname(file)) !== contentDir) return;
        for (const module of server.moduleGraph.idToModuleMap.values()) {
          if (module.id?.startsWith(`${RESOLVED}virtual:country-`)) server.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
