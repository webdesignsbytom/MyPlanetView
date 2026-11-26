// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { INDEXNOW_KEY, INDEXNOW_MAX_URLS, indexNowBody, keyLocation, pagesToSend, sitemapEntries } from '@/utils/seo/indexNow';

// IndexNow (the SEO playbook's A2; the audit, 26 Nov 2026)
const ORIGIN = 'https://myplanetview.com';
const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://myplanetview.com/</loc>
  </url>
  <url>
    <loc>https://myplanetview.com/countries/japan</loc>
    <lastmod>2026-11-20</lastmod>
  </url>
  <url>
    <loc> https://myplanetview.com/countries/france </loc>
    <lastmod>2026-10-01</lastmod>
  </url>
  <url>
    <loc>https://elsewhere.example/page</loc>
    <lastmod>2026-11-25</lastmod>
  </url>
</urlset>`;

describe('IndexNow', () => {
  it('has a key of 32 hex characters, served from the site’s root by public/<key>.txt', () => {
    expect(INDEXNOW_KEY).toMatch(/^[0-9a-f]{32}$/);
    const file = path.resolve(__dirname, '../../../../public', `${INDEXNOW_KEY}.txt`);
    expect(fs.readFileSync(file, 'utf8').trim()).toBe(INDEXNOW_KEY);
    expect(keyLocation(`${ORIGIN}/`)).toBe(`${ORIGIN}/${INDEXNOW_KEY}.txt`);
  });

  it('reads a sitemap’s pages and their lastmod', () => {
    expect(sitemapEntries(SITEMAP)).toEqual([
      { loc: 'https://myplanetview.com/', lastmod: null },
      { loc: 'https://myplanetview.com/countries/japan', lastmod: '2026-11-20' },
      { loc: 'https://myplanetview.com/countries/france', lastmod: '2026-10-01' },
      { loc: 'https://elsewhere.example/page', lastmod: '2026-11-25' },
    ]);
    expect(sitemapEntries('')).toEqual([]);
  });

  it('sends the pages changed since a day, or every one, only the site’s own, each once', () => {
    const entries = sitemapEntries(SITEMAP);
    expect(pagesToSend(entries, { origin: ORIGIN, since: new Date('2026-11-18') })).toEqual(['https://myplanetview.com/countries/japan']);
    expect(pagesToSend(entries, { origin: ORIGIN, all: true })).toEqual([
      'https://myplanetview.com/',
      'https://myplanetview.com/countries/japan',
      'https://myplanetview.com/countries/france',
    ]);
    // No date given, nothing chosen; a page twice, once
    expect(pagesToSend(entries, { origin: ORIGIN })).toEqual([]);
    expect(pagesToSend([...entries, entries[1]], { origin: ORIGIN, all: true })).toHaveLength(3);
    // No more than the protocol takes
    const many = Array.from({ length: INDEXNOW_MAX_URLS + 5 }, (_, i) => ({ loc: `${ORIGIN}/p${i}`, lastmod: null }));
    expect(pagesToSend(many, { origin: ORIGIN, all: true })).toHaveLength(INDEXNOW_MAX_URLS);
  });

  it('builds the request IndexNow takes', () => {
    expect(indexNowBody(ORIGIN, ['https://myplanetview.com/'])).toEqual({
      host: 'myplanetview.com',
      key: INDEXNOW_KEY,
      keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`,
      urlList: ['https://myplanetview.com/'],
    });
  });
});
