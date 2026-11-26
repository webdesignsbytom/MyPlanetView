import React, { useEffect, useId, useState } from 'react';
// Components
import Button from '@/components/common/Button';
import FormField from '@/components/ui/FormField';
import TextAreaInput from '@/components/ui/TextAreaInput';
// Utils
import { drawShareCard } from '@/utils/shareCard/drawShareCard';
import { canShareImages, downloadImage, shareImage } from '@/utils/shareCard/shareImage';
import { cardMapKind } from '@/utils/shareCard/cardMapView';

// Words to go with a picture are kept to a post's length
const WORDS_MAX = 500;

// A share card, made and shown (utils/shareCard/): drawn in the browser when it's shown,
// then handed to the share sheet (Instagram, WhatsApp…) where the browser can, or saved.
// `card`: drawShareCard's options plus `fileName` and `shareText` (keep the object the
// same between renders: a new one draws it again). In ShareCardDialog, the award's share
// dialog and the year recap. Shown as the post will look (25 Nov 2026, the user's wish: "a
// preview of the post"): the picture with its words under it, which can be changed and are
// sent with it, or copied (Instagram leaves out words handed to it, so they're pasted there).
function ShareCardPreview({ card }) {
  const [picture, setPicture] = useState({ blob: null, url: '', error: '' });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [words, setWords] = useState(card.shareText || '');
  // A new card starts with its own words
  const [wordsFor, setWordsFor] = useState(card);
  if (wordsFor !== card) {
    setWordsFor(card);
    setWords(card.shareText || '');
  }
  const wordsId = useId();
  const sharable = canShareImages();

  useEffect(() => {
    let cancelled = false;
    let url = '';
    drawShareCard(card)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPicture({ blob, url, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setPicture({ blob: null, url: '', error: err?.message || 'The picture couldn’t be made.' });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [card]);

  const share = async () => {
    setBusy(true);
    setNote('');
    try {
      await shareImage(picture.blob, { fileName: card.fileName, title: card.title, text: words.trim() });
    } catch {
      // The share sheet refused (an old browser): save it instead
      downloadImage(picture.blob, card.fileName);
      setNote('Saved to your downloads instead.');
    } finally {
      setBusy(false);
    }
  };
  const save = () => {
    downloadImage(picture.blob, card.fileName);
    setNote('Saved to your downloads.');
  };
  const copyWords = async () => {
    try {
      await navigator.clipboard.writeText(words.trim());
      setNote('The words are copied: paste them under your post.');
    } catch {
      setNote('They couldn’t be copied here: select them and copy them yourself.');
    }
  };

  return (
    <div className='grid gap-3'>
      {/* The post: the picture, then its words, as one card */}
      <section aria-label='Preview of your post' data-post-preview className='mx-auto grid w-full max-w-sm border-2 border-poster-brown bg-paper-cream shadow-paper'>
        {picture.url ? (
          <img
            src={picture.url}
            alt={`Your share card: ${card.title}, ${(card.stats || []).map((stat) => `${stat.value} ${stat.label}`).join(', ')}`}
            className='w-full'
            data-share-card
            // The map it shows: world, crop or country (a card's close-up, utils/shareCard/cardMapView.js)
            data-map-view={cardMapKind(card)}
          />
        ) : picture.error ? (
          <p role='alert' className='p-3 text-sm font-medium text-status-critical'>
            {picture.error}
          </p>
        ) : (
          <p className='p-3 text-sm' aria-live='polite'>
            Making your picture…
          </p>
        )}
        <FormField id={wordsId} label='Words to go with it' align='start' className='grid gap-y-1 border-t-2 border-poster-brown p-3'>
          <TextAreaInput value={words} onChange={(e) => setWords(e.target.value)} rows={3} maxLength={WORDS_MAX} />
        </FormField>
      </section>
      <div className='grid gap-2 sm:grid-cols-2'>
        {sharable ? (
          <Button busy={busy} disabled={!picture.blob} onClick={share}>
            Share
          </Button>
        ) : null}
        <Button quiet={sharable} disabled={!picture.blob} onClick={save}>
          Save the picture
        </Button>
        {/* Under the other two where there's a Share, else beside Save */}
        <div className={`grid ${sharable ? 'sm:col-span-2' : ''}`}>
          <Button quiet disabled={!words.trim()} onClick={copyWords}>
            Copy the words
          </Button>
        </div>
      </div>
      <p className='text-sm' aria-live='polite'>
        {note}
      </p>
    </div>
  );
}

export default ShareCardPreview;
