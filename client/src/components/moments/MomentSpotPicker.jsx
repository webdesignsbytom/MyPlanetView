import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// Hooks
import useMapViewport from '@/hooks/useMapViewport';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import WorldMap from '@/components/map/WorldMap';
import MapBackground from '@/components/map/MapBackground';
import MapZoomControls from '@/components/map/MapZoomControls';
// Utils
import { COUNTRY_BY_CODE, countryName } from '@/utils/map/countries';
import { COUNTRY_LABEL_WIDTH } from '@/utils/map/countryStyle';
import { mapExtent, positionFromMap, projectToMap } from '@/utils/map/projection';
import { spotText } from '@/utils/moments/momentSpots';

const EXTENT = mapExtent(true);
const STYLE = 'animated';

/**
 * Picking a moment's spot by tapping the map (the moment form's "Tap the map"): the world
 * map in a dialog, opened on the pin (`value`) or the moment's country, zoomable and
 * draggable; a tap puts the pin there (the projection inverted: positionFromMap), and "Use
 * this spot" hands it to `onPick({ latitude, longitude })`. The map draws countries, not
 * streets, so a tap is only as close as the zoom: the form links the spot to Google Maps to
 * check. Portalled, like the map's other dialogs over its panels.
 */
function MomentSpotPicker({ countryCode, value = null, onPick, onClose }) {
  const viewport = useMapViewport({ extent: EXTENT });
  const [draft, setDraft] = useState(value ? { latitude: value.latitude, longitude: value.longitude } : null);
  const opening = useRef({ value, countryCode });
  const name = countryName(countryCode);

  // Open on the pin, else on the country, about as wide as its main shape (after the map
  // has been measured, so the view has the box's shape)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const { value: pin, countryCode: code } = opening.current;
      const width = Math.max(40, (COUNTRY_LABEL_WIDTH[code] || 60) * 1.6);
      const at = pin ? projectToMap(pin.latitude, pin.longitude) : null;
      const country = COUNTRY_BY_CODE[code];
      if (at) viewport.focusOn(at.x, at.y, Math.min(width, 120));
      else if (country) viewport.focusOn(country.pinX, country.pinY, width);
    });
    return () => cancelAnimationFrame(frame);
  }, [viewport]);

  // A tap (not the end of a drag, nor half of a double-tap, which zooms): the map point
  // under it, from the SVG's own screen transform
  const place = (e) => {
    // Only a tap on the map itself: the zoom stamps sit in the same box (their icons are SVGs
    // too), and a key pressed on one is a click at 0,0 (19 Nov 2026, the audit: they moved the pin)
    if (e.detail === 0 || e.target.closest?.('button') || !e.target.closest?.('svg')) return;
    const ctm = e.currentTarget.querySelector('svg')?.getScreenCTM();
    if (!ctm) return;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    viewport.afterTap(() => {
      const spot = positionFromMap(point.x, point.y);
      if (spot) setDraft(spot);
    });
  };

  const spots = draft ? [{ id: 'draft', title: 'The moment’s spot', countryCode, ...draft }] : [];

  return createPortal(
    <Modal title={`Pin it in ${name}`} onClose={onClose} wide>
      <div className='grid gap-3'>
        <p className='text-sm'>
          Tap the spot. Zoom in to get closer: the map shows countries, not streets, so check the pin on Google Maps after.
        </p>
        {/* As tall as the screen allows, so the buttons below stay in the dialog */}
        <div data-map-style={STYLE} className='relative h-[min(50svh,32rem)] min-h-56 w-full overflow-hidden border-2 border-poster-brown bg-map-sea' onClick={place}>
          <MapBackground styleId={STYLE} animatedSea={false} />
          <div className='absolute inset-0'>
            <WorldMap viewport={viewport} seaDepths selectedCode={countryCode} momentSpots={spots} label={`Map of ${name}: tap to put the pin there`} />
          </div>
          <div className='absolute bottom-2 right-2'>
            <MapZoomControls viewport={viewport} />
          </div>
        </div>
        <p role='status' className='text-sm font-medium'>
          {draft ? `The pin is at ${spotText(draft)}.` : 'No pin yet.'}
        </p>
        <div className='grid grid-row justify-end gap-2'>
          <Button quiet onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onPick(draft)} disabled={!draft}>
            Use this spot
          </Button>
        </div>
      </div>
    </Modal>,
    document.body,
  );
}

export default MomentSpotPicker;
