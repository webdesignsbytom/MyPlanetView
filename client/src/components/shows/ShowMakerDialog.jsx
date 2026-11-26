import React, { useId, useState } from 'react';
import { createPortal } from 'react-dom';
// Api
import { createPhotoShow } from '@/api/photoShowsApi';
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
// Utils
import { SHOW_DEFAULT_SECONDS, SHOW_DEFAULT_TITLE, SHOW_SECONDS, SHOW_TITLE_MAX, photoCountWords, showOrder } from '@/utils/shows/showRules';

const ORDER_OPTIONS = [
  { value: 'taken', label: 'When they were taken, oldest first' },
  { value: 'chosen', label: 'The order I chose them in' },
];
const SECONDS_OPTIONS = SHOW_SECONDS.map((seconds) => ({ value: String(seconds), label: `${seconds} seconds` }));

/**
 * "Share a slideshow" (25 Nov 2026, the user's wish: "share just a slideshow of selected
 * photos"; docs/API.md "Photo slideshows"): a map's editors choose some of its photos and
 * videos (from `source`: the photo album's, a country's or a trip's list), a title
 * (`defaultTitle` to start with: the country's or trip's name), the order and how long each
 * photo stays up, then make its link. Whoever gets the link watches just those (ShowPage). Once
 * made, the link to copy, share or open, and "Make another". The map's shows are listed, renamed
 * and deleted in its share dialog (MapShowsSection). Portalled, so it sits over the whole page.
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
    } catch (err) {
      setError(err?.friendlyMessage || 'The slideshow couldn’t be made.');
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
    <Modal wide title='Share a slideshow' onClose={onClose}>
      {made ? (
        <div className='grid gap-4' data-show-made={made.code}>
          <p role='status' className='font-semibold'>
            “{made.title}” is ready: {photoCountWords(made.photoCount)}. Anyone with this link can watch it, and nothing else of your map.
          </p>
          <ShowLinkBox show={made} />
          <p className='text-sm'>Your map’s slideshows are in its sharing settings, where you can rename one, give it a new link or delete it.</p>
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
            Pick the photos to share. Whoever you send the link to watches just those, in a slideshow, without seeing the rest of your map
            or where anything was.
          </p>
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
            <Button type='submit' busy={busy} disabled={!chosen.length}>
              Make the link
            </Button>
          </div>
        </form>
      )}
    </Modal>,
    document.body,
  );
}

export default ShowMakerDialog;
