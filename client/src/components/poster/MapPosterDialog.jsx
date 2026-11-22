import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import CheckboxInput from '@/components/ui/CheckboxInput';
import PrintPartnerOffers from '@/components/photos/PrintPartnerOffers';
// Utils
import { POSTER_LOOKS, POSTER_SIZES, drawMapPoster, posterPng, posterSize, printablePixels } from '@/utils/poster/drawMapPoster';
import { downloadImage } from '@/utils/shareCard/shareImage';

// The preview's width in pixels (the poster's shape, drawn small)
const PREVIEW_WIDTH = 1200;
const PREVIEW_DELAY_MS = 350;

/**
 * Your map as a printed poster (22 Nov 2026, the user's wish; utils/poster/): a preview, the
 * paper size, the look, the title and whether the places' names go under the map, then the
 * print-ready PNG (300 dpi, saying so in the file) to take to any print shop, and the print
 * partners' offers. From the statistics panel; never on share links. Portalled. `poster` is
 * mapPosterOptions(map).
 */
function MapPosterDialog({ poster, onClose }) {
  const uid = useId();
  const [size, setSize] = useState('A3');
  const [look, setLook] = useState('atlas');
  const [title, setTitle] = useState(poster.title || '');
  const [showNames, setShowNames] = useState(true);
  const [preview, setPreview] = useState({ url: '', error: '' });
  const [making, setMaking] = useState(false);
  const [status, setStatus] = useState({ text: '', error: false });

  // The preview, drawn small a moment after the last change
  useEffect(() => {
    let cancelled = false;
    let url = '';
    const timer = window.setTimeout(async () => {
      try {
        const [w, h] = posterSize(size).mm;
        const canvas = await drawMapPoster({ ...poster, title, look, showNames, width: PREVIEW_WIDTH, height: Math.round((PREVIEW_WIDTH * h) / w) });
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (cancelled || !blob) return;
        url = URL.createObjectURL(blob);
        setPreview({ url, error: '' });
      } catch {
        if (!cancelled) setPreview({ url: '', error: 'The preview couldn’t be drawn.' });
      }
    }, PREVIEW_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [poster, size, look, title, showNames]);

  const download = async () => {
    setMaking(true);
    setStatus({ text: 'Drawing your poster at print size… a big file, so this takes a few seconds.', error: false });
    // Let the message show before the browser gets busy
    await new Promise((resolve) => window.setTimeout(resolve, 50));
    try {
      const pixels = printablePixels(size);
      if (!pixels) throw new Error('This browser can’t draw a poster that big: try a smaller size, or a computer.');
      const canvas = await drawMapPoster({ ...poster, title, look, showNames, width: pixels.width, height: pixels.height });
      const blob = await posterPng(canvas, pixels.dpi);
      canvas.width = 0;
      canvas.height = 0;
      downloadImage(blob, `${poster.fileBase}-poster-${size}.png`);
      const quality = pixels.dpi < 300 ? `${pixels.dpi} dpi (the most this browser can draw)` : '300 dpi';
      setStatus({ text: `Saved: ${pixels.width.toLocaleString('en-GB')} × ${pixels.height.toLocaleString('en-GB')} pixels, ${posterSize(size).label} at ${quality}.`, error: false });
    } catch (err) {
      setStatus({ text: err?.message || 'The poster couldn’t be made. Please try again.', error: true });
    } finally {
      setMaking(false);
    }
  };

  return createPortal(
    <Modal title='A poster of your map' onClose={onClose}>
      <div className='grid gap-4'>
        <p className='text-sm'>
          Your map at print size, ready for any print shop or photo printer: your countries coloured in, your map’s name and its numbers.
        </p>
        {preview.url ? (
          <img
            src={preview.url}
            alt={`The poster: ${title || 'your map'}, with your countries coloured in`}
            className='w-full border-2 border-poster-brown shadow-paper'
            data-poster-preview
          />
        ) : preview.error ? (
          <p role='alert' className='text-sm font-medium text-status-critical'>
            {preview.error}
          </p>
        ) : (
          <p className='text-sm' aria-live='polite'>
            Drawing the preview…
          </p>
        )}

        <div className='grid gap-3 sm:grid-cols-2'>
          <FormField id={`${uid}-size`} label='Paper size' align='start'>
            <PlainOptionSelect value={size} onChange={(e) => setSize(e.target.value)} options={POSTER_SIZES.map((s) => ({ value: s.id, label: s.label }))} />
          </FormField>
          <FormField id={`${uid}-look`} label='Look' align='start'>
            <PlainOptionSelect value={look} onChange={(e) => setLook(e.target.value)} options={POSTER_LOOKS.map((l) => ({ value: l.id, label: l.label }))} />
          </FormField>
        </div>
        <FormField id={`${uid}-title`} label='Title' align='start'>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} maxLength={80} autoComplete='off' />
        </FormField>
        <CheckboxInput
          id={`${uid}-names`}
          checked={showNames}
          onChange={(e) => setShowNames(e.target.checked)}
          label='Name the countries under the map'
        />

        <Button busy={making} onClick={download}>
          Download the poster
        </Button>
        <p aria-live='polite' className={`text-sm ${status.error ? 'font-medium text-status-critical' : ''}`} data-poster-status>
          {status.text}
        </p>

        <PrintPartnerOffers
          title='Have it printed'
          lead='Upload the poster on the printer’s site, choose the same paper size, and order there.'
          fallback='Any print shop or photo printer’s website takes this file: upload it and choose the same paper size.'
        />
      </div>
    </Modal>,
    document.body,
  );
}

export default MapPosterDialog;
