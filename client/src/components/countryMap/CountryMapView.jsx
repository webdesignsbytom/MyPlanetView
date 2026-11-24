import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
// Icons
import { FaArrowLeft } from 'react-icons/fa';
import { FiList } from 'react-icons/fi';
// Hooks
import useMapViewport, { useViewportZoom } from '@/hooks/useMapViewport';
import useCountryMapData from '@/hooks/useCountryMapData';
// Components
import MapZoomControls from '@/components/map/MapZoomControls';
import MapRoundButton from '@/components/map/MapRoundButton';
import MapPanel from '@/components/map/MapPanel';
import MapKeyboardHint from '@/components/map/MapKeyboardHint';
import { StarBadgeSymbols } from '@/components/map/StarBadge';
import { MomentSpotIcon } from '@/components/map/MomentSpotPins';
import StatePopover from './StatePopover';
import LandmarkModelCard from './LandmarkModelCard';
import CountryMapList from './CountryMapList';
import CountryMapLoading from './CountryMapLoading';
import CountryFlag from './CountryFlag';
// Utils
import { countsAsVisited, pastelFill } from '@/utils/map/visitStatus';
import { badgeIdFor, badgeRadius } from '@/utils/map/badges';
import { countryName } from '@/utils/map/countries';
import { placeOnCountryMap, positionOnCountryMap } from '@/utils/map/countryMapGeo';
import { LANDMARK_MODELS, LANDMARK_MODEL_HEIGHTS } from '@/utils/map/landmarkModels';
import { modelBox, modelPx, modelsOnMap, viewWithModels } from '@/utils/map/landmarkModelSize';
import { MAP_WIDTH, REFERENCE_PX_PER_UNIT } from '@/utils/map/projection';
import { clearPointerFocus, markPointerFocus } from '@/utils/map/pointerFocus';

// A map pin, its tip at (0, 0) (MomentSpotPins' drop), about 3 units tall
const PIN_PATH = 'M0 0C-0.35-0.7-1-1.25-1-2A1 1 0 0 1 1-2C1-1.25 0.35-0.7 0 0Z';
const EMPTY_EXTENT = { top: 0, bottom: 2000 };
// Text at this size on screen (CSS px), and a pin this tall
const LABEL_PX = 11;
const PIN_PX = 30;
const CHAR_WIDTH = 0.55;
// The closest zoom, set apart from the world map's so each can be tuned: 64, two of the zoom
// stamps' steps (×1.6) past the old 25 (22 Nov 2026, the user's wish: on the UK's map London's
// boroughs were as close as it went)
const COUNTRY_MAX_ZOOM = 64;

// A state's look, as a country's on the world map (18 Nov 2026, the user's wish): every one
// wears one of the seven pastels (`colour`, no two neighbours alike), a visited or lived-in
// one its star (StateBadges), and a wanted one a dashed outline
function stateClass(colour, status) {
  if (status === 'WANT_TO_GO') return `${pastelFill(colour)} stroke-map-wish stroke-[1.4] [stroke-dasharray:3_2]`;
  return `${pastelFill(colour)} stroke-map-land-edge`;
}

// The states, redrawn only when a status changes (hover is CSS)
const StateShapes = memo(function StateShapes({ areas, statuses }) {
  return areas.map((area, i) => (
    <g
      key={area.code ?? i}
      data-state={area.code ?? undefined}
      data-status={area.code ? (statuses.get(area.code) ?? 'NONE') : undefined}
      className={`${stateClass(area.colour, area.code ? statuses.get(area.code) : null)} ${area.code ? 'cursor-pointer hover:fill-map-hover' : ''}`}
    >
      {area.paths.map((d, j) => (
        <path key={j} d={d} />
      ))}
    </g>
  ));
});

// A visited or lived-in state's star sticker at its label point, as the world map's badges
const StateBadges = memo(function StateBadges({ areas, statuses, countryCode, viewport }) {
  const zoom = useViewportZoom(viewport);
  const r = badgeRadius(zoom);
  return (
    <g aria-hidden='true' className='pointer-events-none'>
      {areas.map((area) => {
        const id = area.code ? badgeIdFor(countryCode, statuses.get(area.code)) : null;
        return id ? <use key={area.code} href={`#${id}`} x={area.at[0] - r} y={area.at[1] - r} width={r * 2} height={r * 2} /> : null;
      })}
    </g>
  );
});

// The states' names, each drawn once it fits inside its state at the zoom (under its star
// when it has one)
// The names that fit inside their state and don't run into a name already placed, the widest
// states first, so a small state's name never overlaps its neighbour's (France's Nord and
// Pas-de-Calais did; 19 Nov 2026, the audit). Zoomed in, the names shrink and more fit.
function placedNames(areas, statuses, size, r) {
  const boxes = [];
  const shown = [];
  const byWidth = areas.filter((area) => area.name).sort((a, b) => b.width - a.width);
  for (const area of byWidth) {
    const w = area.name.length * CHAR_WIDTH * size;
    if (w > area.width * 0.92) continue;
    const y = area.at[1] + (countsAsVisited(statuses.get(area.code)) ? r + size * 0.9 : size * 0.35);
    const box = [area.at[0] - w / 2, y - size * 0.8, area.at[0] + w / 2, y + size * 0.25];
    if (boxes.some((b) => box[0] < b[2] && b[0] < box[2] && box[1] < b[3] && b[1] < box[3])) continue;
    boxes.push(box);
    shown.push({ area, y });
  }
  return shown;
}

const StateNames = memo(function StateNames({ areas, statuses, viewport }) {
  const zoom = useViewportZoom(viewport);
  const size = LABEL_PX / (zoom * REFERENCE_PX_PER_UNIT);
  const r = badgeRadius(zoom);
  return (
    <g className='pointer-events-none fill-map-names font-medium' fontSize={size} textAnchor='middle' aria-hidden='true'>
      {placedNames(areas, statuses, size, r).map(({ area, y }, i) => (
        <text key={area.code ?? i} x={area.at[0]} y={y}>
          {area.name}
        </text>
      ))}
    </g>
  );
});

// The little 3D landmark models (22 Nov 2026, the user's wish: on the country maps for now, not
// the world map): toy models made in Blender, each standing with its grass tile's middle on its
// real spot (Big Ben at Westminster). Made by images/src/tools/landmark-models.mjs, which
// writes utils/map/landmarkModels.js. On screen 64 px tall at zoom 1, growing with the square
// root of the zoom (a thing on the map, yet never covering a city), between 40 and 150 px,
// times the model's `size` (every model at one scale: the Eiffel Tower a little taller than Big
// Ben; utils/map/landmarkModelSize.js); the smaller picture while it's sharp enough on a 2×
// screen. A press on one opens its card (LandmarkModelCard; 24 Nov 2026, the user's wish); the
// keyboard's and screen readers' way to them is the list, as for the states and pins.
const LandmarkModels = memo(function LandmarkModels({ geo, models, viewport }) {
  const zoom = useViewportZoom(viewport);
  if (!models.length) return null;
  return (
    <g aria-hidden='true'>
      {models.map((model) => {
        const at = placeOnCountryMap(geo, model.latitude, model.longitude);
        const tall = modelPx(model, zoom);
        const box = modelBox(model, at, zoom);
        const picture = LANDMARK_MODEL_HEIGHTS.find((height) => height >= tall * 2) ?? LANDMARK_MODEL_HEIGHTS.at(-1);
        // The group stands on the spot; the picture is moved so its tile's middle is there
        return (
          <g key={model.id} data-landmark-model={model.id} transform={`translate(${at.x} ${at.y})`} className='cursor-pointer'>
            <title>{model.name}</title>
            <image href={model.images[picture]} x={box.x - at.x} y={box.y - at.y} width={box.width} height={box.height} />
          </g>
        );
      })}
    </g>
  );
});

const Pins = memo(function Pins({ geo, pins, viewport, selectedId }) {
  const zoom = useViewportZoom(viewport);
  const scale = PIN_PX / 3 / (zoom * REFERENCE_PX_PER_UNIT);
  return pins.map((pin) => {
    const at = placeOnCountryMap(geo, pin.latitude, pin.longitude);
    const selected = pin.id === selectedId;
    return (
      <g key={pin.id} data-pin={pin.id} transform={`translate(${at.x} ${at.y}) scale(${selected ? scale * 1.25 : scale})`} className='cursor-pointer'>
        <title>{pin.name}</title>
        {/* Every pin the same: most are the editors' own now (shared ones are the exception) */}
        <path d={PIN_PATH} strokeWidth={1.5} className='fill-poster-red stroke-poster-ink' />
        <circle cy={-2} r={0.42} className='fill-poster-cream' />
      </g>
    );
  });
});

// The state a spot on the canvas is in (the one a landmark model stands on), or null: off the
// shore (Liberty Island), or where the browser can't test a point against a shape
function stateAt(svg, x, y) {
  if (!svg || typeof DOMPoint === 'undefined') return null;
  const point = new DOMPoint(x, y);
  for (const group of svg.querySelectorAll('[data-state]')) {
    for (const path of group.querySelectorAll('path')) {
      if (typeof path.isPointInFill === 'function' && path.isPointInFill(point)) return group.getAttribute('data-state');
    }
  }
  return null;
}

/**
 * A country opened on its own (18 Nov 2026, the user's wish; docs/API.md "Country maps"): the
 * country alone, as big as the screen allows, on its own projection, its far-off parts in
 * insets, its states or provinces drawn and coloured as the map stands with them, and its
 * pins. It takes the world map's place on the page (MapExperience), with its own pan and
 * zoom. A press on a state opens StatePopover (editors mark it); on a landmark model,
 * LandmarkModelCard (editors tick "Been here"); on a pin, `onOpenPin(id)`.
 * "Add a pin" (editors; `locked` while the email isn't verified) waits for a press on the
 * map, then `onNewPin({ latitude, longitude, countryCode })`. `pinsVersion` going up reloads
 * the pins; `onVisitsChanged` runs after a state's change brought its country's visit.
 */
function CountryMapView({ code, source, canEdit = false, locked = false, pinsVersion = 0, selectedPinId = null, onOpenPin, onNewPin, onVisitsChanged, onClose }) {
  const headingId = useId();
  const hintId = useId();
  const { geo, statuses, pins, error, setStatus } = useCountryMapData({ source, code, pinsVersion });
  const extent = geo ? { top: 0, bottom: geo.height } : EMPTY_EXTENT;
  // The view lives in the viewport, not here: only the layers drawn by zoom (badges, names,
  // models, pins) read it, each with useViewportZoom, so a pinch re-renders them alone, as on
  // the world map (23 Nov 2026: this whole view re-rendered on every zoom step)
  const viewport = useMapViewport({ extent, maxZoom: COUNTRY_MAX_ZOOM });
  const boxRef = useRef(null);
  const headerRef = useRef(null);
  const [placing, setPlacing] = useState(false);
  const [popover, setPopover] = useState(null); // { code, name, x, y }
  const [modelCard, setModelCard] = useState(null); // { id, stateName }
  const [statusError, setStatusError] = useState(null);
  // The states and pins as a list: a round stamp at the top left on every screen, the list a
  // panel in the middle (19 Nov 2026, the user's wish: its button made the header look poor)
  const [listOpen, setListOpen] = useState(false);
  const name = countryName(code);
  const models = useMemo(() => modelsOnMap(LANDMARK_MODELS, code), [code]);
  const modelsById = useMemo(() => new Map(models.map((model) => [model.id, model])), [models]);
  const info = geo?.word;
  const many = info?.[1] || 'states';
  // What the list holds: the states, the landmark models drawn (every country map has one or
  // more) and the pins
  const listWhat = `${many}${models.length ? ', landmarks' : ''} and pins`;
  const listTitle = `${listWhat[0].toUpperCase()}${listWhat.slice(1)}`;
  const marked = geo ? geo.areas.filter((a) => a.code && ['VISITED', 'LIVED'].includes(statuses.get(a.code))).length : 0;
  const total = geo ? geo.areas.filter((a) => a.code).length : 0;

  // The whole country in view, as big as the screen allows below the header: from the
  // screen's left edge (the goal tag steps aside while a country is open: MapExperience) to
  // the toolbar's column on wide screens (18 Nov 2026, the user's wish: no wasted room)
  const fitCountry = useCallback(() => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!geo || !box?.width) return;
    const left = 16;
    const right = box.width >= 768 ? 88 : 16;
    const top = (headerRef.current?.getBoundingClientRect().bottom ?? box.top) - box.top + 10;
    const free = Math.max(box.height - top - 12, box.height / 3);
    const across = box.width - left - right;
    // Map units per pixel, so a view fits the free area's width and height (the canvas is
    // MAP_WIDTH across: the generator keeps every country small enough for that)
    const fit = ([, , vw, vh]) => Math.min(Math.max(vw / across, vh / free), MAP_WIDTH / box.width);
    // The country and its landmark models whole (23 Nov 2026: Bikini Atoll stands off the
    // Marshall Islands' drawn atolls, Gorée's picture overhung Africa's westernmost point):
    // each pass grows the view by the models' pictures at the zoom the last one gave
    let view = geo.view;
    for (let pass = 0; pass < 3 && models.length; pass += 1) {
      const perPx = fit(view);
      view = viewWithModels(geo, geo.view, models, 1 / (perPx * REFERENCE_PX_PER_UNIT), 8 * perPx);
    }
    const [x, y, w, h] = view;
    const perPx = fit(view);
    // The view's centre: the free area's, not the screen's
    const centreX = x + w / 2 + (box.width / 2 - (left + across / 2)) * perPx;
    const centreY = y + h / 2 + (box.height / 2 - (top + free / 2)) * perPx;
    viewport.focusOn(centreX, centreY, box.width * perPx);
  }, [geo, models, viewport]);
  useEffect(() => {
    if (!geo) return undefined;
    // After the viewport has taken the new extent (its own layout effect)
    const frame = requestAnimationFrame(fitCountry);
    return () => cancelAnimationFrame(frame);
  }, [geo, fitCountry]);

  // Focus starts on the country's name: the button that opened the map went with the world
  // map, and focus was left on the page (19 Nov 2026, the audit)
  const headingRef = useRef(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // A state's card and a landmark model's, one at a time, each giving focus back to what
  // opened it (the map, or the list's button)
  const popoverOpenerRef = useRef(null);
  const openPopover = useCallback((next, opener) => {
    popoverOpenerRef.current = opener ?? null;
    setStatusError(null);
    setModelCard(null);
    setPopover(next);
  }, []);
  const openModelCard = useCallback((next, opener) => {
    popoverOpenerRef.current = opener ?? null;
    setPopover(null);
    setModelCard(next);
  }, []);
  const closePopover = useCallback(() => {
    setPopover(null);
    setModelCard(null);
    const opener = popoverOpenerRef.current;
    popoverOpenerRef.current = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }, []);
  // Both cards gone, focus left where it is (a pin opening, "Add a pin", a press on the sea)
  const dropCards = useCallback(() => {
    setPopover(null);
    setModelCard(null);
  }, []);

  // Escape: stop placing a pin, else close the card. Not when a dialog over the map took it
  // (the celebration a "Been here" tick opens: useModalA11y)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (placing) setPlacing(false);
      else if (popover || modelCard) closePopover();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [placing, popover, modelCard, closePopover]);

  // A state from the list: its card beside the list's button
  const openStateFromList = (stateCode, button) => {
    const area = geo?.areas.find((a) => a.code === stateCode);
    const rect = button.getBoundingClientRect();
    openPopover({ code: stateCode, name: area?.name ?? stateCode, x: rect.right, y: rect.top }, button);
  };

  // The name of the state a model stands in, for its card
  const modelStateName = (model) => {
    const at = placeOnCountryMap(geo, model.latitude, model.longitude);
    const stateCode = stateAt(boxRef.current?.querySelector('svg[role="application"]'), at.x, at.y);
    return stateCode ? (geo.areas.find((a) => a.code === stateCode)?.name ?? null) : null;
  };
  // A model from the list: its card, focus going back to the list's button after
  const openModelFromList = (modelId, button) => {
    const model = modelsById.get(modelId);
    if (!model || !geo) return;
    openModelCard({ id: modelId, stateName: modelStateName(model) }, button);
  };

  const svgPoint = (e) => {
    const svg = e.currentTarget.ownerSVGElement ?? e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  };

  const handleClick = (e) => {
    if (!geo) return;
    const pinId = e.target.closest?.('[data-pin]')?.getAttribute('data-pin');
    const model = modelsById.get(e.target.closest?.('[data-landmark-model]')?.getAttribute('data-landmark-model'));
    const stateCode = e.target.closest?.('[data-state]')?.getAttribute('data-state');
    const point = svgPoint(e);
    const at = { x: e.clientX, y: e.clientY };
    viewport.afterTap(() => {
      if (placing) {
        if (!point) return;
        setPlacing(false);
        onNewPin?.({ ...positionOnCountryMap(geo, point.x, point.y), countryCode: code });
        return;
      }
      if (pinId) {
        dropCards();
        onOpenPin?.(pinId);
        return;
      }
      if (model) {
        openModelCard({ id: model.id, stateName: modelStateName(model) }, document.activeElement);
        return;
      }
      if (stateCode) {
        const area = geo.areas.find((a) => a.code === stateCode);
        openPopover({ code: stateCode, name: area?.name ?? stateCode, ...at }, document.activeElement);
      } else dropCards();
    });
  };

  const changeStatus = async (stateCode, status) => {
    setStatusError(null);
    try {
      const implied = await setStatus(stateCode, status);
      // The world map and the badges catch up after a change that brought visits, and after
      // a clear: a state that is a region's own visit (Hawaii's) takes that visit with it
      // (19 Nov 2026, the audit)
      if (implied.length || status === null) onVisitsChanged?.();
    } catch (err) {
      setStatusError(err.friendlyMessage || 'That change could not be saved.');
    }
  };

  const addPin = canEdit ? (
    <button
      type='button'
      aria-pressed={placing}
      disabled={locked || !geo}
      onClick={() => {
        dropCards();
        setPlacing((on) => !on);
      }}
      className={`${placing ? 'btn-poster' : 'btn-paper'} grid-flow-col gap-2 [--btn-pad-x:0.75rem] [--btn-pad-y:0.25rem] [--btn-size:0.875rem] disabled:opacity-50`}
    >
      {/* The pin as the map draws it: red, outlined in black */}
      <MomentSpotIcon className='h-5 w-5 self-center' />
      {placing ? 'Cancel' : 'Add a pin'}
    </button>
  ) : null;
  const backToWorld = (
    <button type='button' onClick={onClose} className='btn-paper grid-flow-col gap-2 [--btn-pad-x:0.75rem] [--btn-pad-y:0.25rem] [--btn-size:0.875rem]'>
      <FaArrowLeft aria-hidden='true' className='self-center' />
      World map
    </button>
  );

  return (
    <section ref={boxRef} aria-labelledby={headingId} data-country-map={code} className='absolute inset-0'>
      <svg
        ref={viewport.svgRef}
        preserveAspectRatio='xMidYMid meet'
        role='application'
        aria-label={`Map of ${name}${info ? `: its ${info[1]}` : ''}${placing ? '. Press where the pin goes' : ''}`}
        aria-describedby={hintId}
        tabIndex={0}
        // No focus ring, as on the world map (utils/map/pointerFocus.js): the hint below shows
        // the keyboard's focus instead. `touch-none`, as the world map's: a finger's drag and
        // pinch are the map's own, not the browser's scroll and page zoom, which held back and
        // cut off the touch moves (23 Nov 2026, the user's report: jerky, delayed panning on a phone)
        onPointerDownCapture={markPointerFocus}
        onBlur={clearPointerFocus}
        className={`peer h-full w-full touch-none select-none outline-none [&_path]:[vector-effect:non-scaling-stroke] ${placing ? 'cursor-crosshair' : 'cursor-grab data-[grabbing]:cursor-grabbing'}`}
        {...viewport.handlers}
        onClick={handleClick}
      >
        <StarBadgeSymbols />
        {geo ? (
          <>
            {/* The insets' boxes, framed like a printed atlas's */}
            {geo.frames.slice(1).map((frame, i) => (
              <rect
                key={i}
                x={frame.box[0]}
                y={frame.box[1]}
                width={frame.box[2]}
                height={frame.box[3]}
                className='fill-map-sea-ink/10 stroke-poster-brown stroke-[1.5] [stroke-dasharray:6_3]'
              />
            ))}
            <g className='stroke-[0.8]'>
              <StateShapes areas={geo.areas} statuses={statuses} />
            </g>
            <StateBadges areas={geo.areas} statuses={statuses} countryCode={code} viewport={viewport} />
            <StateNames areas={geo.areas} statuses={statuses} viewport={viewport} />
            <LandmarkModels geo={geo} models={models} viewport={viewport} />
            <Pins geo={geo} pins={pins} viewport={viewport} selectedId={selectedPinId} />
          </>
        ) : null}
      </svg>
      <MapKeyboardHint id={hintId}>
        Drag, or use the arrow keys, to move the map. Plus and minus zoom; 0 shows all of it. Every {info?.[0] || 'state'}
        {models.length ? ', landmark' : ''} and pin is also in the list, top left.
      </MapKeyboardHint>

      {/* The header, centred: back to the world, the country and how many of its states, a
          new pin; one slim row on wide screens, stacked on phones */}
      <div className='pointer-events-none absolute inset-x-16 top-3 grid justify-items-center nophone:inset-x-72'>
        <div ref={headerRef} className='ticket-edge paper-aged pointer-events-auto grid max-w-full justify-items-center gap-2 px-4 py-2 text-center text-poster-ink'>
          <div className='grid items-center justify-items-center gap-2 nophone:grid-cols-[auto_auto_auto] nophone:gap-4'>
            <div className='hidden nophone:grid'>{backToWorld}</div>
            {/* The flag beside the name and the count, the two lined up on the left */}
            <div className='grid grid-flow-col items-center gap-3'>
              <CountryFlag code={code} name={name} />
              <div className='grid justify-items-start text-left'>
                <h2 id={headingId} ref={headingRef} tabIndex={-1} className='font-travel text-2xl uppercase leading-tight tracking-wide text-colour6 outline-none'>
                  {name}
                </h2>
                {geo && info ? (
                  <p className='text-sm font-medium' data-state-count=''>
                    {marked} of {total} {total === 1 ? info[0] : info[1]} visited
                  </p>
                ) : null}
              </div>
            </div>
            <div className='hidden nophone:grid'>{addPin}</div>
            <div className='grid grid-flow-col justify-center gap-2 nophone:hidden'>
              {backToWorld}
              {addPin}
            </div>
          </div>
          {placing ? (
            <p role='status' className='text-sm'>
              Press the map where the pin goes.
            </p>
          ) : null}
          {statusError ? (
            <p role='alert' className='rounded-lg border px-3 py-1 text-sm tone-danger'>
              {statusError}
            </p>
          ) : null}
        </div>
      </div>

      {/* The list's stamp, top left on every screen (the goal tag steps aside while a country is open) */}
      {geo ? (
        <div className='absolute left-3 top-3'>
          <MapRoundButton label={`List the ${listWhat}`} pressed={listOpen} onClick={() => setListOpen((on) => !on)}>
            <FiList aria-hidden='true' />
          </MapRoundButton>
        </div>
      ) : null}

      {/* The list, a panel in the middle of the screen (the whole screen less a margin on phones) */}
      {listOpen && geo ? (
        <div className='pointer-events-none absolute inset-3 z-30 grid nophone:inset-x-0 nophone:inset-y-6 nophone:place-items-center'>
          <MapPanel title={listTitle} onClose={() => setListOpen(false)}>
            <CountryMapList
              areas={geo.areas}
              statuses={statuses}
              pins={pins}
              word={info}
              models={models}
              onOpenState={openStateFromList}
              onOpenModel={openModelFromList}
              onOpenPin={(id) => {
                dropCards();
                setListOpen(false);
                onOpenPin?.(id);
              }}
            />
          </MapPanel>
        </div>
      ) : null}

      {geo ? (
        <div className='pointer-events-none absolute bottom-3 right-3 grid'>
          <div className='pointer-events-auto'>
            <MapZoomControls viewport={viewport} resetLabel={`Show all of ${name}`} onReset={fitCountry} />
          </div>
        </div>
      ) : error ? (
        <div className='absolute inset-0 grid place-items-center' role='alert'>
          <p className='ticket-edge paper-aged px-4 py-3 text-sm'>{error}</p>
        </div>
      ) : (
        <CountryMapLoading name={name} />
      )}

      {popover ? (
        <StatePopover
          name={popover.name}
          status={statuses.get(popover.code) ?? null}
          x={popover.x}
          y={popover.y}
          canEdit={canEdit && !locked}
          onChange={(status) => changeStatus(popover.code, status)}
          onClose={closePopover}
        />
      ) : null}
      {modelCard && modelsById.has(modelCard.id) ? (
        <LandmarkModelCard
          key={modelCard.id}
          model={modelsById.get(modelCard.id)}
          stateName={modelCard.stateName}
          countryName={name}
          onClose={closePopover}
        />
      ) : null}
    </section>
  );
}

export default CountryMapView;
