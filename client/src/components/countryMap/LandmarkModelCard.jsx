import React, { useId, useState } from 'react';
// Hooks
import useLandmarks from '@/hooks/useLandmarks';
import useLandmarkMarks from '@/hooks/useLandmarkMarks';
import useModelFacts from '@/hooks/useModelFacts';
// Components
import MapPanel from '@/components/map/MapPanel';
import CheckboxInput from '@/components/ui/CheckboxInput';
// Utils
import { articleUrl, landmarkOfModel, modelFactRows, wikipediaUrlFor } from '@/utils/map/landmarkModelInfo';

const CREDIT_LINK = 'underline underline-offset-2 hover:text-colour6';

/**
 * A little 3D landmark model pressed on a country's own map (CountryMapView; 24 Nov 2026, the
 * user's wishes), or chosen from its list: a panel in the middle of the screen over the dimmed
 * map (the whole screen less a margin on phones), the model's name in its title strip, so a long
 * one wraps there. Two columns from `lg` (one above the other on smaller screens):
 *   - the model alone, big, in the middle of its column;
 *   - about the place: a few sentences from its Wikipedia article (utils/map/landmarkModelFacts.js,
 *     its own chunk: useModelFacts), its facts (where, the landmark it's part of, when it dates
 *     from, height or elevation, architects, the World Heritage Site), an editor's "Been here"
 *     tick (the landmark's, as on the country ticket's cards: it stamps the passport, and a first
 *     stamp is celebrated with this very model, `onToggle`'s `modelId`; a photo's stamp shows it
 *     ticked, not to be taken off; viewers see whether the map has been), and the article and the
 *     licence credited.
 * Escape, its close stamp or a press on the dimmed map shuts it; focus is on its title as it
 * opens (MapPanel). CountryMapView keys it by model, so a new one starts afresh.
 */
function LandmarkModelCard({ model, stateName = null, countryName = null, onClose }) {
  const aboutId = useId();
  const { landmarks } = useLandmarks(null);
  const landmark = landmarkOfModel(landmarks, model);
  const factsData = useModelFacts();
  const facts = factsData?.MODEL_FACTS?.[model.id] || null;
  const textLicence = factsData?.TEXT_LICENCE;
  const marks = useLandmarkMarks();
  const [tickError, setTickError] = useState('');
  const rows = modelFactRows({ model, facts, stateName, countryName, landmark });
  const readMore = facts ? articleUrl(facts.article) : wikipediaUrlFor(model.landmark);
  // A tick first: it can be taken off (a photo's stamp stays)
  const ticked = landmark ? marks.ticked.has(landmark.id) : false;
  const photoStamped = landmark ? !ticked && marks.stamped.has(landmark.id) : false;
  const been = ticked || photoStamped;

  const toggle = (on) => {
    setTickError('');
    Promise.resolve(marks.onToggle(landmark.id, on, { modelId: model.id })).catch((err) =>
      setTickError(err?.friendlyMessage || 'That couldn’t be saved. Please try again.'),
    );
  };

  return (
    <div
      data-landmark-card={model.id}
      data-map-scrim=''
      className='absolute inset-0 z-30 grid bg-scrim p-3 nophone:place-items-center nophone:px-6 nophone:py-6'
      // A press on the dimmed map round it shuts it, as the map's other panels
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <MapPanel title={model.name} onClose={onClose} large>
        <div className='grid gap-6 lg:grid-cols-2 lg:gap-8'>
          <div className='grid place-items-center' data-landmark-model-picture=''>
            <img
              src={model.images[320]}
              alt=''
              width={Math.round(320 * model.aspect)}
              height={320}
              decoding='async'
              draggable='false'
              className='h-40 w-auto max-w-full select-none object-contain lg:h-64'
            />
          </div>

          <section aria-labelledby={aboutId} className='grid content-start gap-4' data-landmark-about=''>
            <h3 id={aboutId} className='font-travel text-xl uppercase leading-tight tracking-wide text-colour9'>
              About {model.name}
            </h3>
            {facts ? <p className='text-sm leading-relaxed'>{facts.text}</p> : null}
            {rows.length ? (
              <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-y-2 border-dashed border-poster-brown/50 py-3 text-sm'>
                {rows.map(([label, words]) => (
                  <React.Fragment key={label}>
                    <dt className='font-semibold'>{label}</dt>
                    <dd className='break-words'>{words}</dd>
                  </React.Fragment>
                ))}
              </dl>
            ) : null}

            {landmark && marks.onToggle ? (
              <div className='grid justify-items-start gap-1' data-landmark-been={been ? 'yes' : 'no'}>
                <CheckboxInput
                  id={`${aboutId}-been`}
                  checked={been}
                  disabled={photoStamped}
                  onChange={(e) => toggle(e.target.checked)}
                  label={<span className='text-base font-semibold'>Been here</span>}
                  ariaLabel={`Been to ${model.name}`}
                />
                {been ? (
                  <p className='text-xs font-semibold text-poster-red-deep'>{photoStamped ? 'Stamped in the passport by a photo' : 'Stamped in the passport'}</p>
                ) : null}
                {tickError ? (
                  <p role='alert' className='text-sm font-medium text-status-critical'>
                    {tickError}
                  </p>
                ) : null}
              </div>
            ) : been ? (
              <p className='text-sm font-semibold text-poster-red-deep' data-landmark-been='yes'>
                Been here: stamped in the passport
              </p>
            ) : null}

            {facts && textLicence ? (
              <p className='text-2xs leading-snug opacity-80'>
                Text from Wikipedia’s article{' '}
                <a href={readMore} target='_blank' rel='noopener noreferrer' className={CREDIT_LINK}>
                  {facts.article}
                </a>
                ,{' '}
                <a href={textLicence[1]} target='_blank' rel='noopener noreferrer' className={CREDIT_LINK}>
                  {textLicence[0]}
                </a>
              </p>
            ) : null}
            {readMore ? (
              <a href={readMore} target='_blank' rel='noopener noreferrer' className='justify-self-start text-sm font-semibold text-colour6 underline underline-offset-2'>
                Read more on Wikipedia
                <span className='sr-only'> (opens in a new tab)</span>
              </a>
            ) : null}
          </section>
        </div>
      </MapPanel>
    </div>
  );
}

export default LandmarkModelCard;
