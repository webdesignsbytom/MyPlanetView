import { createContext, useContext } from 'react';

// The map's landmark marks (docs/API.md "Collecting"), for the checklists deep in its panels:
// `stamped` (a Set: the passport's, from a confirmed photo), `ticked` (a Set: "been here"),
// and `onToggle(landmarkId, been)` for an editor (null otherwise). The map page provides it.
const NONE = Object.freeze({ stamped: new Set(), ticked: new Set(), onToggle: null });

export const LandmarkMarksContext = createContext(NONE);

export default function useLandmarkMarks() {
  return useContext(LandmarkMarksContext);
}
