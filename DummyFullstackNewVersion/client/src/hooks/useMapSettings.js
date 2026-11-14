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

/**
 * The viewer's map preferences. Always kept in this browser; when `remote` (signed in)
 * they're also loaded from and saved to the profile, a moment after the last change.
 */
export default function useMapSettings({ remote = false } = {}) {
  const [settings, setSettings] = useState(readStored);
  const changedRef = useRef(false);

  // Signed in: the profile's settings win over this browser's
  useEffect(() => {
    if (!remote) return undefined;
    let cancelled = false;
    getMapSettings()
      .then(({ mapSettings }) => {
        if (!cancelled && mapSettings && !changedRef.current) setSettings(cleanMapSettings(mapSettings));
      })
      .catch(() => {
        // No saved settings yet, or the endpoint is unavailable: this browser's copy stands
      });
    return () => {
      cancelled = true;
    };
  }, [remote]);

  // Save after a change: to this browser at once, to the profile after a pause
  useEffect(() => {
    if (!changedRef.current) return undefined;
    setStoredItem(MAP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    if (!remote) return undefined;
    const timer = setTimeout(() => {
      putMapSettings(settings).catch(() => {
        // Saving failed: the browser copy still holds them; try again on the next change
      });
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [settings, remote]);

  const updateSetting = useCallback((key, value) => {
    changedRef.current = true;
    setSettings((prev) => cleanMapSettings({ ...prev, [key]: value }));
  }, []);

  return { settings, updateSetting };
}
