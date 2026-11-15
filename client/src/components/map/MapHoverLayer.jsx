import React, { Suspense, memo, useEffect, useSyncExternalStore } from 'react';
// Hooks
import useCanHover from '@/hooks/useCanHover';
// Components
import { HoverPreview } from './lazyMapPanels';

// The postcard that follows the pointer over a country. It follows `hover` (a value store
// the map writes the hovered country to), so moving between countries re-renders only
// this, not the page. Its code is fetched once the browser is idle, on screens that can
// hover; touch screens never fetch it.
function MapHoverLayer({ hover, hidden = false, visitsByCode, thumbsByCountry, showPhotos }) {
  const code = useSyncExternalStore(hover.subscribe, hover.get, hover.get);
  const canHover = useCanHover();

  useEffect(() => {
    if (!canHover) return undefined;
    const warm = () => HoverPreview.preload().catch(() => {});
    if (!window.requestIdleCallback) {
      const timer = setTimeout(warm, 2000);
      return () => clearTimeout(timer);
    }
    const id = window.requestIdleCallback(warm, { timeout: 5000 });
    return () => window.cancelIdleCallback(id);
  }, [canHover]);

  if (!code || hidden) return null;
  return (
    <Suspense fallback={null}>
      <HoverPreview code={code} status={visitsByCode[code]} thumbs={thumbsByCountry[code]} showPhotos={showPhotos} />
    </Suspense>
  );
}

export default memo(MapHoverLayer);
