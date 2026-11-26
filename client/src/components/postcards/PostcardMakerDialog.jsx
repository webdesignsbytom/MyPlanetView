import React, { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
// Api
import { getMyPostcards, sendPostcard } from '@/api/postcardsApi';
// Hooks
import { useAuth } from '@/auth/AuthContext';
import useLandmarks from '@/hooks/useLandmarks';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
import PostcardPictureFields from './PostcardPictureFields';
import PostcardStylePicker from './PostcardStylePicker';
import PostcardView from './PostcardView';
import PostcardLinkBox from './PostcardLinkBox';
// Utils
import { POSTCARD_DEFAULT_STYLE, POSTCARD_LIMITS } from '@/utils/postcards/postcardRules';

// The preview waits this long after the last key before it's drawn again
const PREVIEW_DELAY_MS = 400;

const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || '';

/** `value`, once it has stopped changing for `ms`. */
function useSettled(value, ms) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

/**
 * "Send a postcard" (26 Nov 2026, the user's wish: "while you're on a trip you can send a post
 * card. With a message, selection of images, and a selection of styles. Or upload your own photo.
 * Cool stamps and address area. You send them with a share link. They are not part of the map";
 * docs/API.md "Postcards"). From a place's ticket (`countryCode`, `placeName`): what goes on the
 * front (PostcardPictureFields; a landmark's or your own photo on a paid plan, `paidCards` from
 * the server), the style, the message, who it's to and from, and the card itself as it will
 * look, turned over to see the back. Sending makes its link (PostcardLinkBox). Nothing of it goes
 * on the map. Portalled, so it sits over the whole page.
 */
function PostcardMakerDialog({ countryCode, placeName, photoFilters = null, onClose }) {
  const uid = useId();
  const { user } = useAuth();
  const { landmarks } = useLandmarks(countryCode);
  const [paidCards, setPaidCards] = useState(false);
  const [kind, setKind] = useState('COUNTRY');
  const [landmarkId, setLandmarkId] = useState(null);
  const [picture, setPicture] = useState(null);
  const [style, setStyle] = useState(POSTCARD_DEFAULT_STYLE);
  const [message, setMessage] = useState('');
  const [toName, setToName] = useState('');
  const [fromName, setFromName] = useState(() => firstName(user?.name));
  const [side, setSide] = useState('front');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [made, setMade] = useState(null);

  useEffect(() => {
    let alive = true;
    getMyPostcards()
      .then((mine) => alive && setPaidCards(Boolean(mine.paidCards)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const landmark = useMemo(() => landmarks.find((l) => l.id === landmarkId) || null, [landmarks, landmarkId]);
  // Each its own value, so a settled one stays the same between renders
  const words = {
    message: useSettled(message, PREVIEW_DELAY_MS),
    toName: useSettled(toName, PREVIEW_DELAY_MS),
    fromName: useSettled(fromName, PREVIEW_DELAY_MS),
  };
  const draft = useMemo(
    () => ({
      kind,
      countryCode,
      landmark: kind === 'LANDMARK' ? landmark : null,
      pictureUrl: kind === 'PHOTO' ? picture?.previewUrl || null : null,
      style,
      message: words.message.trim() || 'Your message goes here.',
      toName: words.toName.trim() || null,
      fromName: words.fromName.trim() || null,
      sentAt: new Date().toISOString().slice(0, 10),
    }),
    [kind, countryCode, landmark, picture, style, words.message, words.toName, words.fromName],
  );

  const chooseKind = (next) => {
    setKind(next);
    setError('');
  };
  const send = async (e) => {
    e.preventDefault();
    if (kind === 'LANDMARK' && !landmarkId) return setError('Choose the landmark for the front.');
    if (kind === 'PHOTO' && !picture?.key) return setError('Choose the photo for the front.');
    if (!message.trim()) return setError('Write a message on the back of your postcard.');
    setBusy(true);
    setError('');
    try {
      const { postcard } = await sendPostcard({
        kind,
        countryCode,
        landmarkId: kind === 'LANDMARK' ? landmarkId : undefined,
        pictureKey: kind === 'PHOTO' ? picture.key : undefined,
        style,
        message,
        toName: toName.trim() || undefined,
        fromName: fromName.trim() || undefined,
      });
      setMade(postcard);
    } catch (err) {
      setError(err?.friendlyMessage || 'The postcard couldn’t be sent.');
    } finally {
      setBusy(false);
    }
    return undefined;
  };
  const again = () => {
    setMade(null);
    setMessage('');
    setToName('');
    setPicture(null);
    setSide('front');
  };
  const cardName = made?.toName ? `your postcard to ${made.toName}` : 'your postcard';

  return createPortal(
    <Modal wide title={`Send a postcard from ${placeName}`} onClose={onClose}>
      {made ? (
        <div className='grid gap-4' data-postcard-made={made.code}>
          <p role='status' className='font-semibold'>
            Your postcard is ready. Send its link to {made.toName || 'whoever it’s for'}: they’ll see the card, turn it over and can keep it forever.
          </p>
          <PostcardView card={made} />
          <PostcardLinkBox postcard={made} name={cardName} />
          <p className='text-sm'>It isn’t part of your map. Your postcards are listed on your account page, where you can give one a new link or delete it.</p>
          <div className='grid gap-2 sm:grid-cols-2'>
            <Button quiet onClick={again}>
              Send another
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={send} className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start' noValidate aria-label='New postcard'>
          <div className='grid gap-5'>
            <PostcardPictureFields
              code={countryCode}
              kind={kind}
              onKind={chooseKind}
              landmarkId={landmarkId}
              onLandmark={setLandmarkId}
              picture={picture}
              onPicture={setPicture}
              paidCards={paidCards}
              photoFilters={photoFilters}
              disabled={busy}
            />
            <PostcardStylePicker value={style} onChange={setStyle} disabled={busy} />
            <FormField id={`${uid}-message`} label='Your message' align='start'>
              <TextAreaInput
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setSide('back');
                }}
                maxLength={POSTCARD_LIMITS.message}
                rows={5}
                placeholder='Wish you were here!'
              />
            </FormField>
            <p className='text-xs' aria-live='polite' data-postcard-count={message.length}>
              {message.length} of {POSTCARD_LIMITS.message} characters
            </p>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField id={`${uid}-to`} label='To' align='start'>
                <TextInput value={toName} onChange={(e) => setToName(e.target.value)} maxLength={POSTCARD_LIMITS.toName} placeholder='Gran' />
              </FormField>
              <FormField id={`${uid}-from`} label='From' align='start'>
                <TextInput value={fromName} onChange={(e) => setFromName(e.target.value)} maxLength={POSTCARD_LIMITS.fromName} />
              </FormField>
            </div>
            <p className='text-xs'>The address lines are only for show: just a name, never an address. Whoever has the link can see the card.</p>
          </div>
          <div className='grid gap-4'>
            <PostcardView card={draft} side={side} onTurn={() => setSide((s) => (s === 'front' ? 'back' : 'front'))} />
            <InlineAlert>{error}</InlineAlert>
            <div className='grid gap-2 sm:grid-cols-2'>
              <Button quiet onClick={onClose}>
                Cancel
              </Button>
              <Button type='submit' busy={busy}>
                Send the postcard
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>,
    document.body,
  );
}

export default PostcardMakerDialog;
