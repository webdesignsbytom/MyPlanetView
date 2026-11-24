import React, { useEffect, useState } from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { drawShareCard } from '@/utils/shareCard/drawShareCard';
import { canShareImages, downloadImage, shareImage } from '@/utils/shareCard/shareImage';
import { cardMapKind } from '@/utils/shareCard/cardMapView';

// A share card, made and shown (utils/shareCard/): drawn in the browser when it's shown,
// then handed to the share sheet (Instagram, WhatsApp…) where the browser can, or saved.
// `card`: drawShareCard's options plus `fileName` and `shareText` (keep the object the
// same between renders: a new one draws it again). In ShareCardDialog and the year recap.
function ShareCardPreview({ card }) {
  const [picture, setPicture] = useState({ blob: null, url: '', error: '' });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
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
      await shareImage(picture.blob, { fileName: card.fileName, title: card.title, text: card.shareText });
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

  return (
    <div className='grid gap-3'>
      {picture.url ? (
        <img
          src={picture.url}
          alt={`Your share card: ${card.title}, ${(card.stats || []).map((stat) => `${stat.value} ${stat.label}`).join(', ')}`}
          className='mx-auto w-full max-w-sm border-2 border-poster-brown shadow-paper'
          data-share-card
          // The map it shows: world, crop or country (a card's close-up, utils/shareCard/cardMapView.js)
          data-map-view={cardMapKind(card)}
        />
      ) : picture.error ? (
        <p role='alert' className='text-sm font-medium text-status-critical'>
          {picture.error}
        </p>
      ) : (
        <p className='text-sm' aria-live='polite'>
          Making your picture…
        </p>
      )}
      <div className='grid gap-2 sm:grid-cols-2'>
        {sharable ? (
          <Button busy={busy} disabled={!picture.blob} onClick={share}>
            Share
          </Button>
        ) : null}
        <Button quiet={sharable} disabled={!picture.blob} onClick={save}>
          Save the picture
        </Button>
      </div>
      <p className='text-sm' aria-live='polite'>
        {note}
      </p>
    </div>
  );
}

export default ShareCardPreview;
