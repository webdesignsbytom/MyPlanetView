import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
// Api
import { createPhotoShow, getMapPhotoShows } from '@/api/photoShowsApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import RadioGroup from '@/components/ui/RadioGroup';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import ShowPhotoPicker from './ShowPhotoPicker';
import ShowLinkBox from './ShowLinkBox';
// Constants
import { PRICING_PAGE_URL } from '@/utils/constants/routes';
import { isTopPlan } from '@/utils/constants/plans';
// Utils
import {
  SHOW_DEFAULT_SECONDS,
  SHOW_DEFAULT_TITLE,
  SHOW_SECONDS,
  SHOW_TITLE_MAX,
  photoCountWords,
  showOrder,
  showsFullMessage,
  showsSavedWords,
} from '@/utils/shows/showRules';

const ORDER_OPTIONS = [
  { value: 'taken', label: 'When they were taken, oldest first' },
  { value: 'chosen', label: 'The order I chose them in' },
];
const SECONDS_OPTIONS = SHOW_SECONDS.map((seconds) => ({ value: String(seconds), label: `${seconds} seconds` }));

// The note when the map has saved as many as its plan keeps
const FULL_NOTE = 'rounded-lg border px-3 py-2 text-sm tone-warn';

/**
 * "Make a slideshow" (25 Nov 2026, the user's wish: "share just a slideshow of selected
 * photos"; saved since 27 Nov 2026, the user's wish: "we need to be able to save slide shows":
 * docs/API.md "Photo slideshows"): a map's editors choose some of its photos and videos (from
 * `source`: the photo album's, a country's or a trip's list), a title (`defaultTitle` to start
 * with: the country's or trip's name), the order and how long each photo stays up, then save it
 * on the map with a link of its own. Whoever gets the link watches just those (ShowPage). A map
 * keeps 2, 10 or 25 by its plan: the form says how many are saved, and once full says so before
 * any photo is chosen. Once saved, the link to copy, share or open, and "Make another". The
 * map's shows are played, renamed and deleted in the photo album's "Saved slideshows" and its
 * share dialog (MapShowsSection). Portalled, so it sits over the whole page.
 */
function ShowMakerDialog({ mapId, source, defaultTitle = '', onClose }) {
  const uid = useId();
  const [title, setTitle] = useState(defaultTitle);
  const [chosen, setChosen] = useState([]);
  const [order, setOrder] = useState('taken');
  const [seconds, setSeconds] = useState(SHOW_DEFAULT_SECONDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [made, setMade] = useState(null);
  // { count, limit, plan } once the map's saved shows are read; null until then (the server checks anyway)
  const [room, setRoom] = useState(null);

  useEffect(() => {
    let alive = true;
    getMapPhotoShows(mapId)
      .then((reply) => {
        if (alive && Number.isInteger(reply.limit)) setRoom({ count: (reply.shows || []).length, limit: reply.limit, plan: reply.plan });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mapId]);
  const full = Boolean(room) && room.count >= room.limit;

  const make = async (e) => {
    e.preventDefault();
    if (!chosen.length) {
      setError('Choose at least one photo for the slideshow.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { show } = await createPhotoShow(mapId, { title: title.trim() || SHOW_DEFAULT_TITLE, photoIds: showOrder(chosen, order), seconds });
      setMade(show);
      setRoom((was) => was && { ...was, count: was.count + 1 });
    } catch (err) {
      setError(err?.friendlyMessage || 'The slideshow couldn’t be saved.');
    } finally {
      setBusy(false);
    }
  };
  const again = () => {
    setMade(null);
    setChosen([]);
    setTitle(defaultTitle);
  };

  return createPortal(
    <Modal wide title='Make a slideshow' onClose={onClose}>
      {made ? (
        <div className='grid gap-4' data-show-made={made.code}>
          <p role='status' className='font-semibold'>
            “{made.title}” is saved: {photoCountWords(made.photoCount)}. Anyone with this link can watch it, and nothing else of your map.
          </p>
          <ShowLinkBox show={made} />
          <p className='text-sm'>
            It’s kept in the photo album’s “Saved slideshows”, where you can play it again, rename it, give it a new link or delete it.
          </p>
          <div className='grid gap-2 sm:grid-cols-2'>
            <Button quiet onClick={again}>
              Make another
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={make} className='grid gap-5' noValidate aria-label='New slideshow'>
          <p className='text-sm'>
            Pick the photos for it. It’s saved on this map with a link of its own: whoever you send the link to watches just those, without
            seeing the rest of your map or where anything was.
          </p>
          {full ? (
            <div className={FULL_NOTE} data-shows-full=''>
              <p>{showsFullMessage({ count: room.count, cap: room.limit, planId: room.plan })}</p>
              <p>They’re in the photo album, under “Saved slideshows”.</p>
              {isTopPlan(room.plan) ? null : (
                <Link to={PRICING_PAGE_URL} target='_blank' rel='noopener noreferrer' className='font-semibold text-poster-red-deep underline underline-offset-2'>
                  See the plans
                </Link>
              )}
            </div>
          ) : room ? (
            <p className='text-sm' data-shows-saved=''>
              {showsSavedWords(room.count, room.limit)}
            </p>
          ) : null}
          <FormField id={`${uid}-title`} label='Title' align='start'>
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={SHOW_TITLE_MAX} placeholder={SHOW_DEFAULT_TITLE} />
          </FormField>
          <ShowPhotoPicker source={source} chosen={chosen} onChange={setChosen} />
          <div className='grid gap-4 sm:grid-cols-2'>
            <RadioGroup
              legend='Play them'
              name={`${uid}-order`}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              options={ORDER_OPTIONS}
              className='grid content-start gap-y-2 [&>legend]:text-left'
            />
            <FormField id={`${uid}-seconds`} label='Each photo stays up for' align='start'>
              <PlainOptionSelect value={String(seconds)} onChange={(e) => setSeconds(Number(e.target.value))} options={SECONDS_OPTIONS} />
            </FormField>
          </div>
          <InlineAlert>{error}</InlineAlert>
          <div className='grid gap-2 sm:grid-cols-2'>
            <Button quiet onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' busy={busy} disabled={!chosen.length || full}>
              Save the slideshow
            </Button>
          </div>
        </form>
      )}
    </Modal>,
    document.body,
  );
}

export default ShowMakerDialog;
