// Structured data for the country guides: only what the page shows (playbook M4). A guide
// is a WebPage about the country (named, with its Wikidata item), reviewed on its "Last
// checked" date; the breadcrumb trail adds its own BreadcrumbList (components/common/
// Breadcrumbs). The index is a CollectionPage listing the guides in the order shown.
import { SITE_LANGUAGE } from '@/utils/constants/constants';
import { collectionPageSchema, compact, websiteRef } from '@/utils/seo/schema';
import getCanonical from '@/utils/seo/getCanonical';
import { countryPagePath } from '@/utils/constants/routes';

export const countryPageSchema = (page, meta) =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: getCanonical(meta.path),
    name: meta.title,
    description: meta.desc,
    inLanguage: SITE_LANGUAGE,
    isPartOf: websiteRef,
    lastReviewed: page.lastChecked || undefined,
    about: { '@type': 'Country', name: page.name, sameAs: `https://www.wikidata.org/wiki/${page.facts.wikidata}` },
  });

export const countriesIndexSchema = (pages, meta) =>
  collectionPageSchema({
    path: meta.path,
    name: meta.title,
    description: meta.desc,
    items: pages.map((page) => ({ name: page.name, path: countryPagePath(page.slug) })),
  });
