import React from 'react';
import { createPortal } from 'react-dom';
// Components
import Modal from '@/components/common/Modal';
import ShareCardPreview from './ShareCardPreview';

// A picture of the map to share (21 Nov 2026, the user's wish; utils/shareCard/), from the
// statistics panel. Portalled, so it sits over the whole page.
function ShareCardDialog({ card, title = 'Share a picture of your map', onClose }) {
  return createPortal(
    <Modal title={title} onClose={onClose}>
      <p className='text-sm'>For Instagram, WhatsApp or anywhere you like. It shows your countries and counts, never your photos.</p>
      <ShareCardPreview card={card} />
    </Modal>,
    document.body,
  );
}

export default ShareCardDialog;
