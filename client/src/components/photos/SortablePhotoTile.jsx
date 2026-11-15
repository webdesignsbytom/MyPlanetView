import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// Components
import PhotoThumbFace from './PhotoThumbFace';
// Utils
import { photoLabel } from '@/utils/photos/photoLabel';

// One photo while its gallery is being rearranged: picked up with the mouse, a long
// press on a touch screen, or Space/Enter from the keyboard (SortablePhotoGrid). A
// lifted photo tilts and casts a deeper shadow. No long-press menu or text selection
// on touch screens, and a short swipe still scrolls the panel.
function SortablePhotoTile({ photo }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
    attributes: { roleDescription: 'movable photo' },
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'relative z-10' : 'relative'}
    >
      <div
        {...attributes}
        {...listeners}
        aria-label={photoLabel(photo)}
        className={`relative grid aspect-square cursor-grab touch-manipulation select-none overflow-hidden border-4 border-poster-cream bg-poster-cream [-webkit-touch-callout:none] focus-visible:outline-2 ${
          isDragging ? 'rotate-2 scale-105 cursor-grabbing shadow-lift' : 'shadow-paper'
        }`}
      >
        <PhotoThumbFace photo={photo} />
      </div>
    </li>
  );
}

export default SortablePhotoTile;
