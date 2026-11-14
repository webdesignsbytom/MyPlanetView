// Data
import { helmetData } from '../data/helmetData.js';

// A crumb for a routed page, named the way the page names itself
export const crumbFor = (route) => ({ name: helmetData[route]?.pageName, href: route });

// BreadcrumbList data; only render it beside a visible trail (Breadcrumbs component)
export const buildBreadcrumbLd = ({ baseUrl, items }) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: `${baseUrl}${item.href}`,
  })),
});
