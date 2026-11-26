import React, { useEffect, useState } from 'react';
// Icons
import { FaDownload, FaSyncAlt } from 'react-icons/fa';
// Hooks
import useLandmarkPhotos from '@/hooks/useLandmarkPhotos';
// Components
import Button from '@/components/common/Button';
// Utils
import { landmarkNameOf, placeNameOf, postcardFileName } from '@/utils/postcards/postcardRules';

// The drawing and its art (the little 3D models' list among it) load once a card is shown, so a
// postcard's page has its words at once and its pictures as soon as they're drawn
const loadDrawing = () => Promise.all([import('@/utils/postcards/postcardArt'), import('@/utils/postcards/drawPostcard')]);


// What a screen reader is told each side shows (the pictures are the card)
const frontWords = (card) => `The front of the postcard: “Greetings from ${landmarkNameOf(card) || placeNameOf(card)}”.`;
const backWords = (card) =>
  [
    'The back of the postcard.',
    `The message: “${card.message}”`,
    card.toName ? `To ${card.toName}.` : null,
    card.fromName ? `From ${card.fromName}.` : null,
  ]
    .filter(Boolean)
    .join(' ');

/**
 * A postcard, drawn (utils/postcards/drawPostcard.js) and shown as the pictures it downloads as:
 * the front, and "Turn it over" for the back (a card turning on its side; a plain swap with
 * reduced motion). `card` is the server's view of one (or the maker's draft, the same shape).
 * `downloads` adds "Download the front" and "Download the back" (the postcard's page: to keep it
 * forever, the user's wish). `side` and `onTurn` let the parent hold which side shows.
 */
function PostcardView({ card, downloads = false, side: shownSide, onTurn, className = '' }) {
  const photos = useLandmarkPhotos();
  const [ownSide, setOwnSide] = useState('front');
  const side = shownSide ?? ownSide;
  const turn = onTurn ?? (() => setOwnSide((s) => (s === 'front' ? 'back' : 'front')));
  const [drawn, setDrawn] = useState({ front: null, back: null, error: '' });
  // Only what the drawing reads: a new object for the same card draws nothing again
  const key = JSON.stringify([card.kind, card.countryCode, card.landmark?.id, card.pictureUrl, card.style, card.message, card.toName, card.fromName, card.sentAt]);

  useEffect(() => {
    let alive = true;
    const urls = [];
    loadDrawing()
      .then(([{ postcardArt }, { drawPostcard, canvasPng }]) =>
        drawPostcard(card, postcardArt(card, photos)).then(({ front, back }) => Promise.all([canvasPng(front), canvasPng(back)])),
      )
      .then(([front, back]) => {
        const next = { front: URL.createObjectURL(front), back: URL.createObjectURL(back), error: '' };
        urls.push(next.front, next.back);
        if (alive) setDrawn(next);
      })
      .catch(() => alive && setDrawn({ front: null, back: null, error: 'The postcard couldn’t be drawn here. Please try again.' }));
    return () => {
      alive = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [key, photos]); // eslint-disable-line react-hooks/exhaustive-deps

  const ready = Boolean(drawn.front && drawn.back);
  return (
    <div className={`grid gap-3 ${className}`} data-postcard-view='' data-postcard-drawn={ready ? 'true' : 'false'} data-postcard-side={side}>
      <div className='[perspective:2000px]'>
        <div
          className={`relative grid aspect-[3/2] w-full transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:transition-none ${
            side === 'back' ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {ready ? (
            <>
              <img
                src={drawn.front}
                alt={frontWords(card)}
                aria-hidden={side !== 'front'}
                draggable={false}
                data-postcard-face='front'
                className='col-start-1 row-start-1 h-full w-full shadow-paper [backface-visibility:hidden]'
              />
              <img
                src={drawn.back}
                alt={backWords(card)}
                aria-hidden={side !== 'back'}
                draggable={false}
                data-postcard-face='back'
                className='col-start-1 row-start-1 h-full w-full shadow-paper [backface-visibility:hidden] [transform:rotateY(180deg)]'
              />
            </>
          ) : (
            <p role='status' className='col-start-1 row-start-1 grid place-items-center border-2 border-dashed border-poster-brown/60 bg-paper-cream text-sm'>
              {drawn.error || 'Drawing the postcard…'}
            </p>
          )}
        </div>
      </div>
      <div className={`grid gap-2 ${downloads ? 'sm:grid-cols-3' : 'justify-items-center'}`}>
        <Button quiet onClick={turn} disabled={!ready} ariaLabel={side === 'front' ? 'Turn it over to see the back' : 'Turn it over to see the front'}>
          <FaSyncAlt aria-hidden='true' className='self-center text-sm' />
          <span>Turn it over</span>
        </Button>
        {downloads && ready ? (
          <>
            <a href={drawn.front} download={postcardFileName(card, 'front')} className='btn-paper grid grid-flow-col items-center justify-center gap-2 text-center' data-postcard-download='front'>
              <FaDownload aria-hidden='true' className='text-sm' />
              <span>Download the front</span>
            </a>
            <a href={drawn.back} download={postcardFileName(card, 'back')} className='btn-paper grid grid-flow-col items-center justify-center gap-2 text-center' data-postcard-download='back'>
              <FaDownload aria-hidden='true' className='text-sm' />
              <span>Download the back</span>
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default PostcardView;
