// Changing how the map shows the places been to, in Settings (docs/API.md "The visited look"; the
// map's own, in every map style: 25 Nov 2026, the user's wish). As useMapDesignEditor: each change
// shows on the map at once through `preview` (a value store MapDesignStyle and VisitedFoil follow,
// so a colour picker's every move restyles the map without re-rendering the page) and is saved
// DESIGN_SAVE_DELAY_MS after the last, through `onSave` (useTravelMap's setVisitedLook, which puts
// it in the map's state at once). The preview goes once the map's state has caught up with it, so
// the old look never flashes back; closing Settings sends what's waiting.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Utils
import { DESIGN_SAVE_DELAY_MS, visitedLookFrom } from '@/utils/map/mapDesign';

const failed = (err) => err?.friendlyMessage || err?.message || 'That couldn’t be saved. Please try again.';
const sameLook = (a, b) => a.visitedLook === b.visitedLook && a.visitedColour === b.visitedColour && a.visitedFinish === b.visitedFinish;

export default function useVisitedLookEditor({ map, onSave, preview }) {
  const saved = useMemo(
    () => visitedLookFrom({ visitedLook: map.visitedLook, visitedColour: map.visitedColour, visitedFinish: map.visitedFinish }),
    [map.visitedLook, map.visitedColour, map.visitedFinish],
  );
  // The look as changed here and not yet in the map's state; null when it's the map's own
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const draftRef = useRef(null);
  const waitingRef = useRef({});
  const timerRef = useRef(0);
  const savedRef = useRef(saved);
  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  const forget = useCallback(() => {
    draftRef.current = null;
    setDraft(null);
    preview?.set(null);
  }, [preview]);

  const send = useCallback(async () => {
    window.clearTimeout(timerRef.current);
    const body = waitingRef.current;
    waitingRef.current = {};
    if (!Object.keys(body).length || !onSave) return;
    try {
      await onSave(body);
    } catch (err) {
      // The map is read again with what it really has
      forget();
      setError(failed(err));
    }
  }, [onSave, forget]);

  // The map's state has caught up with what's shown, and nothing more is waiting: the preview goes
  useEffect(() => {
    if (draftRef.current && sameLook(draftRef.current, saved) && !Object.keys(waitingRef.current).length) forget();
  }, [saved, forget]);

  // Closing Settings (or another map) sends what's waiting
  useEffect(
    () => () => {
      preview?.set(null);
      void send();
    },
    [send, preview],
  );

  /** Change part of it: `{ visitedLook?, visitedColour?, visitedFinish? }`, as the API takes it. */
  const change = useCallback(
    (patch) => {
      const next = { ...(draftRef.current ?? savedRef.current), ...patch };
      draftRef.current = next;
      setDraft(next);
      preview?.set(next);
      Object.assign(waitingRef.current, patch);
      setError('');
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(send, DESIGN_SAVE_DELAY_MS);
    },
    [preview, send],
  );

  return { look: draft ?? saved, error, change };
}
