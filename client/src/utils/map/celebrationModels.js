// The little 3D landmark models on the celebration screen (CelebrationDialog; 24 Nov 2026):
// a landmark's own, found by its Wikidata item (the landmarks reply's `wikidataId`, each
// model's `landmark`), and a country's, from the country maps that draw them. Only the
// celebration's code imports this, so the models' list stays out of the map's first load.
import { LANDMARK_MODELS } from './landmarkModels';

const BY_LANDMARK = new Map(LANDMARK_MODELS.map((model) => [model.landmark, model]));
const BY_ID = new Map(LANDMARK_MODELS.map((model) => [model.id, model]));

/** The model of a landmark (`{ wikidataId }`), or null when none has been made yet. */
export const modelForLandmark = (landmark) => (landmark?.wikidataId ? BY_LANDMARK.get(landmark.wikidataId) || null : null);

/**
 * A model by its id, or null: the one whose card a landmark was ticked on (a country's own map),
 * as a landmark can have several (the Eiffel Tower and the Arc de Triomphe are both Paris's).
 */
export const modelById = (id) => (id ? BY_ID.get(id) || null : null);

/**
 * A country's models (or a UK nation's), for its celebration: those its own map draws (never
 * one left off for overlapping a more famous one, `onMap: false`), the tallest first, then by
 * name; at most `max`. A place with no map of its own (a region, a pole) has none.
 */
export function modelsForPlace(code, max = 3) {
  return LANDMARK_MODELS.filter((model) => model.onMap !== false && model.maps.includes(code))
    .sort((a, b) => b.size - a.size || a.name.localeCompare(b.name))
    .slice(0, max);
}
