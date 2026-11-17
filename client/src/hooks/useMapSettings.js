import { useCallback, useEffect, useRef, useState } from 'react';
// Api
import { getMapSettings, putMapSettings } from '@/api/travelApi';
// Utils
import { getStoredItem, setStoredItem } from '@/utils/functions/safeStorage';
import { MAP_SETTINGS_STORAGE_KEY, cleanMapSettings } from '@/utils/map/mapSettings';

const SAVE_DELAY_MS = 800;

function readStored() {
  try {
    return cleanMapSettings(JSON.parse(getStoredItem(MAP_SETTINGS_STORAGE_KEY) || 'null'));
  } catch {
    return cleanMapSettings(null);
  }
}

// Save what's waiting in `pendingRef` to the profile, once
function savePending(pendingRef) {
  const pending = pendingRef.current;
  pendingRef.current = null;
  if (!pending) return;
  putMapSettings(pending).catch(() => {
    // Saving failed: the browser copy still holds them; try again on the next change
  });
}

/**
 * The viewer's map preferences. Always kept in this browser, which gives the first paint;
 * when `remote` (signed in) they're also loaded from the profile (and that copy kept in
 * this browser) and saved to it, a moment after the last change.
 */
export default function useMapSettings({ remote = false } = {}) {
  const [settings, setSettings] = useState(readStored);
  const changedRef = useRef(false);

  // Signed in: the profile's settings win over this browser's. The page draws with this
  // browser's copy first; the profile's are kept here too, so the next visit starts with
  // them rather than redrawing in another style once they arrive.
  useEffect(() => {
    if (!remote) return undefined;
    let cancelled = false;
    getMapSettings()
      .then(({ mapSettings }) => {
        if (cancelled || !mapSettings || changedRef.current) return;
        const clean = cleanMapSettings(mapSettings);
        setStoredItem(MAP_SETTINGS_STORAGE_KEY, JSON.stringify(clean));
        // Unchanged: keep the same object, so nothing re-renders
        setSettings((prev) => (JSON.stringify(prev) === JSON.stringify(clean) ? prev : clean));
      })
      .catch(() => {
        // No saved settings yet, or the endpoint is unavailable: this browser's copy stands
      });
    return () => {
      cancelled = true;
    };
  }, [remote]);

  // Save after a change: to this browser at once, to the profile after a pause. The
  // settings waiting for that pause are kept here, so leaving the page during it still
  // saves them (otherwise the profile's older copy wins on the next visit)
  const pendingRef = useRef(null);
  useEffect(() => {
    if (!changedRef.current) return undefined;
    setStoredItem(MAP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    if (!remote) {
      pendingRef.current = null;
      return undefined;
    }
    pendingRef.current = settings;
    const timer = setTimeout(() => savePending(pendingRef), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [settings, remote]);
  useEffect(() => () => savePending(pendingRef), []);

  const updateSetting = useCallback((key, value) => {
    changedRef.current = true;
    setSettings((prev) => cleanMapSettings({ ...prev, [key]: value }));
  }, []);

  return { settings, updateSetting };
}
