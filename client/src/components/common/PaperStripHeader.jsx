import React from 'react';
// Components
import CloseStamp from './CloseStamp';

// The header of a map panel or dialog: an aged-parchment strip with the title in the
// travel face over a dashed perforation, and the round close stamp. `headingRef` lets
// the panel move focus to the heading when it opens. `headingLevel` (default 2) for a
// card nested under another heading, such as a trip's stop form under "Stops".
function PaperStripHeader({ titleId, title, headingRef, onClose, closeLabel, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <header className='paper-aged grid grid-cols-rev items-center gap-3 border-b-2 border-dashed border-poster-brown py-3 pl-5 pr-4 text-poster-ink sideways:py-1.5'>
      <Heading
        id={titleId}
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className='min-w-0 break-words font-travel text-2xl uppercase leading-tight tracking-wide text-poster-red-deep focus:outline-none sideways:text-xl'
      >
        {title}
      </Heading>
      <CloseStamp label={closeLabel} onClick={onClose} />
    </header>
  );
}

export default PaperStripHeader;
