import React, { useId, useMemo } from 'react';
import { Link } from 'react-router-dom';
// Hooks
import useModalA11y from '@/hooks/useModalA11y';
import useLandmarks from '@/hooks/useLandmarks';
import useLandmarkMarks from '@/hooks/useLandmarkMarks';
import useSplitUk from '@/hooks/useSplitUk';
import useOneShotPhotos from '@/hooks/useOneShotPhotos';
import { useOneShotsHere } from '@/hooks/useOneShots';
// Components
import Button from '@/components/common/Button';
import CloseStamp from '@/components/common/CloseStamp';
import EntryStamp from '@/components/passport/EntryStamp';
import LandmarkStamp from '@/components/passport/LandmarkStamp';
import CelebrationStars from './CelebrationStars';
import CountryCelebrationPicture from './CountryCelebrationPicture';
import LandmarkModelImage from './LandmarkModelImage';
import LandmarkPhotoPrint from './LandmarkPhotoPrint';
import OneShotPicture from '@/components/oneShots/OneShotPicture';
// Utils
import { countryName } from '@/utils/map/countries';
import { CELEBRATION_KICKERS, countryCelebrationText, countryCelebrationTitle } from '@/utils/map/celebrations';
import { modelById, modelForLandmark, modelsForPlace } from '@/utils/map/celebrationModels';
import { ONE_SHOT_BY_KEY } from '@/utils/oneShots/oneShotItems';
import { ONE_SHOTS_NAME, oneShotProgress, progressWords } from '@/utils/oneShots/oneShotWords';
import { oneShotPhotoInfo } from '@/utils/oneShots/oneShotPhotoInfo';

/**
 * The celebration (24 Nov 2026, the user's wish): stars bursting out, the place's little 3D
 * model popping up, and its passport stamp coming down on a ticket that says so. MapExperience
 * opens it when the passport gains something by the viewer's own hand:
 *   - `{ kind: 'landmark', landmarkId, stampedOn, photoUrl, newPlace, modelId }`: a landmark
 *     stamped for the first time, ticked "been here" (`photoUrl` null) or a photo's match
 *     confirmed (that photo's picture). `newPlace`: the country (or nation) the tick marked
 *     visited too; `modelId`: ticked on that landmark model's card (a country's own map), so
 *     the celebration shows that model;
 *   - `{ kind: 'country', code, status, firstVisitedOn }`: a country (or a special place, a
 *     region, a UK nation) marked visited or lived in from its ticket: its page in the passport;
 *   - `{ kind: 'oneShot', itemKey, seenOn, datePrecision, countryCode, photoUrl }`: an item of
 *     Life's One Shots ticked for the first time (24 Nov 2026): its photo, and how far along its
 *     list is; no stamp and no passport button (the user: nothing in the passport yet).
 * The picture is the landmark's model, else the map's own photo, else its photo from Wikimedia
 * Commons; a country's is its outline above its models. A country's heading says it: "You
 * visited France!", and its words name it (24 Nov 2026, the user's wishes). The stamp is the
 * very one the passport shows (LandmarkStamp, EntryStamp). "Open passport" goes there. It
 * closes with its stamp, "Carry on", Escape or a press outside it. It has no box to turn it off
 * (24 Nov 2026, the user's wish): Settings, Help, has the switch (`showCelebrations`).
 */
function CelebrationDialog({ celebration, passportHref, onClose }) {
  const titleId = useId();
  const textId = useId();
  const dialogRef = useModalA11y(onClose);
  const splitUk = useSplitUk();
  const marks = useLandmarkMarks();
  const isLandmark = celebration.kind === 'landmark';
  // Life's One Shots (24 Nov 2026): an item ticked for the first time
  const isOneShot = celebration.kind === 'oneShot';
  const shot = isOneShot ? ONE_SHOT_BY_KEY.get(celebration.itemKey) : null;
  const shotPhotos = useOneShotPhotos({ enabled: isOneShot });
  const shotPhoto = shot ? oneShotPhotoInfo(shotPhotos, shot.key) : null;
  const { oneShots: ticks } = useOneShotsHere();

  // The landmark (its name, slug, item and place) from the session's list, which its card or
  // the photo's landmark list has already loaded
  const { landmarks } = useLandmarks(null, { enabled: isLandmark });
  const landmark = isLandmark ? landmarks.find((l) => l.id === celebration.landmarkId) || null : null;
  // Where it is: a UK landmark's nation on a map that splits the UK
  const place = isOneShot ? null : isLandmark ? (landmark ? (splitUk && landmark.nation) || landmark.countryCode : null) : celebration.code;
  const { landmarks: placeLandmarks } = useLandmarks(place, { enabled: Boolean(place) });
  // How many of the place's landmarks the map has been to now (this one included, before the
  // map's own reply catches up)
  const beenTo = useMemo(() => {
    const been = new Set([...marks.stamped, ...marks.ticked]);
    if (isLandmark) been.add(celebration.landmarkId);
    return placeLandmarks.filter((l) => been.has(l.id)).length;
  }, [marks, placeLandmarks, isLandmark, celebration.landmarkId]);

  const name = isOneShot ? shot?.name || '' : isLandmark ? landmark?.name || '' : countryName(celebration.code);
  // A country's heading says it all ("You visited France!"): no words over it
  const kicker = isOneShot ? CELEBRATION_KICKERS[shot?.list === 'JOURNEYS' ? 'done' : 'seen'] : isLandmark ? CELEBRATION_KICKERS.landmark : '';
  const heading = isOneShot || isLandmark ? name : countryCelebrationTitle(name, celebration.status);
  // Life's One Shots: how far along its list is (this one included)
  const shotProgress = shot ? oneShotProgress(ticks.some((t) => t.itemKey === shot.key) ? ticks : [...ticks, { itemKey: shot.key }])[shot.list] : null;
  // The model whose card the tick was on (a country's own map), else the landmark's own
  const model = isLandmark ? modelById(celebration.modelId) || modelForLandmark(landmark) : null;
  const countryModels = useMemo(() => (isLandmark ? [] : modelsForPlace(celebration.code)), [isLandmark, celebration.code]);
  const placeName = place ? countryName(place) : '';
  const total = placeLandmarks.length;

  return (
    <div
      className='fixed inset-0 z-60 grid grid-rows-[minmax(0,1fr)] place-items-center overflow-hidden bg-scrim px-4 py-6'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Darker than other dialogs' backdrop, so the picture and its stars stand out */}
      <div aria-hidden='true' className='pointer-events-none absolute inset-0 bg-scrim' />
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={textId}
        data-celebration={celebration.kind}
        className='grid max-h-full w-full max-w-sm grid-rows-[auto_minmax(0,1fr)] justify-items-center'
      >
        {/* The picture on the dimmed page, the stars bursting out round it */}
        {/* One cell as tall as the box (not its content), so the picture fits it */}
        <div aria-hidden='true' className='relative grid h-44 w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center sideways:h-28 nophone:h-52'>
          <CelebrationStars seed={isOneShot ? celebration.itemKey : isLandmark ? celebration.landmarkId : celebration.code} />
          {isOneShot ? (
            <div className='relative grid h-full place-items-center'>
              <span className='grid w-60 max-w-full -rotate-2 bg-poster-cream p-2 shadow-paper motion-safe:animate-model-pop'>
                {/* The map's own photo of it, when the tick has one; else its photo from Commons */}
                {celebration.photoUrl ? (
                  <img src={celebration.photoUrl} alt='' className='block aspect-[4/3] w-full object-cover' referrerPolicy='no-referrer' />
                ) : (
                  <OneShotPicture photo={shotPhoto} className='aspect-[4/3] w-full' />
                )}
              </span>
            </div>
          ) : isLandmark ? (
            model ? (
              <LandmarkModelImage model={model} height={11} className='relative h-full! max-w-full! object-contain motion-safe:animate-model-pop' />
            ) : landmark ? (
              <div className='relative grid h-full place-items-center'>
                <LandmarkPhotoPrint slug={landmark.slug} photoUrl={celebration.photoUrl} />
              </div>
            ) : null
          ) : (
            <div className='relative grid h-full w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]'>
              <CountryCelebrationPicture code={celebration.code} name={name} models={countryModels} />
            </div>
          )}
        </div>

        <div className='ticket-edge paper-fields relative grid max-h-full w-full grid-rows-[minmax(0,1fr)] overflow-hidden bg-paper-cream text-colour4 shadow-paper'>
          {/* Never scrolls (25 Nov 2026, the user's wish: "there should be no scrollbars on any of
              this"; the screen has room): the stamp waits to come down at 2.4× its size
              (stamp-slam), which gave a scrolling box a scrollbar each way as it opened. What
              passes the ticket's edge is cut off by the ticket (overflow-hidden), with no bar. */}
          <div className='grid min-h-0 content-start gap-4 px-5 pb-5 pt-4' data-celebration-body=''>
            {/* The words from the top, the close stamp in the corner beside them with the passport
                stamp under it (25 Nov 2026, the user's wish: a country's has no kicker, and its close
                stamp stood on a row of its own). A One Shot has no passport stamp (24 Nov 2026, the
                user: nothing in the passport yet) */}
            <div className={`grid items-start gap-3 ${isOneShot ? 'grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_7.5rem]'}`}>
              <div className='grid content-start gap-2'>
                {kicker ? <p className='font-travel text-lg uppercase tracking-wide text-poster-red-deep'>{kicker}</p> : null}
                <h2 id={titleId} className='font-travel text-2xl leading-tight text-colour6 [overflow-wrap:anywhere]'>
                  {heading}
                </h2>
                <p id={textId} className='text-sm'>
                  {isOneShot ? (
                    <>Ticked in {ONE_SHOTS_NAME}.</>
                  ) : isLandmark ? (
                    <>
                      Stamped in your passport.
                      {celebration.newPlace ? ` ${countryName(celebration.newPlace)} is on your map now, with its own page.` : ''}
                    </>
                  ) : (
                    countryCelebrationText(name, celebration.status, Boolean(celebration.firstVisitedOn))
                  )}
                </p>
              </div>
              <div className='grid justify-items-end gap-1'>
                <CloseStamp label='Close' onClick={onClose} small />
                {/* The stamp as the passport has it, pressed down onto the ticket. Room above it
                    (pt-3): tilted up to 10°, a 7.5rem stamp's top corner rises about 10px (24 Nov
                    2026, the user's report: Mongolia's was cut off) */}
                {isOneShot ? null : (
                <div aria-hidden='true' className='grid justify-self-stretch pt-3 motion-safe:animate-stamp-slam' data-celebration-stamp=''>
                  {isLandmark ? (
                    landmark ? (
                      <LandmarkStamp
                        stamp={{
                          landmarkId: landmark.id,
                          name: landmark.name,
                          isUnesco: landmark.isUnesco,
                          stampedOn: celebration.stampedOn,
                          ticked: !celebration.photoUrl,
                          photo: celebration.photoUrl ? { thumbUrl: celebration.photoUrl } : null,
                        }}
                      />
                    ) : null
                  ) : (
                    <EntryStamp countryCode={celebration.code} status={celebration.status} enteredOn={celebration.firstVisitedOn} />
                  )}
                </div>
                )}
              </div>
            </div>

            {shotProgress ? (
              <p className='text-sm font-medium' data-celebration-progress={shotProgress.have}>
                {progressWords(shot.list, shotProgress)} ticked.
              </p>
            ) : null}
            {total ? (
              <p className='text-sm font-medium' data-celebration-progress={beenTo}>
                {isLandmark
                  ? `Been to ${beenTo} of ${total} landmarks in ${placeName}.`
                  : beenTo
                    ? `Been to ${beenTo} of its ${total} landmarks: tick the others you’ve seen on its ticket.`
                    : `${total} ${total === 1 ? 'landmark' : 'landmarks'} to collect there: tick the ones you’ve seen on its ticket.`}
              </p>
            ) : null}

            {/* A One Shot isn't in the passport (yet): "Carry on" alone */}
            <div className={`grid gap-2 ${isOneShot ? '' : 'grid-cols-[minmax(0,1fr)_auto]'}`}>
              {/* To the place's own page: the passport opens from its cover straight to it
                  (24 Nov 2026, the user's wish), a landmark's the page its stamp is on */}
              {isOneShot ? null : (
                <Link
                  to={passportHref}
                  state={place ? { openAt: place } : undefined}
                  className='btn-paper grid-flow-col justify-center gap-2 text-center [--btn-leading:1.25rem] [--btn-pad-x:0.75rem] [--btn-pad-y:0.375rem] [--btn-size:1rem]'
                >
                  Open passport
                </Link>
              )}
              <Button onClick={onClose}>Carry on</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CelebrationDialog;
