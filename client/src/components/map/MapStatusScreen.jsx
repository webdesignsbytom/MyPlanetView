import React from 'react';
import { Link } from 'react-router-dom';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useMapTheme from '@/hooks/useMapTheme';
// Utils
import { mapStyleById } from '@/utils/map/mapStyles';
// Components
import StampLoading from './StampLoading';

// The full-screen map page while it loads, or when it can't open, on the sea. Loading, it's
// "Loading…" in plain words over passport stamps pressed one after another all over it (StampLoading;
// 17 Nov 2026, the user's wish: no card); when it can't open, a paper card (the map panels'
// travel paperwork). `children` adds a way out (a btn-poster link).
// `overlay`: over the map page while its panels' data loads (MapExperience), a layer of its
// own instead of the page's <main>.
// `styleId`: the viewer's map style, from the settings this browser kept, so the page's own
// screen is in the style from the start, sea and paperwork alike, not the animated sea's
// until the map arrives (19 Nov 2026, the user's wish). The overlay takes the map page's.
function MapStatusScreen({ loading = false, overlay = false, styleId, title, message, children }) {
  useMapTheme(styleId);
  const Shell = overlay ? 'div' : 'main';
  // data-map-loading: the e2e tests wait for the overlay to go before using the map
  const shellProps = overlay ? { 'data-map-loading': '' } : { id: 'main-content', tabIndex: -1, role: 'main' };
  return (
    <Shell
      {...shellProps}
      data-map-style={styleId === undefined ? undefined : mapStyleById(styleId).id}
      className={`grid place-items-center overflow-hidden bg-map-sea px-4 animate-ocean motion-reduce:animate-none ${
        overlay ? 'fixed inset-0 z-[60]' : 'relative min-h-dvh'
      }`}
    >
      {loading ? (
        // The words in the middle of the screen (17 Nov 2026, the user's wish), over the
        // stamps landing all over it (18 Nov 2026), with a glow of sea round them so a stamp
        // underneath never hides them
        <>
          <StampLoading />
          <div role='status' className='relative z-10 grid justify-items-center'>
            <span className='font-travel text-3xl uppercase tracking-wide text-map-sea-ink [text-shadow:0_0_6px_var(--color-map-sea),0_0_14px_var(--color-map-sea),0_0_24px_var(--color-map-sea)] sm:text-4xl'>
              {title || 'Loading…'}
            </span>
          </div>
        </>
      ) : (
        <div className='ticket-edge grid w-full max-w-md overflow-hidden bg-paper-cream text-center text-colour4'>
          <div className='paper-aged border-b-2 border-dashed border-poster-brown px-6 pb-4 pt-5'>
            <h1 className='font-travel text-3xl uppercase leading-tight tracking-wide text-poster-red-deep'>{title}</h1>
          </div>
          <div className='grid justify-items-center gap-4 px-6 py-6'>
            {message ? <p>{message}</p> : null}
            {children || (
              <Link to={HOME_PAGE_URL} className='btn-poster'>
                Back to the home page
              </Link>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

export default MapStatusScreen;
