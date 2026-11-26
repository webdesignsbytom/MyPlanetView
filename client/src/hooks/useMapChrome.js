import { createContext, useContext } from 'react';

// Whether the map page's menus are slid out of the way (25 Nov 2026, the user's wish: the tab on
// the toolbar, MenusTab), and `show()` to bring them back: anything that opens a card or a panel
// while they're hidden calls it. MapExperience provides it; not saved, so a reload shows them.
const NONE = Object.freeze({ hidden: false, show: () => {} });

export const MapChromeContext = createContext(NONE);

export default function useMapChrome() {
  return useContext(MapChromeContext);
}
