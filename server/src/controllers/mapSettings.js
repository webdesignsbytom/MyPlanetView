// A signed-in user's map viewing preferences (style, grid, animations...)
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { cleanMapSettings } from '../utils/mapSettings.js';
import { findMapSettings, saveMapSettings } from '../domain/profiles.js';
import { badRequest, handler } from './helpers/travel.js';

const D = DOMAINS.maps;

export const getMapSettingsHandler = handler(D, 'Get map settings', async (req, res) => {
  return sendDataResponse(res, 200, { mapSettings: await findMapSettings(req.user.id) });
});

// A preference, not an audited change: not logged
export const putMapSettingsHandler = handler(D, 'Save map settings', async (req, res) => {
  const cleaned = cleanMapSettings((req.body || {}).mapSettings);
  if (!cleaned.ok) return badRequest(req, res, D, EVENT_MESSAGES.invalidMapSettings);
  const saved = await saveMapSettings(req.user.id, cleaned.value);
  return sendDataResponse(res, 200, { mapSettings: saved.mapSettings });
});
