import { createContext, useContext } from 'react';

// Whether the map being shown splits the UK into its four nations (the map's `splitUk`;
// utils/map/ukNations.js). The map page, the trip page and share links provide it, so the
// country pickers, landmark lists and posters inside follow the map without it being passed
// down. Outside one (the guides, the account page) it's false: the UK is one country.
const SplitUkContext = createContext(false);

export const SplitUkProvider = SplitUkContext.Provider;

export default function useSplitUk() {
  return useContext(SplitUkContext);
}
