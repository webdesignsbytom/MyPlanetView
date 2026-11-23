import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
// Api
import { openShareCode } from '@/api/travelApi';
// Constants
import { EMBED_PAGE_URL, sharedPassportPath, sharedPath } from '@/utils/constants/routes';
// Hooks
import useMapViewport from '@/hooks/useMapViewport';
import useMapTheme from '@/hooks/useMapTheme';
import { SplitUkProvider } from '@/hooks/useSplitUk';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import WorldMap from '@/components/map/WorldMap';
import MapBackground from '@/components/map/MapBackground';
import MapDesignStyle from '@/components/map/MapDesignStyle';
import MapZoomControls from '@/components/map/MapZoomControls';
// Utils
import { mapExtent } from '@/utils/map/projection';
import { mapStyleById, shownStyle } from '@/utils/map/mapStyles';
import { designFor, shownDesign } from '@/utils/map/mapDesign';
import { MADE_WITH_TEXT, madeWithPath } from '@/utils/sharing/embedCode';

const word = (n, one, many) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

// The link back on every embedded map: our home page, in a new tab (the frame is someone
// else's page)
function MadeWith() {
  return (
    <a href={madeWithPath('frame')} target='_blank' rel='noopener' className='font-semibold text-poster-red-deep underline underline-offset-2' data-made-with>
      {MADE_WITH_TEXT}
    </a>
  );
}

// The embedded map itself, once the link has opened: the map in its own style and design,
// read only, panned and zoomed with a finger, a drag or the zoom stamps (the wheel is left to
// the page it sits in, so scrolling past it never gets stuck)
function EmbeddedMap({ map, code }) {
  const styleId = shownStyle(map, 'animated');
  const style = mapStyleById(styleId);
  const design = shownDesign(designFor(map, styleId));
  useMapTheme(styleId);
  const extent = useMemo(() => mapExtent(true), []);
  const viewport = useMapViewport({ extent, wheelZoom: false });
  const visitsByCode = useMemo(() => Object.fromEntries((map.visits || []).map((v) => [v.countryCode, v.status])), [map.visits]);
  const stats = map.stats || {};

  return (
    <SplitUkProvider value={Boolean(map.splitUk)}>
      <div
        data-map-style={styleId}
        {...(design ? { 'data-map-design': '' } : {})}
        className='relative grid h-dvh grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-map-sea'
      >
        {design ? <MapDesignStyle design={design} /> : null}
        <main id='main-content' tabIndex={-1} aria-labelledby='embed-title' className='relative min-h-0 outline-none'>
          <h1 id='embed-title' className='sr-only'>
            {map.name}
          </h1>
          <MapBackground styleId={styleId} animatedSea={false} pictureUrl={design?.picture?.url ?? null} />
          <div className='absolute inset-0'>
            <WorldMap
              viewport={viewport}
              seaDepths={!style.background && !design?.picture}
              visitsByCode={visitsByCode}
              showGrid
              gridColoured={Boolean(design?.grid)}
              label={`${map.name}: world map`}
            />
          </div>
          <div className='pointer-events-none absolute bottom-3 right-3 grid'>
            <div className='pointer-events-auto'>
              <MapZoomControls viewport={viewport} />
            </div>
          </div>
        </main>
        <footer className='paper-aged grid gap-x-4 gap-y-1 border-t-2 border-poster-brown px-3 py-2 text-sm text-poster-ink sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
          <p className='grid min-w-0'>
            <span className='truncate font-semibold'>{map.name}</span>
            <span className='text-xs' data-embed-stats>
              {word(stats.countries ?? 0, 'country', 'countries')} · {word(stats.continents ?? 0, 'continent', 'continents')}
              {' · '}
              <a href={sharedPath(code)} target='_blank' rel='noopener' className='underline underline-offset-2'>
                Open the map
              </a>
              {' · '}
              <a href={sharedPassportPath(code)} target='_blank' rel='noopener' className='underline underline-offset-2'>
                Passport
              </a>
            </span>
          </p>
          <MadeWith />
        </footer>
      </div>
    </SplitUkProvider>
  );
}

/**
 * A map on someone's own website (23 Nov 2026, the user's wish; utils/sharing/embedCode.js):
 * framed from /embed/:code, the map alone, through its share link (link access on; no
 * sign-in, no cookies, no analytics, no cookie pop-up: App leaves it out here), with its name,
 * its counts, links to open it in full, and "Made with My Planet View" under it. A link that no
 * longer works, or a trip's, says so, still with the link back.
 */
function EmbedPage() {
  const { code } = useParams();
  const [state, setState] = useState({ map: null, error: '' });

  useEffect(() => {
    let alive = true;
    setState({ map: null, error: '' });
    openShareCode(code)
      .then((shared) => {
        if (!alive) return;
        if (shared.resource !== 'map' || !shared.map) setState({ map: null, error: 'Only a whole map can be shown here.' });
        else setState({ map: shared.map, error: '' });
      })
      .catch((err) => {
        if (!alive) return;
        setState({
          map: null,
          error: err?.response?.status === 404 ? 'This map isn’t shared any more.' : 'This map couldn’t be loaded just now.',
        });
      });
    return () => {
      alive = false;
    };
  }, [code]);

  if (state.map) {
    return (
      <>
        <AppPageHead route={EMBED_PAGE_URL} title={state.map.name} />
        <EmbeddedMap map={state.map} code={code} />
      </>
    );
  }
  return (
    <>
      <AppPageHead route={EMBED_PAGE_URL} />
      <main id='main-content' tabIndex={-1} className='paper-aged grid h-dvh place-content-center gap-2 p-4 text-center text-poster-ink outline-none'>
        <h1 className='font-travel text-xl uppercase tracking-wide'>Travel map</h1>
        <p role={state.error ? 'alert' : 'status'} className='text-sm'>
          {state.error || 'Loading the map…'}
        </p>
        <MadeWith />
      </main>
    </>
  );
}

export default EmbedPage;
