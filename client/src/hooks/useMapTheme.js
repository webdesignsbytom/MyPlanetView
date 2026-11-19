import { useEffect } from 'react';
// Utils
import { mapStyleById } from '@/utils/map/mapStyles';

/**
 * The map style's colours for everything on the page (index.css :root[data-map-theme]; 19
 * Nov 2026, the user's wish: the containers follow the style): the style on <html> while
 * the component is mounted, so dialogs drawn in portals follow it too. The animated sea
 * keeps the paperwork's own colours. Black and white puts the grey tokens there instead
 * (:root[data-mono]), for what sits outside the map page's greyscale filter: the photo
 * viewer's and slideshow's frames (their photos keep their colour) and portalled dialogs.
 * The map page (MapExperience) and its loading and error
 * screens (MapStatusScreen, from the settings this browser kept, so the first screen is
 * already in the style rather than changing once the map arrives). Nothing when `styleId`
 * is undefined.
 */
export default function useMapTheme(styleId) {
  const theme = styleId === undefined ? null : mapStyleById(styleId).id;
  useEffect(() => {
    if (!theme || theme === 'animated') return undefined;
    const attribute = theme === 'mono' ? 'data-mono' : 'data-map-theme';
    document.documentElement.setAttribute(attribute, theme === 'mono' ? '' : theme);
    return () => document.documentElement.removeAttribute(attribute);
  }, [theme]);
}
