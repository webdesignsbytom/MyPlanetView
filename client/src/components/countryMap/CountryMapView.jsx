import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
// Icons
import { FaArrowLeft, FaMapPin } from 'react-icons/fa';
// Hooks
import useMapViewport, { useViewportZoom } from '@/hooks/useMapViewport';
import useCountryMapData from '@/hooks/useCountryMapData';
// Components
import MapZoomControls from '@/components/map/MapZoomControls';
import { StarBadgeSymbols } from '@/components/map/StarBadge';
import StatePopover from './StatePopover';
import CountryMapLoading from './CountryMapLoading';
import CountryFlag from './CountryFlag';
// Utils
import { countsAsVisited, pastelFill } from '@/utils/map/visitStatus';
import { badgeIdFor, badgeRadius } from '@/utils/map/badges';
import { countryName } from '@/utils/map/countries';
import { placeOnCountryMap, positionOnCountryMap } from '@/utils/map/countryMapGeo';
import { MAP_WIDTH, REFERENCE_PX_PER_UNIT } from '@/utils/map/projection';

// A map pin, its tip at (0, 0) (MomentSpotPins' drop), about 3 units tall
const PIN_PATH = 'M0 0C-0.35-0.7-1-1.25-1-2A1 1 0 0 1 1-2C1-1.25 0.35-0.7 0 0Z';
const EMPTY_EXTENT = { top: 0, bottom: 2000 };
// Text at this size on screen (CSS px), and a pin this tall
const LABEL_PX = 11;
const PIN_PX = 30;
const CHAR_WIDTH = 0.55;

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
const StateBadges = memo(function StateBadges({ areas, statuses, countryCode, zoom }) {
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
const StateNames = memo(function StateNames({ areas, statuses, zoom }) {
  const size = LABEL_PX / (zoom * REFERENCE_PX_PER_UNIT);
  const r = badgeRadius(zoom);
  return (
    <g className='pointer-events-none fill-map-ink font-medium' fontSize={size} textAnchor='middle' aria-hidden='true'>
      {areas.map((area, i) =>
        area.name && area.name.length * CHAR_WIDTH * size <= area.width * 0.92 ? (
          <text key={area.code ?? i} x={area.at[0]} y={area.at[1] + (countsAsVisited(statuses.get(area.code)) ? r + size * 0.9 : size * 0.35)}>
            {area.name}
          </text>
        ) : null,
      )}
    </g>
  );
});

const Pins = memo(function Pins({ geo, pins, zoom, selectedId }) {
  const scale = PIN_PX / 3 / (zoom * REFERENCE_PX_PER_UNIT);
  return pins.map((pin) => {
    const at = placeOnCountryMap(geo, pin.latitude, pin.longitude);
    const selected = pin.id === selectedId;
    return (
      <g key={pin.id} data-pin={pin.id} transform={`translate(${at.x} ${at.y}) scale(${selected ? scale * 1.25 : scale})`} className='cursor-pointer'>
        <title>{pin.name}</title>
        <path d={PIN_PATH} strokeWidth={1.5} className={`${pin.hidden ? 'opacity-60' : ''} fill-poster-red stroke-poster-ink`} />
        <circle cy={-2} r={0.42} className='fill-poster-cream' />
      </g>
    );
  });
});

/**
 * A country opened on its own (18 Nov 2026, the user's wish; docs/API.md "Country maps"): the
 * country alone, as big as the screen allows, on its own projection, its far-off parts in
 * insets, its states or provinces drawn and coloured as the map stands with them, and its
 * pins. It takes the world map's place on the page (MapExperience), with its own pan and
 * zoom. A press on a state opens StatePopover (editors mark it); on a pin, `onOpenPin(id)`.
 * "Add a pin" (editors; `locked` while the email isn't verified) waits for a press on the
 * map, then `onNewPin({ latitude, longitude, countryCode })`. `pinsVersion` going up reloads
 * the pins; `onVisitsChanged` runs after a state's change brought its country's visit.
 */
function CountryMapView({ code, source, canEdit = false, locked = false, pinsVersion = 0, selectedPinId = null, onOpenPin, onNewPin, onVisitsChanged, onClose }) {
  const headingId = useId();
  const { geo, statuses, pins, error, setStatus } = useCountryMapData({ source, code, pinsVersion });
  const extent = geo ? { top: 0, bottom: geo.height } : EMPTY_EXTENT;
  const viewport = useMapViewport({ extent });
  const zoom = useViewportZoom(viewport);
  const boxRef = useRef(null);
  const headerRef = useRef(null);
  const [placing, setPlacing] = useState(false);
  const [popover, setPopover] = useState(null); // { code, name, x, y }
  const [statusError, setStatusError] = useState(null);
  const name = countryName(code);
  const info = geo?.word;
  const marked = geo ? geo.areas.filter((a) => a.code && ['VISITED', 'LIVED'].includes(statuses.get(a.code))).length : 0;
  const total = geo ? geo.areas.filter((a) => a.code).length : 0;

  // The whole country in view, as big as the screen allows below the header: from the
  // screen's left edge (the goal tag steps aside while a country is open: MapExperience) to
  // the toolbar's column on wide screens (18 Nov 2026, the user's wish: no wasted room)
  const fitCountry = useCallback(() => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!geo || !box?.width) return;
    const [x, y, w, h] = geo.view;
    const left = 16;
    const right = box.width >= 768 ? 88 : 16;
    const top = (headerRef.current?.getBoundingClientRect().bottom ?? box.top) - box.top + 10;
    const free = Math.max(box.height - top - 12, box.height / 3);
    const across = box.width - left - right;
    // Map units per pixel, so the country fits the free area's width and height (the canvas
    // is MAP_WIDTH across: the generator keeps every country small enough for that)
    const perPx = Math.min(Math.max(w / across, h / free), MAP_WIDTH / box.width);
    // The view's centre: the free area's, not the screen's
    const centreX = x + w / 2 + (box.width / 2 - (left + across / 2)) * perPx;
    const centreY = y + h / 2 + (box.height / 2 - (top + free / 2)) * perPx;
    viewport.focusOn(centreX, centreY, box.width * perPx);
  }, [geo, viewport]);
  useEffect(() => {
    if (!geo) return undefined;
    // After the viewport has taken the new extent (its own layout effect)
    const frame = requestAnimationFrame(fitCountry);
    return () => cancelAnimationFrame(frame);
  }, [geo, fitCountry]);

  // Escape: stop placing a pin, else close the popover
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (placing) setPlacing(false);
      else if (popover) setPopover(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [placing, popover]);

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
        setPopover(null);
        onOpenPin?.(pinId);
        return;
      }
      if (stateCode) {
        const area = geo.areas.find((a) => a.code === stateCode);
        setStatusError(null);
        setPopover({ code: stateCode, name: area?.name ?? stateCode, ...at });
      } else setPopover(null);
    });
  };

  const changeStatus = async (stateCode, status) => {
    setStatusError(null);
    try {
      const implied = await setStatus(stateCode, status);
      if (implied.length) onVisitsChanged?.();
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
        setPopover(null);
        setPlacing((on) => !on);
      }}
      className={`${placing ? 'btn-poster' : 'btn-paper'} grid-flow-col gap-2 [--btn-pad-x:0.75rem] [--btn-pad-y:0.25rem] [--btn-size:0.875rem] disabled:opacity-50`}
    >
      <FaMapPin aria-hidden='true' className='self-center' />
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
        tabIndex={0}
        className={`h-full w-full select-none [&_path]:[vector-effect:non-scaling-stroke] ${placing ? 'cursor-crosshair' : 'cursor-grab data-[grabbing]:cursor-grabbing'}`}
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
            <StateBadges areas={geo.areas} statuses={statuses} countryCode={code} zoom={zoom} />
            <StateNames areas={geo.areas} statuses={statuses} zoom={zoom} />
            <Pins geo={geo} pins={pins} zoom={zoom} selectedId={selectedPinId} />
          </>
        ) : null}
      </svg>

      {/* The header, centred: back to the world, the country and how many of its states, a
          new pin; one slim row on wide screens, stacked on phones */}
      <div className='pointer-events-none absolute inset-x-16 top-3 grid justify-items-center nophone:inset-x-72'>
        <div ref={headerRef} className='ticket-edge paper-aged pointer-events-auto grid max-w-full justify-items-center gap-2 px-4 py-2 text-center'>
          <div className='grid items-center justify-items-center gap-2 nophone:grid-cols-[auto_auto_auto] nophone:gap-4'>
            <div className='hidden nophone:grid'>{backToWorld}</div>
            <div className='grid justify-items-center'>
              <div className='grid grid-flow-col items-center gap-3'>
                <CountryFlag code={code} name={name} />
                <h2 id={headingId} className='font-travel text-2xl uppercase leading-tight tracking-wide text-colour6'>
                  {name}
                </h2>
              </div>
              {geo && info ? (
                <p className='text-sm font-medium' data-state-count=''>
                  {marked} of {total} {total === 1 ? info[0] : info[1]} visited
                </p>
              ) : null}
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
          onClose={() => setPopover(null)}
        />
      ) : null}
    </section>
  );
}

export default CountryMapView;
