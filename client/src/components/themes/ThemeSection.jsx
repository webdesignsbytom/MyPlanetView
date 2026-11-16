import React, { useId, useState } from 'react';
import { createPortal } from 'react-dom';
// Icons
import { FaCalendarAlt } from 'react-icons/fa';
// Hooks
import useMapThemes from '@/hooks/useMapThemes';
// Components
import MapActionButton from '@/components/map/MapActionButton';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
import InlineAlert from '@/components/common/InlineAlert';
import ThemeAlbumDialog from './ThemeAlbumDialog';
import ThemePhotoPicker from './ThemePhotoPicker';
// Utils
import { lastDayLabel, monthLabel, photoCount } from '@/utils/themes/themeWords';

/**
 * The monthly photo theme in the badges and goals panel (docs/API.md, "Photo themes";
 * docs/FEATURE-PLAN.md, "Monthly photo themes"): this month's theme as a noticeboard card,
 * how many of the map's photos are in it, and for the owner and editors "Choose photos"
 * (any photo on the map, from any date; `locked` is told to verify first). Each theme the
 * map has photos in is an album, opened over the page (a portal) with its photos. Viewers
 * and share links (`shareCode`) see the albums. `onChanged` after photos go in or out (the
 * theme badges may follow).
 */
function ThemeSection({ mapId = null, shareCode = null, canEdit = false, locked = false, onChanged }) {
  const headingId = useId();
  const { themes, loading, error, reload } = useMapThemes({ mapId, shareCode });
  const [album, setAlbum] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const current = themes?.current ?? null;
  const past = (themes?.albums ?? []).filter((a) => !a.running);
  const changed = () => {
    reload();
    onChanged?.();
  };

  return (
    <section className='grid gap-3' aria-labelledby={headingId}>
      <h3 id={headingId} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Monthly theme
      </h3>
      <InlineAlert>{error}</InlineAlert>
      {loading && !themes ? <p className='text-sm opacity-80'>Loading the theme…</p> : null}

      {themes && !current ? <p className='text-sm'>There’s no theme this month.</p> : null}
      {current ? (
        <div className='paper-aged grid gap-2 border-2 border-dashed border-poster-brown/60 px-4 py-3'>
          <p className='grid grid-cols-reg items-center gap-2 text-xs font-semibold uppercase tracking-wide text-colour9'>
            <FaCalendarAlt aria-hidden='true' />
            <span>{monthLabel(current.month)}, until {lastDayLabel(current.endsAt)}</span>
          </p>
          <p className='font-travel text-2xl uppercase leading-tight tracking-wide text-poster-red-deep'>{current.title}</p>
          {current.blurb ? <p className='text-sm'>{current.blurb}</p> : null}
          <p className='text-sm font-medium'>
            {photoCount(current.count)} from this map
            {current.entriesLeft !== undefined && current.count ? ` (${current.entriesLeft} more can go in)` : ''}
          </p>
          <div className='grid grid-row-wrap gap-2'>
            {canEdit && current.entriesLeft > 0 ? (
              <MapActionButton onClick={() => setChoosing(true)}>Choose photos</MapActionButton>
            ) : null}
            {current.count ? (
              <MapActionButton quiet onClick={() => setAlbum(current)}>
                Open the album
              </MapActionButton>
            ) : null}
          </div>
          {canEdit && current.entriesLeft === 0 ? (
            <p className='text-xs'>That’s the most one map can enter. Take a photo out to choose another.</p>
          ) : null}
          {locked ? <VerifyFirstNote action='enter photos in the theme' /> : null}
          {!canEdit && !locked && !current.count ? (
            <p className='text-xs opacity-80'>No photos from this map in it yet.</p>
          ) : null}
        </div>
      ) : null}

      {past.length ? (
        <div className='grid gap-1.5'>
          <p className='text-sm font-medium'>Past themes</p>
          <ul className='grid gap-1'>
            {past.map((theme) => (
              <li key={theme.id}>
                <button
                  type='button'
                  onClick={() => setAlbum(theme)}
                  className='text-left text-sm underline underline-offset-2 hover:no-underline'
                >
                  {monthLabel(theme.month)}: {theme.title} ({photoCount(theme.count).toLowerCase()})
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {album
        ? createPortal(
            <ThemeAlbumDialog
              theme={album}
              mapId={mapId}
              shareCode={shareCode}
              canEdit={canEdit}
              locked={locked}
              onChanged={changed}
              onClose={() => setAlbum(null)}
            />,
            document.body,
          )
        : null}
      {choosing && current
        ? createPortal(
            <ThemePhotoPicker
              theme={current}
              mapId={mapId}
              onEntered={changed}
              onClose={() => setChoosing(false)}
            />,
            document.body,
          )
        : null}
    </section>
  );
}

export default ThemeSection;
