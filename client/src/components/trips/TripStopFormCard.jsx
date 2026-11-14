import React, { useEffect, useId, useRef } from 'react';
// Components
import PaperStripHeader from '@/components/common/PaperStripHeader';

// A stop's form (adding one, or editing one in the list) on its own piece of paperwork:
// the parchment strip with the title and the close stamp, the fields on cream with brown
// edges (paper-fields). `autoFocus` moves focus to the title when it opens because the
// person asked for it, not when the page opens with it already showing.
function TripStopFormCard({ title, closeLabel, onClose, autoFocus = false, children }) {
  const titleId = useId();
  const headingRef = useRef(null);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  return (
    <section aria-labelledby={titleId} className='ticket-edge paper-fields grid overflow-hidden bg-paper-cream text-colour4'>
      <PaperStripHeader titleId={titleId} title={title} headingRef={headingRef} headingLevel={3} onClose={onClose} closeLabel={closeLabel} />
      <div className='grid px-5 py-4 sm:px-6'>{children}</div>
    </section>
  );
}

export default TripStopFormCard;
