import React, { useId } from 'react';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import CheckboxInput from '@/components/ui/CheckboxInput';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { formatDayRange } from '@/utils/functions/dates';

const count = (n, one, many = `${one}s`) => `${Number(n).toLocaleString('en-GB')} ${n === 1 ? one : many}`;

// Importing from Polarsteps, step 2: the map to bring them to (one you own or edit), which
// trips, and whether their photos and each step's story come too. Says what can't come
// (videos, HEIC files) and the plan's photos per country.
function ImportChooseCard({ trips, chosen, onToggle, onAll, mapId, mapOptions, onMap, uploadRules, withPhotos, onPhotos, withStories, onStories, locked, onStart }) {
  const uid = useId();
  const picked = trips.filter((trip) => chosen.has(trip.key));
  const sum = (field) => picked.reduce((n, trip) => n + trip[field], 0);
  const photos = sum('photos');
  const stories = sum('stories');
  const videos = sum('videos');
  const unreadable = sum('unreadable');

  return (
    <PaperCard title='What to bring' titleId={`${uid}-title`} kicker='Step 2'>
      <FormField id={`${uid}-map`} label='Bring them to' align='start'>
        <PlainOptionSelect value={mapId} onChange={(e) => onMap(e.target.value)} options={mapOptions} />
      </FormField>

      <fieldset className='grid gap-2'>
        <legend className='pb-2 font-medium'>
          Trips ({picked.length} of {trips.length})
        </legend>
        <div className='grid grid-cols-2 gap-2'>
          <Button small quiet onClick={() => onAll(true)}>
            All of them
          </Button>
          <Button small quiet onClick={() => onAll(false)}>
            None
          </Button>
        </div>
        <ul className='grid max-h-96 divide-y divide-dashed divide-poster-brown/50 overflow-y-auto border-y-2 border-dashed border-poster-brown/50 px-1'>
          {trips.map((trip) => (
            <li key={trip.key} className='py-2' data-import-trip={trip.title}>
              <CheckboxInput
                id={`${uid}-${trip.id}`}
                checked={chosen.has(trip.key)}
                onChange={() => onToggle(trip.key)}
                label={
                  <span className='grid'>
                    <span className='font-medium'>{trip.title}</span>
                    <span className='text-sm opacity-80'>
                      {trip.startDate ? formatDayRange(trip.startDate, trip.endDate) : 'No dates'} · {count(trip.countries.length, 'country', 'countries')} ·{' '}
                      {count(trip.photos, 'photo')}
                      {trip.stories ? ` · ${count(trip.stories, 'story', 'stories')}` : ''}
                    </span>
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      </fieldset>

      <div className='grid gap-2'>
        <CheckboxInput id={`${uid}-photos`} checked={withPhotos} onChange={(e) => onPhotos(e.target.checked)} label={`Their photos (${count(photos, 'photo')})`} />
        <CheckboxInput
          id={`${uid}-stories`}
          checked={withStories}
          onChange={(e) => onStories(e.target.checked)}
          label={`Each step’s story, as a moment on the map (${count(stories, 'story', 'stories')})`}
        />
      </div>

      <div className='grid gap-1 text-sm'>
        {withPhotos && uploadRules?.photosPerCountry ? (
          <p>
            This map keeps {uploadRules.photosPerCountry.toLocaleString('en-GB')} photos of each country on its plan; any past that are
            left out and counted.
          </p>
        ) : null}
        {videos ? <p>{count(videos, 'video')} can’t come: videos are added on the map itself.</p> : null}
        {unreadable ? <p>{count(unreadable, 'HEIC photo')} can’t come: save them as JPEGs first.</p> : null}
        <p>Keep this page open while it runs: a few hundred photos take a while. Run it again any time: nothing is brought twice.</p>
      </div>

      {locked ? (
        <p className='text-sm'>Verify your email address to import. The link is in the email we sent you.</p>
      ) : (
        <Button disabled={!picked.length || !mapId} onClick={onStart}>
          Bring {count(picked.length, 'trip')} to the map
        </Button>
      )}
    </PaperCard>
  );
}

export default ImportChooseCard;
