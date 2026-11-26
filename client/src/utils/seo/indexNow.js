// IndexNow (indexnow.org; the SEO playbook's A2; the audit, 26 Nov 2026): tells Bing, Yandex,
// Seznam, Naver and Yep which pages changed, so they read them again soon (Google doesn't take
// part: for Google the sitemap and its lastmod are the channel). The key isn't a secret: it's
// served from the site's root as public/<key>.txt, which proves the site is ours, and
// scripts/indexnow.mjs sends the pages. Pure, so tested on its own.

export const INDEXNOW_KEY = '7fc8eae0c217eb6466ab0d62edd90571';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
// The protocol takes up to 10,000 addresses a request
export const INDEXNOW_MAX_URLS = 10000;

/** The key file's address on a site ("https://myplanetview.com/<key>.txt"). */
export const keyLocation = (origin) => `${String(origin).replace(/\/+$/, '')}/${INDEXNOW_KEY}.txt`;

/** A sitemap's pages: `[{ loc, lastmod }]` (lastmod null where the sitemap gives none). */
export function sitemapEntries(xml) {
  const entries = [];
  for (const [, body] of String(xml || '').matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = body.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1];
    if (!loc) continue;
    entries.push({ loc, lastmod: body.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1] ?? null });
  }
  return entries;
}

/**
 * The pages to send: every one (`all`, for the first send after launch), else those whose
 * lastmod is on or after `since` (a Date). Only this site's own addresses, each once.
 */
export function pagesToSend(entries, { origin, since = null, all = false }) {
  const host = new URL(origin).host;
  const chosen = entries.filter(({ loc, lastmod }) => {
    let url;
    try {
      url = new URL(loc);
    } catch {
      return false;
    }
    if (url.host !== host) return false;
    if (all) return true;
    if (!since || !lastmod) return false;
    const changed = new Date(lastmod);
    return !Number.isNaN(changed.getTime()) && changed.getTime() >= since.getTime();
  });
  return [...new Set(chosen.map(({ loc }) => loc))].slice(0, INDEXNOW_MAX_URLS);
}

/** The request IndexNow takes for those pages. */
export const indexNowBody = (origin, urls) => ({
  host: new URL(origin).host,
  key: INDEXNOW_KEY,
  keyLocation: keyLocation(origin),
  urlList: urls,
});
