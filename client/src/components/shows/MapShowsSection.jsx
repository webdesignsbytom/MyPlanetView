import React, { Suspense, useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
// Icons
import { FaPlay } from 'react-icons/fa';
// Api
import { deletePhotoShow, getMapPhotoShows, resetPhotoShowLink, updatePhotoShow } from '@/api/photoShowsApi';
// Components
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import { Slideshow } from '@/components/map/lazyMapPanels';
import ShowLinkBox from './ShowLinkBox';
// Utils
import { SHOW_TITLE_MAX, photoCountWords, showsSavedWords } from '@/utils/shows/showRules';
import { formatDay } from '@/utils/functions/dates';

// One show: its title and size, Play, its link, and Rename, New link and Delete (each of the last two asked first)
function ShowRow({ show, locked, onChanged, onDeleted }) {
  const uid = useId();
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(show.title);
  const [asking, setAsking] = useState(null); // 'reset' | 'delete'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [playing, setPlaying] = useState(false);

  const run = async (work, done) => {
    setBusy(true);
    setError('');
    setNote('');
    try {
      await work();
      done?.();
    } catch (err) {
      setError(err?.friendlyMessage || 'That didn’t work. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const rename = (e) => {
    e.preventDefault();
    run(async () => onChanged((await updatePhotoShow(show.id, { title })).show), () => setRenaming(false));
  };
  const relink = () =>
    run(
      async () => onChanged((await resetPhotoShowLink(show.id)).show),
      () => {
        setAsking(null);
        setNote('A new link is ready. The old one no longer works.');
      },
    );
  const remove = () => run(async () => {
    await deletePhotoShow(show.id);
    onDeleted(show.id);
  });

  return (
    <li className='grid gap-2 border-b border-dashed border-poster-brown/40 pb-4' data-photo-show={show.id}>
      <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
        <p className='grid'>
          <span className='font-semibold'>{show.title}</span>
          <span className='text-xs'>
            {photoCountWords(show.photoCount)} · made {formatDay(show.createdAt)}
          </span>
        </p>
        {/* As whoever has the link watches it: its photos in its order, at its speed */}
        <Button onClick={() => setPlaying(true)} ariaLabel={`Play ${show.title}`}>
          <FaPlay aria-hidden='true' className='self-center text-sm' />
          <span>Play</span>
        </Button>
      </div>
      <ShowLinkBox show={show} />
      {renaming ? (
        <form onSubmit={rename} className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end' noValidate>
          <FormField id={`${uid}-title`} label='New title' align='start'>
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={SHOW_TITLE_MAX} />
          </FormField>
          <Button type='submit' busy={busy} disabled={!title.trim()}>
            Save
          </Button>
          <Button
            quiet
            onClick={() => {
              setRenaming(false);
              setTitle(show.title);
            }}
          >
            Cancel
          </Button>
        </form>
      ) : asking ? (
        <div className='grid gap-2 rounded-lg border px-3 py-2 text-sm tone-warn' role='group' aria-label={asking === 'reset' ? 'Make a new link?' : 'Delete this slideshow?'}>
          <p>
            {asking === 'reset'
              ? 'Make a new link? Anyone using the old one won’t be able to watch it any more.'
              : `Delete “${show.title}”? Its link stops working. Your photos stay on the map.`}
          </p>
          <div className='grid grid-row gap-2'>
            <Button danger busy={busy} onClick={asking === 'reset' ? relink : remove}>
              {asking === 'reset' ? 'Make a new link' : 'Delete it'}
            </Button>
            <Button quiet onClick={() => setAsking(null)}>
              Keep it as it is
            </Button>
          </div>
        </div>
      ) : (
        <div className='grid grid-row justify-start gap-4 text-sm'>
          <button type='button' disabled={locked} onClick={() => setRenaming(true)} className='underline underline-offset-2 disabled:opacity-50'>
            Rename
          </button>
          <button type='button' disabled={locked} onClick={() => setAsking('reset')} className='underline underline-offset-2 disabled:opacity-50'>
            New link
          </button>
          <button type='button' disabled={locked} onClick={() => setAsking('delete')} className='underline underline-offset-2 disabled:opacity-50'>
            Delete
          </button>
        </div>
      )}
      <InlineAlert>{error}</InlineAlert>
      {note ? (
        <p role='status' className='text-sm'>
          {note}
        </p>
      ) : null}
      {/* Over the whole page, the dialog it's listed in too */}
      {playing
        ? createPortal(
            <Suspense fallback={null}>
              <Slideshow
                source={{ showCode: show.code }}
                title={show.title}
                intro={show.title}
                photoCount={show.photoCount}
                startSpeed={show.seconds}
                onClose={() => setPlaying(false)}
              />
            </Suspense>,
            document.body,
          )
        : null}
    </li>
  );
}

/**
 * A map's saved slideshows of chosen photos, each with its own link (25 Nov 2026; saved, 2, 10
 * or 25 by the map's plan, since 27 Nov 2026, the user's wish; docs/API.md "Photo slideshows"),
 * for its editors, in the photo album's "Saved slideshows" (SavedShowsDialog) and the map's
 * share dialog: how many are saved of what the map keeps, then each one's Play (the slideshow
 * over the page, as its link plays it), its link to copy, share or open, and Rename, New link
 * (the old one stops working) and Delete. They're made from the photo album, a country's ticket
 * or a trip's photos ("Make a slideshow"). `locked`: an unverified email address, so the changes
 * wait (the server refuses them). `headed`: its own "Slideshows" heading (not in a dialog that
 * has one).
 */
function MapShowsSection({ mapId, locked = false, headed = true }) {
  const [shows, setShows] = useState(null);
  const [limit, setLimit] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    getMapPhotoShows(mapId)
      .then((reply) => {
        setShows(reply.shows || []);
        setLimit(Number.isInteger(reply.limit) ? reply.limit : null);
      })
      .catch((err) => setError(err?.friendlyMessage || 'The slideshows couldn’t be loaded.'));
  }, [mapId]);
  useEffect(load, [load]);

  const changed = (show) => setShows((list) => list.map((s) => (s.id === show.id ? show : s)));
  const deleted = (id) => setShows((list) => list.filter((s) => s.id !== id));

  return (
    <section
      className='grid gap-3'
      {...(headed ? { 'aria-labelledby': 'photo-shows-heading' } : { 'aria-label': 'Saved slideshows' })}
      data-map-shows
    >
      {headed ? (
        <h3 id='photo-shows-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
          Slideshows
        </h3>
      ) : null}
      {shows && limit !== null ? (
        <p className='text-sm' data-shows-count=''>
          {showsSavedWords(shows.length, limit)}
        </p>
      ) : null}
      {error ? (
        <InlineAlert>{error}</InlineAlert>
      ) : !shows ? (
        <div className='grid place-items-center py-2' role='status'>
          <LoadingSpinner />
          <span className='sr-only'>Loading the slideshows…</span>
        </div>
      ) : shows.length ? (
        <ul className='grid gap-4'>
          {shows.map((show) => (
            <ShowRow key={show.id} show={show} locked={locked} onChanged={changed} onDeleted={deleted} />
          ))}
        </ul>
      ) : (
        <p className='text-sm'>
          No slideshows saved yet. To make one of some of your photos, choose “Make a slideshow” in the photo album, a country’s photos or a
          trip’s.
        </p>
      )}
    </section>
  );
}

export default MapShowsSection;
