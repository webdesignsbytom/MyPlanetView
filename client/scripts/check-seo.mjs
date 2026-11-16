// SEO checks on dist/ after the build, or on a deployed site: npm run check:seo -- --live https://example.com
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
// Constants
import { FULL_BUSINESS_URL } from '../src/utils/constants/constants.js';
import { CLIENT_ONLY_ROUTE_PREFIXES, COUNTRIES_PAGE_URL, WHERE_TO_GO_URL } from '../src/utils/constants/routes.js';
import { MAX_TITLE } from '../src/utils/seo/metaText.js';
// Country guides: only the checked ones are pages
import { draftLeaksIn, publishedCountryRoutes } from './country-pages.mjs';
import { monthDraftLeaksIn, publishedMonthRoutes } from './month-pages.mjs';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const liveFlag = process.argv.indexOf('--live');
const liveOrigin = liveFlag >= 0 ? process.argv[liveFlag + 1]?.replace(/\/+$/, '') : null;

const errors = [];
const warnings = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);
const warn = (where, message) => warnings.push(`${where}: ${message}`);

// Crawlers that must get a 200 (search, AI search, link previews)
const BOTS = {
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  GPTBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
  'OAI-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  PerplexityBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  facebookexternalhit: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
};

// HTML helpers (our own generated markup, so patterns are enough)
const matchAll = (html, pattern) => [...html.matchAll(pattern)];
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];
const decode = (text) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
const textOf = (html) =>
  decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

// https://x.com and https://x.com/ are the same URL
const sameUrl = (a, b) => {
  try {
    return new URL(a).href === new URL(b).href;
  } catch {
    return false;
  }
};

const isClientOnly = (pathname) =>
  CLIENT_ONLY_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

// JSON-LD logo/image URLs (strings, arrays or ImageObjects)
const IMAGE_KEYS = new Set(['logo', 'image']);
const structuredImages = (value, found = []) => {
  if (Array.isArray(value)) value.forEach((item) => structuredImages(item, found));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (IMAGE_KEYS.has(key)) {
        [child].flat().forEach((item) => {
          const url = typeof item === 'string' ? item : item?.url;
          if (url) found.push(url);
        });
      }
      structuredImages(child, found);
    }
  }
  return found;
};

// Every @id declared with a @type anywhere in the page's JSON-LD: id -> set of types
const declaredIds = (value, found = new Map()) => {
  if (Array.isArray(value)) value.forEach((item) => declaredIds(item, found));
  else if (value && typeof value === 'object') {
    if (value['@id'] && value['@type']) {
      if (!found.has(value['@id'])) found.set(value['@id'], new Set());
      found.get(value['@id']).add([value['@type']].flat().join('/'));
    }
    Object.values(value).forEach((child) => declaredIds(child, found));
  }
  return found;
};

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}T/.test(String(value)) && !Number.isNaN(Date.parse(value));
const ARTICLE_TYPES = ['Article', 'BlogPosting', 'NewsArticle'];

// Each item once, with the first page it appeared on
const firstPageFor = (pages, field) => {
  const seen = new Map();
  for (const [route, page] of pages) for (const item of page[field]) if (!seen.has(item)) seen.set(item, route);
  return seen;
};

// One indexable page: its own head, one h1, real content, honest structured data
function checkPage(where, html, expectedUrl, origin) {
  const headEnd = html.search(/<\/head>/i);
  const head = html.slice(0, headEnd);
  const body = html.slice(headEnd);
  const metas = matchAll(head, /<meta\s[^>]*>/gi).map((m) => m[0]);
  const named = (name) => metas.filter((tag) => attr(tag, 'name') === name);
  const property = (name) => metas.filter((tag) => attr(tag, 'property') === name);

  const titles = matchAll(head, /<title[^>]*>([\s\S]*?)<\/title>/gi).map((m) => decode(m[1]).trim());
  if (titles.length !== 1 || !titles[0]) fail(where, `expected one <title>, found ${titles.length}`);
  else if (titles[0].length > MAX_TITLE) warn(where, `title is ${titles[0].length} characters, so results cut it (limit ${MAX_TITLE})`);

  const descriptions = named('description').map((tag) => decode(attr(tag, 'content') || ''));
  if (descriptions.length !== 1 || !descriptions[0]) fail(where, `expected one meta description, found ${descriptions.length}`);

  const robots = named('robots').map((tag) => attr(tag, 'content') || '');
  if (robots.length > 1) fail(where, `${robots.length} robots tags`);
  if (robots.some((value) => /noindex/i.test(value))) fail(where, `in the sitemap but robots is "${robots.join(', ')}"`);

  const canonicals = matchAll(head, /<link\s[^>]*rel="canonical"[^>]*>/gi).map((m) => attr(m[0], 'href'));
  if (canonicals.length !== 1) fail(where, `expected one canonical, found ${canonicals.length}`);
  else if (sameUrl(canonicals[0], expectedUrl) === false) fail(where, `canonical is ${canonicals[0]}, expected ${expectedUrl}`);

  if (property('og:image').length !== 1) fail(where, `expected one og:image, found ${property('og:image').length}`);

  const h1Count = matchAll(body, /<h1[\s>]/gi).length;
  if (h1Count !== 1) fail(where, `expected one <h1>, found ${h1Count}`);

  const main = body.match(/<main[\s\S]*<\/main>/i)?.[0] || '';
  const mainText = textOf(main);
  if (mainText.length < 40) fail(where, `main content is only ${mainText.length} characters (did it render?)`);
  else if (mainText.length < 200) warn(where, `thin page: ${mainText.length} characters in <main> (did its data load?)`);

  // Structured data: valid, and only describing what's on the page
  const blocks = matchAll(html, /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
    .map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        fail(where, 'invalid JSON-LD');
        return null;
      }
    })
    .filter(Boolean)
    .flatMap((block) => block['@graph'] ?? [block]);

  const breadcrumbLists = blocks.filter((block) => block['@type'] === 'BreadcrumbList');
  const trail = body.match(/<nav[^>]*aria-label="Breadcrumb"[\s\S]*?<\/nav>/i)?.[0];
  if (breadcrumbLists.length > 1) fail(where, `${breadcrumbLists.length} BreadcrumbLists`);
  if (breadcrumbLists.length && !trail) fail(where, 'BreadcrumbList with no visible trail');
  if (trail && !breadcrumbLists.length) fail(where, 'visible breadcrumb trail with no BreadcrumbList');
  if (trail && breadcrumbLists.length) {
    const shown = matchAll(trail, /<(a|span aria-current="page")[^>]*>([\s\S]*?)<\/(a|span)>/gi).map((m) => textOf(m[2]));
    const items = breadcrumbLists[0].itemListElement || [];
    const listed = items.map((item) => item.name);
    if (shown.join(' / ') !== listed.join(' / ')) fail(where, `breadcrumb trail "${shown.join(' / ')}" differs from its data "${listed.join(' / ')}"`);
    for (const item of items) {
      if (!String(item.item).startsWith(origin) || String(item.item).includes('#')) fail(where, `breadcrumb item ${item.item} isn't an absolute URL on this site`);
    }
  }

  const bodyText = textOf(body);
  for (const faq of blocks.filter((block) => block['@type'] === 'FAQPage')) {
    for (const question of faq.mainEntity || []) {
      if (!bodyText.includes(question.name)) fail(where, `FAQ markup question isn't on the page: "${question.name}"`);
    }
  }
  if (blocks.some((block) => block.aggregateRating || block['@type'] === 'Review')) {
    fail(where, 'review/rating markup (Google ignores ratings a business hosts about itself)');
  }

  // One thing per @id: the same id as two types splits it into two entities
  for (const [id, types] of declaredIds(blocks)) {
    if (types.size > 1) fail(where, `${id} is declared as ${[...types].join(' and ')}`);
  }

  // Articles: real dates, headline = h1, an absolute image, a named author
  if (property('og:type').some((tag) => attr(tag, 'content') === 'article')) {
    const published = property('article:published_time').map((tag) => attr(tag, 'content') || '');
    if (published.length !== 1 || !isIsoDate(published[0])) {
      fail(where, `article:published_time is "${published.join(', ')}", expected one ISO date`);
    }
    const articles = blocks.filter((block) => ARTICLE_TYPES.includes(block['@type']));
    if (articles.length !== 1) fail(where, `expected one Article/BlogPosting block, found ${articles.length}`);
    else {
      const [article] = articles;
      const h1 = textOf(body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
      if (article.headline !== h1) fail(where, `article headline "${article.headline}" differs from the h1 "${h1}"`);
      if (!isIsoDate(article.datePublished)) fail(where, `article datePublished "${article.datePublished}" isn't an ISO date`);
      if (article.dateModified && !isIsoDate(article.dateModified)) fail(where, `article dateModified "${article.dateModified}" isn't an ISO date`);
      const images = [article.image].flat().map((image) => (typeof image === 'string' ? image : image?.url)).filter(Boolean);
      if (!images.length || images.some((url) => !/^https?:\/\//i.test(url))) fail(where, 'article image must be an absolute URL');
      if (!article.author?.name) fail(where, 'article author has no name');
    }
  }

  // Internal links, for the link check
  const links = matchAll(body, /<a\s[^>]*href="([^"]+)"/gi)
    .map((m) => decode(m[1]))
    .filter((href) => (href.startsWith('/') && !href.startsWith('//')) || href.startsWith(origin))
    .map((href) => new URL(href, origin).pathname.replace(/\/+$/, '') || '/');

  // Share and structured-data images on this site, for the image check
  const images = [
    ...[...property('og:image'), ...named('twitter:image'), ...property('twitter:image')].map((tag) => decode(attr(tag, 'content') || '')),
    ...structuredImages(blocks),
  ]
    .filter((url) => url.startsWith(`${origin}/`))
    .map((url) => decodeURIComponent(new URL(url).pathname));

  return { title: titles[0], description: descriptions[0], links, images: [...new Set(images)] };
}

function checkUnique(pages) {
  for (const field of ['title', 'description']) {
    const seen = new Map();
    for (const [where, page] of pages) {
      if (!page[field]) continue;
      if (seen.has(page[field])) fail(where, `same ${field} as ${seen.get(page[field])}`);
      else seen.set(page[field], where);
    }
  }
}

const sitemapLocs = (xml) => matchAll(xml, /<loc>([^<]+)<\/loc>/g).map((m) => m[1].trim());

// robots.txt read the way crawlers do: each bot obeys its own group, else the '*' group
function checkRobots(where, text, origin) {
  if (!text.includes(`Sitemap: ${origin}/sitemap.xml`)) fail(where, `missing "Sitemap: ${origin}/sitemap.xml"`);

  const groups = [];
  let current = null;
  let readingAgents = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === 'user-agent') {
      if (!readingAgents) groups.push((current = { agents: [], disallow: [] }));
      current.agents.push(value.toLowerCase());
      readingAgents = true;
    } else {
      readingAgents = false;
      if (key === 'disallow' && current) current.disallow.push(value);
    }
  }

  const groupFor = (bot) =>
    groups.find((group) => group.agents.includes(bot.toLowerCase())) ?? groups.find((group) => group.agents.includes('*'));
  for (const bot of ['*', ...Object.keys(BOTS)]) {
    if (groupFor(bot)?.disallow.includes('/')) fail(where, `blocks ${bot === '*' ? 'every crawler' : bot} from the whole site`);
  }
}

const isCountryRoute = (route) => route === COUNTRIES_PAGE_URL || route.startsWith(`${COUNTRIES_PAGE_URL}/`);

// dist/ after the build
async function checkDist() {
  const read = (file) => readFile(resolve(dist, file), 'utf8');

  // A draft country guide never ships: no page file, none of its text in any asset
  for (const leak of draftLeaksIn(dist)) fail('draft country guide', leak);
  // Nor does a month page that isn't published (a draft, or one the guides can't fill)
  for (const leak of monthDraftLeaksIn(dist)) fail('unpublished month page', leak);

  if (!existsSync(resolve(dist, 'app-shell.html'))) {
    console.warn('⚠️  dist/ was not pre-rendered (SKIP_PRERENDER?), skipping the SEO page checks');
    return;
  }

  const locs = sitemapLocs(await read('sitemap.xml'));
  const routes = new Set();
  const pages = [];

  for (const loc of locs) {
    if (!loc.startsWith(`${FULL_BUSINESS_URL}/`) && loc !== FULL_BUSINESS_URL) fail('sitemap.xml', `${loc} isn't on ${FULL_BUSINESS_URL}`);
    const route = new URL(loc).pathname.replace(/\/+$/, '') || '/';
    routes.add(route);
    const file = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
    if (!existsSync(resolve(dist, file))) {
      fail(route, `in the sitemap but dist/${file} wasn't pre-rendered`);
      continue;
    }
    pages.push([route, checkPage(route, await read(file), loc, FULL_BUSINESS_URL)]);
  }
  checkUnique(pages);

  // The sitemap's country guides are exactly the checked ones (and /countries only with them)
  const countryRoutes = new Set(publishedCountryRoutes());
  for (const route of routes) {
    if (isCountryRoute(route) && !countryRoutes.has(route)) fail(route, 'in the sitemap but not a checked country guide');
  }
  for (const route of countryRoutes) if (!routes.has(route)) fail(route, 'a checked country guide missing from the sitemap');
  // ...and its month pages exactly the published ones
  const monthRoutes = new Set(publishedMonthRoutes());
  for (const route of routes) {
    if (route.startsWith(`${WHERE_TO_GO_URL}/`) && !monthRoutes.has(route)) fail(route, 'in the sitemap but not a published month page');
  }
  for (const route of monthRoutes) if (!routes.has(route)) fail(route, 'a published month page missing from the sitemap');

  for (const [route, page] of pages) {
    for (const link of new Set(page.links)) {
      const isFile = link !== '/' && existsSync(resolve(dist, link.slice(1)));
      if (!routes.has(link) && !isFile && !isClientOnly(link)) fail(route, `links to ${link}, which is no page`);
    }
  }
  for (const [image, route] of firstPageFor(pages, 'images')) {
    if (!existsSync(resolve(dist, image.slice(1)))) fail(route, `share/structured-data image ${image} isn't in dist/`);
  }

  const notFound = await read('404.html');
  if (!/<meta[^>]*name="robots"[^>]*content="noindex/i.test(notFound)) fail('404.html', 'not noindex');
  if (/rel="canonical"/i.test(notFound)) fail('404.html', 'has a canonical');
  if (!/name="robots" content="noindex/i.test(await read('app-shell.html'))) fail('app-shell.html', 'not noindex');
  if (!(await read('_redirects')).includes('/app-shell.html')) fail('_redirects', 'no app shell rules');
  if (existsSync(resolve(dist, '.htaccess')) && (await read('.htaccess')).includes('#__CLIENT_ONLY_REWRITES__')) {
    fail('.htaccess', 'browser-only rewrites were never filled in');
  }
  checkRobots('robots.txt', await read('robots.txt'), FULL_BUSINESS_URL);

  return pages.length;
}

// A deployed site
async function checkLive(origin) {
  const get = (url, options = {}) =>
    fetch(url, { redirect: 'manual', ...options, headers: { 'user-agent': BOTS.Googlebot, ...options.headers } });
  const { hostname } = new URL(origin);

  const sitemap = await get(`${origin}/sitemap.xml`);
  if (sitemap.status !== 200) {
    fail('/sitemap.xml', `status ${sitemap.status}`);
    return 0;
  }
  const locs = sitemapLocs(await sitemap.text());
  const routes = new Set();
  const pages = [];

  for (const loc of locs) {
    const route = new URL(loc).pathname.replace(/\/+$/, '') || '/';
    routes.add(route);
    const res = await get(loc);
    if (res.status !== 200) {
      fail(route, `status ${res.status}${res.headers.get('location') ? ` -> ${res.headers.get('location')}` : ''}`);
      continue;
    }
    if (/noindex/i.test(res.headers.get('x-robots-tag') || '')) fail(route, 'X-Robots-Tag noindex header');
    pages.push([route, checkPage(route, await res.text(), loc, origin)]);
  }
  checkUnique(pages);

  // Links not in the sitemap: 200 or one redirect
  const extra = new Set(pages.flatMap(([, page]) => page.links).filter((link) => !routes.has(link)));
  for (const link of extra) {
    const res = await get(`${origin}${link}`);
    if (res.status >= 400) fail(link, `linked from the site but returns ${res.status}`);
  }
  for (const [image, route] of firstPageFor(pages, 'images')) {
    const res = await get(`${origin}${image}`, { method: 'HEAD' });
    if (res.status !== 200) fail(route, `share/structured-data image ${image} returns ${res.status}`);
  }

  const missing = await get(`${origin}/__seo-check-missing-page__`);
  if (missing.status !== 404) fail('unknown URL', `returns ${missing.status}, expected 404 (soft 404)`);

  const firstPage = [...routes].find((route) => route !== '/');
  if (firstPage) {
    const slashed = await get(`${origin}${firstPage}/`);
    if (slashed.status === 200) fail(`${firstPage}/`, 'trailing-slash copy returns 200 (should 301 to the page)');
  }

  const redirectsHere = async (label, url) => {
    try {
      const res = await get(url);
      const location = res.headers.get('location') || '';
      if (![301, 308].includes(res.status) || !location.startsWith(origin)) {
        fail(label, `${url} returns ${res.status}${location ? ` -> ${location}` : ''}, expected a 301 to ${origin}`);
      }
    } catch (err) {
      warn(label, `${url} unreachable (${err.cause?.code || err.message})`);
    }
  };
  if (!hostname.startsWith('www.')) await redirectsHere('www', `https://www.${hostname}/`);
  await redirectsHere('http', `http://${hostname}/`);

  const robots = await get(`${origin}/robots.txt`);
  const robotsText = robots.status === 200 ? await robots.text() : '';
  checkRobots('/robots.txt', robotsText, origin);

  for (const [bot, userAgent] of Object.entries(BOTS)) {
    const res = await get(`${origin}/`, { headers: { 'user-agent': userAgent } });
    if (res.status !== 200) fail(bot, `home page returns ${res.status}`);
  }

  return pages.length;
}

const checked = liveOrigin ? await checkLive(liveOrigin) : await checkDist();

for (const line of warnings) console.warn(`⚠️  ${line}`);
if (errors.length) {
  console.error(`❌ SEO check failed (${errors.length}):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
if (checked !== undefined) console.log(`✅ SEO check passed (${checked} pages${liveOrigin ? ` on ${liveOrigin}` : ' in dist/'})`);
