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
import {
  CUSTOM_CM_MAX,
  CUSTOM_CM_MIN,
  CUSTOM_SIZE,
  POSTER_LOOKS,
  POSTER_SIZES,
  drawMapPoster,
  parseCustomSize,
  posterFilePart,
  posterLook,
  posterPng,
  posterSize,
  printablePixels,
} from '@/utils/poster/drawMapPoster';
import { posterColoursFor } from '@/utils/poster/posterOptions';
import { downloadImage } from '@/utils/shareCard/shareImage';

// The preview's longer side in pixels (the poster's shape, drawn small)
const PREVIEW_WIDTH = 1200;
const PREVIEW_DELAY_MS = 350;
const SIZE_OPTIONS = [...POSTER_SIZES.map((s) => ({ value: s.id, label: s.label })), { value: CUSTOM_SIZE, label: 'Custom size' }];
const LOOK_OPTIONS = POSTER_LOOKS.map((l) => ({ value: l.id, label: l.label }));
// A side in the custom size's boxes: "42", "29.7"
const cmText = (mm) => String(Math.round(mm) / 10);

/** The preview's pixels for a paper's shape: its longer side PREVIEW_WIDTH. */
function previewPixels([w, h]) {
  if (w >= h) return { width: PREVIEW_WIDTH, height: Math.round((PREVIEW_WIDTH * h) / w) };
  return { width: Math.round((PREVIEW_WIDTH * w) / h), height: PREVIEW_WIDTH };
}

/**
 * Your map as a printed poster (22 Nov 2026, the user's wish; utils/poster/): a preview, the
 * paper size (or a custom one, either way round: 27 Nov 2026, the user's wish), the look (every
 * map style, starting in the map's own, and "Old paper": the same day), the title and whether
 * the places' names go under the map, then the print-ready PNG (300 dpi, saying so in the file)
 * to take to any print shop, and the print partners' offers. From the statistics panel; never
 * on share links. Portalled. `poster` is mapPosterOptions(map, design, styleId).
 */
function MapPosterDialog({ poster, onClose }) {
  const uid = useId();
  const [sizeId, setSizeId] = useState('A3');
  const [custom, setCustom] = useState({ width: '', height: '' });
  const [look, setLook] = useState(() => posterLook(poster.look).id);
  const [title, setTitle] = useState(poster.title || '');
  const [showNames, setShowNames] = useState(true);
  const [preview, setPreview] = useState({ url: '', error: '' });
  const [making, setMaking] = useState(false);
  const [status, setStatus] = useState({ text: '', error: false });

  // The paper: a listed size, or the custom one typed in (null while it isn't a size)
  const customChoice = sizeId === CUSTOM_SIZE ? parseCustomSize(custom.width, custom.height) : null;
  const size = customChoice ? (customChoice.size ?? null) : posterSize(sizeId);
  const sizeKey = size ? size.mm.join('x') : '';
  const colours = posterColoursFor(poster, look);

  const chooseSize = (next) => {
    // A custom size starts as the size chosen before it
    if (next === CUSTOM_SIZE && sizeId !== CUSTOM_SIZE && !custom.width && !custom.height) {
      const [w, h] = posterSize(sizeId).mm;
      setCustom({ width: cmText(w), height: cmText(h) });
    }
    setSizeId(next);
  };

  // The preview, drawn small a moment after the last change
  useEffect(() => {
    if (!sizeKey) return undefined;
    let cancelled = false;
    let url = '';
    const timer = window.setTimeout(async () => {
      try {
        const canvas = await drawMapPoster({ ...poster, colours, title, look, showNames, ...previewPixels(sizeKey.split('x').map(Number)) });
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
  }, [poster, colours, sizeKey, look, title, showNames]);

  const download = async () => {
    if (!size) return;
    setMaking(true);
    setStatus({ text: 'Drawing your poster at print size… a big file, so this takes a few seconds.', error: false });
    // Let the message show before the browser gets busy
    await new Promise((resolve) => window.setTimeout(resolve, 50));
    try {
      const pixels = printablePixels(size);
      if (!pixels) throw new Error('This browser can’t draw a poster that big: try a smaller size, or a computer.');
      const canvas = await drawMapPoster({ ...poster, colours, title, look, showNames, width: pixels.width, height: pixels.height });
      const blob = await posterPng(canvas, pixels.dpi);
      canvas.width = 0;
      canvas.height = 0;
      downloadImage(blob, `${poster.fileBase}-poster-${posterFilePart(size)}.png`);
      const quality = pixels.dpi < 300 ? `${pixels.dpi} dpi (the most this browser can draw)` : '300 dpi';
      setStatus({ text: `Saved: ${pixels.width.toLocaleString('en-GB')} × ${pixels.height.toLocaleString('en-GB')} pixels, ${size.label} at ${quality}.`, error: false });
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
          // As wide as the dialog, a tall custom size no taller than most of the screen
          <img
            src={preview.url}
            alt={`The poster: ${title || 'your map'}, with your countries coloured in`}
            className='max-h-[70vh] max-w-full justify-self-center border-2 border-poster-brown shadow-paper'
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
            <PlainOptionSelect value={sizeId} onChange={(e) => chooseSize(e.target.value)} options={SIZE_OPTIONS} />
          </FormField>
          <FormField id={`${uid}-look`} label='Look' align='start'>
            <PlainOptionSelect value={look} onChange={(e) => setLook(e.target.value)} options={LOOK_OPTIONS} />
          </FormField>
        </div>
        {sizeId === CUSTOM_SIZE ? (
          <fieldset className='grid gap-2' data-poster-custom-size>
            <legend className='sr-only'>Custom size</legend>
            <div className='grid grid-cols-2 gap-3'>
              <FormField id={`${uid}-width`} label='Width (cm)' align='start' error={Boolean(customChoice.error)}>
                <TextInput
                  value={custom.width}
                  onChange={(e) => setCustom((was) => ({ ...was, width: e.target.value.slice(0, 6) }))}
                  inputMode='decimal'
                  autoComplete='off'
                  ariaDescribedBy={`${uid}-custom-note`}
                />
              </FormField>
              <FormField id={`${uid}-height`} label='Height (cm)' align='start' error={Boolean(customChoice.error)}>
                <TextInput
                  value={custom.height}
                  onChange={(e) => setCustom((was) => ({ ...was, height: e.target.value.slice(0, 6) }))}
                  inputMode='decimal'
                  autoComplete='off'
                  ariaDescribedBy={`${uid}-custom-note`}
                />
              </FormField>
            </div>
            <p id={`${uid}-custom-note`} aria-live='polite' className={`text-sm ${customChoice.error ? 'font-medium text-status-critical' : ''}`}>
              {customChoice.error || `Any size from ${CUSTOM_CM_MIN} to ${CUSTOM_CM_MAX} cm a side, wide or tall.`}
            </p>
          </fieldset>
        ) : null}
        <FormField id={`${uid}-title`} label='Title' align='start'>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} maxLength={80} autoComplete='off' />
        </FormField>
        <CheckboxInput
          id={`${uid}-names`}
          checked={showNames}
          onChange={(e) => setShowNames(e.target.checked)}
          label='Name the countries under the map'
        />

        <Button busy={making} disabled={!size} onClick={download}>
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
