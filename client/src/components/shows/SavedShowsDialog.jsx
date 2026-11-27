import React from 'react';
import { createPortal } from 'react-dom';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Components
import Modal from '@/components/common/Modal';
import MapShowsSection from './MapShowsSection';

/**
 * The map's saved slideshows (27 Nov 2026, the user's wish; docs/API.md "Photo slideshows"),
 * opened from the photo album's "Saved slideshows": how many are saved of the 2, 10 or 25 the
 * map's plan keeps, and each one to play, share, rename, re-link or delete (MapShowsSection).
 * Changes wait for a verified email address, as the server's do. Portalled, so it sits over
 * the whole page.
 */
function SavedShowsDialog({ mapId, onClose }) {
  const locked = useMustVerifyEmail();
  return createPortal(
    <Modal wide title='Saved slideshows' onClose={onClose}>
      <MapShowsSection mapId={mapId} locked={locked} headed={false} />
    </Modal>,
    document.body,
  );
}

export default SavedShowsDialog;
