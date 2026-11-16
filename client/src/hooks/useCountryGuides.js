import { useEffect, useState } from 'react';
// Utils
import { COUNTRY_PAGES, loadCountryIndex } from '@/utils/countries/countryPages';
import { countryOf } from '@/utils/map/ukNations';

// The country guides' index rows (code, slug, name, summary, months…), loaded once per
// session, and only when a country asked about has a guide in this build (checked ones in
// a build, drafts too on the dev server)
let index = null;
const loadIndex = () => {
  index ||= loadCountryIndex().catch((err) => {
    index = null;
    throw err;
  });
  return index;
};

const NONE = [];

/**
 * The guides for some countries, in the order asked: `[{ code, slug, name, months, … }]`
 * (scripts/country-pages.mjs indexRow), for the Travel Desk's "When to go". Countries
 * with no guide are left out. Nothing loads while `enabled` is false.
 */
export default function useCountryGuides(countryCodes, { enabled = true } = {}) {
  // Guides are per country: a UK nation's (a map that splits the UK) is the UK's, once
  const wanted = [...new Set((countryCodes || []).map(countryOf))].join(',');
  const [found, setFound] = useState({ wanted: null, guides: NONE });

  useEffect(() => {
    const codes = wanted ? wanted.split(',') : [];
    if (!enabled || !COUNTRY_PAGES.some((page) => codes.includes(page.code))) return undefined;
    let cancelled = false;
    loadIndex()
      .then((rows) => {
        if (cancelled) return;
        const guides = codes.map((code) => rows.find((row) => row.code === code)).filter((row) => row?.months?.length === 12);
        setFound({ wanted, guides });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [wanted, enabled]);

  return found.wanted === wanted ? found.guides : NONE;
}
