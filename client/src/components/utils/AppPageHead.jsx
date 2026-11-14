import React from 'react';
import { useLocation } from 'react-router-dom';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from './HelmetItem';

// The head for an app page (noindex) from its helmetData entry, `title` overriding the
// page name (a map's or trip's own name).
function AppPageHead({ route, title }) {
  const location = useLocation();
  const entry = helmetData[route];
  return (
    <HelmetItem
      PageName={title || entry.pageName}
      desc={entry.desc}
      indexing={entry.indexing}
      canonicalPath={location.pathname}
    />
  );
}

export default AppPageHead;
