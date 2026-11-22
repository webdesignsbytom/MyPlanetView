// Changing a map's own design for a map style in Settings (docs/API.md "Map designs"; one
// design per style, `style` the one the map is in). Each change shows on the map at once and is saved DESIGN_SAVE_DELAY_MS after the last one (a colour picker
// sends one change per move). Colours go through `preview` (a value store MapDesignStyle
// follows), so the page isn't re-rendered on every move; a change that adds or removes the
// design itself (the first, or turning it on or off) goes to the map's state
// (`onDesignChange(style, design)`, useTravelMap's setDesign), as does each saved answer.
// Changing anything switches the design on. Closing Settings (or choosing another style, which
// gives that style's design its own editor) keeps what's shown and sends what's waiting.
import { useCallback, useEffect, useRef, useState } from 'react';
// API
import { removeDesignPicture, updateMapDesign } from '@/api/travelApi';
// Utils
import { DESIGN_SAVE_DELAY_MS, EMPTY_DESIGN } from '@/utils/map/mapDesign';
import { uploadDesignPicture } from '@/utils/map/uploadDesignPicture';

const failed = (err, fallback) => err?.friendlyMessage || err?.message || fallback;

export default function useMapDesignEditor({ mapId, style, design, onDesignChange, preview }) {
  // The design as changed here and not saved yet; null when it's the map's own
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState({ state: 'idle', error: '' });
  const [picture, setPicture] = useState({ busy: false, progress: 0 });
  const draftRef = useRef(null);
  const waitingRef = useRef({});
  const timerRef = useRef(0);
  const sentRef = useRef(0);
  const designRef = useRef(design);
  useEffect(() => {
    designRef.current = design;
  }, [design]);

  const current = draft ?? design ?? null;

  const settle = useCallback(
    (saved) => {
      draftRef.current = null;
      setDraft(null);
      preview?.set(null);
      onDesignChange?.(style, saved);
    },
    [onDesignChange, preview, style],
  );

  const send = useCallback(async () => {
    window.clearTimeout(timerRef.current);
    const body = waitingRef.current;
    waitingRef.current = {};
    if (!Object.keys(body).length) return;
    const mine = ++sentRef.current;
    setStatus({ state: 'saving', error: '' });
    try {
      const { design: saved } = await updateMapDesign(mapId, { style, ...body });
      // A newer change is waiting or on its way: its answer settles it
      if (mine !== sentRef.current || Object.keys(waitingRef.current).length) return;
      settle(saved);
      setStatus({ state: 'saved', error: '' });
    } catch (err) {
      if (mine !== sentRef.current) return;
      // Back to what the map has, saying why
      draftRef.current = null;
      setDraft(null);
      preview?.set(null);
      onDesignChange?.(style, designRef.current);
      setStatus({ state: 'idle', error: failed(err, 'The design couldn’t be saved. Please try again.') });
    }
  }, [mapId, style, settle, preview, onDesignChange]);

  // Closing Settings (or another map, or another style) sends what's waiting, and puts what's
  // shown in the map's state first, so the preview can go (another style must not wear it)
  useEffect(
    () => () => {
      if (draftRef.current) onDesignChange?.(style, draftRef.current);
      preview?.set(null);
      void send();
    },
    [send, style, onDesignChange, preview],
  );

  /** Change part of the design: `{ shown?, countries?, names?, grid? }` as the API takes it. */
  const change = useCallback(
    (patch) => {
      const before = draftRef.current ?? designRef.current ?? null;
      const next = { ...EMPTY_DESIGN, ...before, ...patch };
      const body = { ...patch };
      // Changing anything shows it
      if (patch.shown === undefined && !before?.shown) {
        next.shown = true;
        body.shown = true;
      }
      draftRef.current = next;
      setDraft(next);
      // Showing or hiding the design changes the page; a colour only the style sheet
      if (next.shown !== Boolean(before?.shown)) {
        preview?.set(null);
        onDesignChange?.(style, next);
      } else preview?.set(next);
      Object.assign(waitingRef.current, body);
      setStatus({ state: 'idle', error: '' });
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(send, DESIGN_SAVE_DELAY_MS);
    },
    [onDesignChange, preview, send, style],
  );

  /** One place's colour ("#rrggbb"), or null for its usual one. */
  const setCountryColour = useCallback(
    (code, colour) => {
      const countries = { ...(draftRef.current ?? designRef.current)?.countries };
      if (colour) countries[code] = colour;
      else delete countries[code];
      change({ countries });
    },
    [change],
  );

  /** A new sea picture (replacing the old one) or none. */
  const runPicture = useCallback(
    async (job, fallback) => {
      setPicture({ busy: true, progress: 0 });
      setStatus((prev) => ({ ...prev, error: '' }));
      try {
        await send(); // colours first, so the answer below carries them
        const saved = await job();
        const waiting = Object.keys(waitingRef.current).length;
        // Colours changed meanwhile keep showing, and are saved after
        if (waiting) {
          const next = { ...draftRef.current, picture: saved?.picture ?? null, shown: saved?.shown ?? true };
          draftRef.current = next;
          setDraft(next);
          onDesignChange?.(style, next);
        } else settle(saved);
      } catch (err) {
        setStatus({ state: 'idle', error: failed(err, fallback) });
      } finally {
        setPicture({ busy: false, progress: 0 });
      }
    },
    [send, settle, onDesignChange, style],
  );

  const choosePicture = useCallback(
    (file) =>
      runPicture(
        () => uploadDesignPicture(mapId, style, file, (progress) => setPicture({ busy: true, progress })),
        'The picture couldn’t be uploaded. Please try again.',
      ),
    [mapId, style, runPicture],
  );
  const removePicture = useCallback(
    () => runPicture(async () => (await removeDesignPicture(mapId, style)).design, 'The picture couldn’t be removed. Please try again.'),
    [mapId, style, runPicture],
  );

  return { design: current, change, setCountryColour, choosePicture, removePicture, picture, status };
}
