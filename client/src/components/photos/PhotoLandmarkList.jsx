import React, { useState } from 'react';
// Api
import { addPhotoLandmark, confirmPhotoLandmark, removePhotoLandmark } from '@/api/travelApi';
// Hooks
import useLandmarks from '@/hooks/useLandmarks';
// Components
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';

const distanceText = (m) => (m == null ? '' : m < 1000 ? ` (${m} m away)` : ` (${(m / 1000).toFixed(1)} km away)`);

// The landmarks matched to a photo. Matches from the photo's location wait for a yes;
// an editor can also add one by hand, from the photo's country.
function PhotoLandmarkList({ photo, canEdit, onChanged }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState('');
  const { landmarks: available } = useLandmarks(photo.countryCode, { enabled: canEdit && Boolean(photo.countryCode) });

  const run = async (key, action) => {
    setBusy(key);
    setError(null);
    try {
      const { photo: updated } = await action();
      onChanged(updated);
    } catch (err) {
      setError(err.friendlyMessage || 'That change could not be saved.');
    } finally {
      setBusy(null);
    }
  };

  const matched = photo.landmarks || [];
  const addable = available.filter((l) => !matched.some((m) => m.id === l.id));

  if (!matched.length && !canEdit) return null;

  return (
    <section className='grid gap-2' aria-labelledby={`photo-landmarks-${photo.id}`}>
      <h3 id={`photo-landmarks-${photo.id}`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Landmarks
      </h3>
      {matched.length ? (
        <ul className='grid gap-2'>
          {matched.map((landmark) => (
            <li key={landmark.id} className='grid grid-cols-rev items-center gap-2 text-sm'>
              <span>
                {landmark.name}
                {landmark.confirmed ? '' : ` — suggested${distanceText(landmark.distanceM)}`}
              </span>
              {canEdit ? (
                <span className='grid grid-row gap-2'>
                  {!landmark.confirmed ? (
                    <Button
                      quiet
                      busy={busy === `c${landmark.id}`}
                      ariaLabel={`That's right: ${landmark.name}`}
                      onClick={() => run(`c${landmark.id}`, () => confirmPhotoLandmark(photo.id, landmark.id))}
                    >
                      That's right
                    </Button>
                  ) : null}
                  <Button
                    quiet
                    busy={busy === `r${landmark.id}`}
                    ariaLabel={`Remove ${landmark.name}`}
                    onClick={() => run(`r${landmark.id}`, () => removePhotoLandmark(photo.id, landmark.id))}
                  >
                    Remove
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-sm opacity-80'>No landmarks matched yet.</p>
      )}
      {canEdit && addable.length ? (
        <div className='grid grid-cols-rev items-stretch gap-2'>
          {/* The Add button as tall as the dropdown beside it (stretched to the row) */}
          <PlainOptionSelect
            id={`add-landmark-${photo.id}`}
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            placeholder='Add a landmark'
            ariaLabel='Add a landmark'
            options={addable.map((l) => ({ value: l.id, label: l.name }))}
          />
          <Button
            disabled={!adding}
            busy={busy === 'add'}
            onClick={() =>
              run('add', async () => {
                const result = await addPhotoLandmark(photo.id, adding);
                setAdding('');
                return result;
              })
            }
          >
            Add
          </Button>
        </div>
      ) : null}
      <InlineAlert>{error}</InlineAlert>
    </section>
  );
}

export default PhotoLandmarkList;
