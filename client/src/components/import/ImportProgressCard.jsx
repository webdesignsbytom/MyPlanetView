import React, { useId } from 'react';
import { Link } from 'react-router-dom';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
// Utils
import { mapPath } from '@/utils/constants/routes';

const count = (n, one, many = `${one}s`) => `${Number(n).toLocaleString('en-GB')} ${n === 1 ? one : many}`;
const STAGES = { trips: 'Adding the trips…', photos: 'Bringing the photos…', stories: 'Adding the stories…', done: 'Done.' };

// Importing from Polarsteps, step 3: how it's going (trips, photos, stories), any wait the
// server asked for, and Stop; then what came, what was there already, what didn't fit.
function ImportProgressCard({ progress, mapId, error, stoppedEarly, onStop }) {
  const uid = useId();
  const running = progress && progress.stage !== 'done' && !error && !stoppedEarly;
  const share = progress?.photosTotal ? Math.round(((progress.photos + progress.already + progress.full + progress.failed) / progress.photosTotal) * 100) : null;
  return (
    <PaperCard title={running ? 'Bringing your travels' : 'Your import'} titleId={`${uid}-title`} kicker='Step 3'>
      <div className='grid gap-2' data-import-stage={progress?.stage}>
        <p role='status' aria-live='polite' className='font-medium'>
          {error ? 'The import stopped.' : stoppedEarly ? 'Stopped. Run it again to carry on where it stopped.' : STAGES[progress?.stage] ?? 'Starting…'}
        </p>
        {progress?.photosTotal && share !== null ? (
          <progress max={100} value={share} className='h-3 w-full accent-poster-red' aria-label='Photos brought' />
        ) : null}
        {progress ? (
          <ul className='grid gap-0.5 text-sm'>
            <li>
              Trips: {count(progress.trips, 'trip')} of {progress.tripsTotal}
              {progress.tripsNew !== progress.trips ? ` (${count(progress.trips - progress.tripsNew, 'was', 'were')} there already)` : ''}
            </li>
            {progress.photosTotal ? (
              <li data-import-photos={progress.photos}>
                Photos: {count(progress.photos, 'photo')} of {progress.photosTotal}
                {progress.already ? `, ${progress.already} there already` : ''}
                {progress.full ? `, ${progress.full} left out (the plan’s photos per country are used)` : ''}
              </li>
            ) : null}
            {progress.storiesTotal ? (
              <li>
                Stories: {progress.stories} of {progress.storiesTotal}
              </li>
            ) : null}
            {progress.failed ? <li>{count(progress.failed, 'thing')} couldn’t be brought.</li> : null}
          </ul>
        ) : null}
        {progress?.waitingUntil ? (
          <p className='text-sm'>Waiting a little: the site’s limit on uploads. It carries on by itself.</p>
        ) : null}
        {progress?.failures?.length ? (
          <ul className='grid list-disc gap-0.5 pl-5 text-sm opacity-80'>
            {progress.failures.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        ) : null}
        {error ? (
          <p role='alert' className='text-sm font-medium text-status-critical'>
            {error}
          </p>
        ) : null}
      </div>
      {running ? (
        <Button quiet onClick={onStop}>
          Stop
        </Button>
      ) : mapId ? (
        <Link to={mapPath(mapId)} className='btn-poster text-center'>
          Open the map
        </Link>
      ) : null}
    </PaperCard>
  );
}

export default ImportProgressCard;
