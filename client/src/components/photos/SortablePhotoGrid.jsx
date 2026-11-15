import React, { useMemo, useRef } from 'react';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
// Components
import SortablePhotoTile from './SortablePhotoTile';
// Utils
import { photoLabel } from '@/utils/photos/photoLabel';

// A gallery being rearranged (PhotoGrid's "Rearrange photos"; loaded only then, with
// dnd-kit). A photo is picked up by dragging it with the mouse, by pressing and holding
// it on a touch screen (a quick swipe still scrolls), or with Space/Enter from the
// keyboard, then the arrow keys and Space/Enter to drop it (Escape puts it back).
// Dropping calls `onMove(photoId, afterId)`: the photo now straight before it, or null
// when it went first.
function SortablePhotoGrid({ photos, onMove, columnsClass }) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = useMemo(() => photos.map((p) => p.id), [photos]);

  // The place last announced. dnd-kit reports "over" its own place as soon as a photo is
  // picked up, which would talk over "Picked up…"; only a real change of place is said.
  const lastOverRef = useRef(null);

  // What a screen reader hears, in words rather than dnd-kit's ids
  const accessibility = useMemo(() => {
    const labelOf = (id) => photoLabel(photos.find((p) => p.id === id) || {});
    const place = (id) => `place ${ids.indexOf(id) + 1} of ${ids.length}`;
    return {
      screenReaderInstructions: {
        draggable: 'Press Space or Enter to pick up this photo. Move it with the arrow keys, then press Space or Enter to drop it, or Escape to put it back.',
      },
      announcements: {
        onDragStart: ({ active }) => {
          lastOverRef.current = active.id;
          return `Picked up ${labelOf(active.id)}, at ${place(active.id)}.`;
        },
        onDragOver: ({ active, over }) => {
          const overId = over ? over.id : null;
          if (overId === lastOverRef.current) return undefined;
          lastOverRef.current = overId;
          return over ? `${labelOf(active.id)} moved to ${place(over.id)}.` : `${labelOf(active.id)} is outside the photos.`;
        },
        onDragEnd: ({ active, over }) => (over ? `Dropped ${labelOf(active.id)} at ${place(over.id)}.` : `${labelOf(active.id)} went back to its place.`),
        onDragCancel: ({ active }) => `Cancelled. ${labelOf(active.id)} went back to its place.`,
      },
    };
  }, [photos, ids]);

  const dropped = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const order = arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id));
    const at = order.indexOf(active.id);
    onMove(active.id, at > 0 ? order[at - 1] : null);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dropped} accessibility={accessibility}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className={`grid gap-2 ${columnsClass}`}>
          {photos.map((photo) => (
            <SortablePhotoTile key={photo.id} photo={photo} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export default SortablePhotoGrid;
