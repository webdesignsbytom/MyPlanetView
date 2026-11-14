import React, { useEffect, useId, useRef } from 'react';
// Icons
import { IoCloseCircleOutline } from 'react-icons/io5';

/**
 * The shell every map overlay uses (stats, settings, a country, the trips...): a
 * floating card on wide screens, a sheet above the toolbar on phones. It doesn't block
 * the map. Focus moves to its heading when it opens; Escape closes it.
 */
function MapPanel({ title, onClose, children, footer = null }) {
  const titleId = useId();
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      role='dialog'
      aria-modal='false'
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      className='pointer-events-auto grid max-h-[62vh] w-full grid-rows-a1a overflow-hidden rounded-xl border-2 border-map-edge bg-map-panel text-map-ink shadow-lift md:max-h-[calc(100vh-8rem)] md:w-[26rem]'
    >
      <header className='grid grid-cols-rev items-center gap-2 border-b-2 border-map-edge/20 px-4 py-3'>
        <h2 id={titleId} ref={headingRef} tabIndex={-1} className='text-lg font-semibold focus:outline-none'>
          {title}
        </h2>
        <button
          type='button'
          onClick={onClose}
          aria-label={`Close ${title}`}
          className='grid h-9 w-9 place-items-center rounded-full text-3xl hover:brightness-125 active:scale-95'
        >
          <IoCloseCircleOutline aria-hidden='true' />
        </button>
      </header>
      <div className='grid content-start gap-4 overflow-y-auto px-4 py-4'>{children}</div>
      {footer ? <footer className='border-t-2 border-map-edge/20 px-4 py-3'>{footer}</footer> : <span />}
    </section>
  );
}

export default MapPanel;
