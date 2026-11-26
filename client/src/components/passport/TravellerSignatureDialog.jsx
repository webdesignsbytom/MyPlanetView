import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// Api
import { updateTravellerPassport } from '@/api/travelApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import PassportSignature from './PassportSignature';
// Utils
import { SIGNATURE_HEIGHT, SIGNATURE_MAX_LENGTH, SIGNATURE_WIDTH, strokesToPath } from '@/utils/passport/travellerDetails';

/**
 * Somewhere to sign with a finger or the mouse: a line on paper, each stroke drawn as it's made,
 * kept in the 300 × 100 box whatever size the pad shows at. `strokes` are lists of `{ x, y }`;
 * `onChange` is a state setter (it's given updates).
 */
function SignaturePad({ name, strokes, onChange }) {
  const padRef = useRef(null);
  const drawingRef = useRef(false);
  const pointOf = (e) => {
    const box = padRef.current.getBoundingClientRect();
    return { x: ((e.clientX - box.left) / box.width) * SIGNATURE_WIDTH, y: ((e.clientY - box.top) / box.height) * SIGNATURE_HEIGHT };
  };
  // `onChange` takes an update (the state setter's), so no point is lost between renders
  const start = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    const point = pointOf(e);
    onChange((prev) => [...prev, [point]]);
  };
  const move = (e) => {
    if (!drawingRef.current) return;
    const point = pointOf(e);
    onChange((prev) => [...prev.slice(0, -1), [...(prev[prev.length - 1] ?? []), point]]);
  };
  const end = () => {
    drawingRef.current = false;
  };
  const path = useMemo(() => strokesToPath(strokes), [strokes]);

  return (
    <svg
      ref={padRef}
      role='img'
      aria-label={path ? `${name}’s signature, drawn` : `A space for ${name} to sign, with a finger or the mouse`}
      viewBox={`0 0 ${SIGNATURE_WIDTH} ${SIGNATURE_HEIGHT}`}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      data-signature-pad=''
      className='aspect-[3/1] w-full cursor-crosshair touch-none select-none border-2 border-poster-brown bg-paper-cream text-colour4'
    >
      <line x1='12' x2={SIGNATURE_WIDTH - 12} y1={SIGNATURE_HEIGHT - 22} y2={SIGNATURE_HEIGHT - 22} stroke='currentColor' strokeOpacity='0.35' strokeDasharray='4 4' />
      {path ? <path d={path} fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' /> : null}
    </svg>
  );
}

/**
 * A traveller's signature on their passport page (25 Nov 2026, the user's wish; docs/API.md
 * "Passport"): drawn here with a finger or the mouse, then saved; without one, the page writes
 * their name in a handwriting face (also the way for anyone who can't draw it: "Use the name
 * instead"). `onSaved` gets the traveller as the passport shows them. Portalled.
 */
function TravellerSignatureDialog({ mapId, traveller, onSaved, onClose }) {
  const [strokes, setStrokes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const path = useMemo(() => strokesToPath(strokes), [strokes]);
  const tooLong = path.length > SIGNATURE_MAX_LENGTH;

  const send = async (signature) => {
    setBusy(true);
    setError('');
    try {
      const { traveller: saved } = await updateTravellerPassport(mapId, traveller.id, { signature });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err?.friendlyMessage || 'The signature couldn’t be saved.');
      setBusy(false);
    }
  };

  return createPortal(
    <Modal title={`${traveller.name}’s signature`} onClose={onClose}>
      <p className='text-sm'>Sign in the box with a finger or the mouse, as on a real passport.</p>
      <SignaturePad name={traveller.name} strokes={strokes} onChange={setStrokes} />
      <div className='grid grid-row justify-between gap-3 text-sm'>
        <button type='button' onClick={() => setStrokes([])} disabled={!strokes.length} className='underline underline-offset-2 disabled:no-underline disabled:opacity-50'>
          Start again
        </button>
        {traveller.signature ? (
          <span className='grid grid-row items-center gap-2'>
            Now: <PassportSignature name={traveller.name} signature={traveller.signature} className='h-8' />
          </span>
        ) : null}
      </div>
      {tooLong ? <InlineAlert>That’s a lot of signature: start again a little simpler.</InlineAlert> : null}
      <InlineAlert>{error}</InlineAlert>
      <div className='grid gap-2 sm:grid-cols-2'>
        <Button quiet busy={busy} onClick={() => send(null)} disabled={!traveller.signature}>
          Use the name instead
        </Button>
        <Button busy={busy} onClick={() => send(path)} disabled={!path || tooLong}>
          Save the signature
        </Button>
      </div>
      <p className='text-xs'>Without a signature, the passport writes {traveller.name}’s name in handwriting.</p>
    </Modal>,
    document.body,
  );
}

export default TravellerSignatureDialog;
