import React, { Suspense, memo, useEffect, useSyncExternalStore } from 'react';
// Components
import { HoverPreview } from './lazyMapPanels';

// The postcard that follows the pointer over a country. It follows `hover` (a value store
// the map writes the hovered country to), so moving between countries re-renders only
// this, not the page. Its code is fetched once the browser is idle, on every screen: a
// long press shows it on a touch screen (CountryLayer; 17 Nov 2026).
function MapHoverLayer({ hover, hidden = false, visitsByCode, showPoster }) {
  const code = useSyncExternalStore(hover.subscribe, hover.get, hover.get);
  useEffect(() => {
    const warm = () => HoverPreview.preload().catch(() => {});
    if (!window.requestIdleCallback) {
      const timer = setTimeout(warm, 2000);
      return () => clearTimeout(timer);
    }
    const id = window.requestIdleCallback(warm, { timeout: 5000 });
    return () => window.cancelIdleCallback(id);
  }, []);

  if (!code || hidden) return null;
  return (
    <Suspense fallback={null}>
      <HoverPreview code={code} status={visitsByCode[code]} showPoster={showPoster} />
    </Suspense>
  );
}

export default memo(MapHoverLayer);
