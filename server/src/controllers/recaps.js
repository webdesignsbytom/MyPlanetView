// "Your year in travel" (docs/API.md "Year in travel"; 21 Nov 2026, the user's wish): one
// calendar year of a map, for anyone on it (never through a share link), counting what they
// may see: the owner and editors hidden photos and moments too, others never.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { canEdit, canView } from '../utils/access.js';
import { RECAP_HIGHLIGHTS, buildRecap, parseRecapYear, stampsOf, tripsInYear, yearRange } from '../utils/recaps.js';
import {
  findDatedVisits,
  findRecapYears,
  findTripsForRecap,
  findYearHighlightPhotos,
  findYearMoments,
  findYearPhotoGroups,
  findYearStamps,
} from '../domain/recaps.js';
import { DISPLAY_LIST_SELECT } from '../domain/photos.js';
import { continentsByCode } from './helpers/countries.js';
import { photoListItem } from './helpers/views.js';
import { badRequest, handler, loadMap, notFound } from './helpers/travel.js';

const D = DOMAINS.maps;

// GET /maps/:mapId/recap/:year -> { recap }
export const getYearRecapHandler = handler(D, 'Get year in travel', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const year = parseRecapYear(req.params.year);
  if (!year) return badRequest(req, res, D, EVENT_MESSAGES.invalidRecapYear);

  const includeHidden = canEdit(role);
  const range = { ...yearRange(year), includeHidden };
  const [years, photoGroups, visits, trips, moments, stampRows, continentByCode] = await Promise.all([
    findRecapYears(map.id, { includeHidden }),
    findYearPhotoGroups(map.id, range),
    findDatedVisits(map.id),
    findTripsForRecap(map.id),
    findYearMoments(map.id, range),
    findYearStamps(map.id, range),
    continentsByCode(),
  ]);
  const { photoCountries, ...recap } = buildRecap({
    year,
    splitUk: Boolean(map.splitUk),
    photoGroups,
    visits,
    trips: tripsInYear(trips, year),
    moments,
    continentByCode,
  });
  // A photo from each country it has photos of, most photographed first
  const highlightRows = await findYearHighlightPhotos(map.id, {
    ...range,
    countryCodes: photoCountries.slice(0, RECAP_HIGHLIGHTS),
    select: DISPLAY_LIST_SELECT,
  });
  const highlights = await Promise.all(highlightRows.map((photo) => photoListItem(photo, role)));
  return sendDataResponse(res, 200, { recap: { ...recap, years, stamps: stampsOf(stampRows), highlights } });
});
