import React, { useEffect, useId, useRef, useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import PhotoUploadItem from './PhotoUploadItem';
import LockedMapNote from '@/components/plans/LockedMapNote';
import PlanUpgradeLink from '@/components/plans/PlanUpgradeLink';
import AppLink from '@/components/common/AppLink';
// Constants
import { ACCOUNT_PAGE_URL } from '@/utils/constants/routes';
// Utils
import { countryName, countryOptionsFor } from '@/utils/map/countries';
import useSplitUk from '@/hooks/useSplitUk';
import { runWithConcurrencyLimit } from '@/utils/functions/runWithConcurrencyLimit';
import { VIDEO_MAX_SECONDS } from '@/utils/constants/plans';
import { VIDEO_MAX_BYTES, uploadPhoto } from '@/utils/photos/uploadPhoto';
import { VIDEOS_ARE_FIRST_CLASS, uploadVideo } from '@/utils/photos/uploadVideo';
import { isVideoFile } from '@/utils/photos/videoFile';
import { trackPhotosUploaded } from '@/utils/analytics/events';

const AT_ONCE = 2;
const MB = 1024 * 1024;
const number = (n) => Number(n).toLocaleString('en-GB');
const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
// MP4 and MOV, by type and by name (some systems give a .mov no type)
const VIDEO_ACCEPT = 'video/mp4,video/quicktime,.mp4,.m4v,.mov';

// What became of an upload, in a sentence
function placedNote(photo, { video, hadLocation, chosen }) {
  if (video) {
    const where = photo.countryCode
      ? `Videos keep no location, so it went in ${countryName(photo.countryCode)}.`
      : 'Videos keep no location, so it’s under Unplaced photos until you choose a country.';
    // Cloudflare Stream converts it first (docs/API.md "Videos")
    return photo.videoState === 'PROCESSING' ? `${where} It plays once it’s been prepared, usually within a few minutes.` : where;
  }
  // A location in no country (at sea) falls back on the chosen country, like no location
  if (!photo.countryCode) {
    return hadLocation
      ? 'Its location isn’t in any country, so it’s under Unplaced photos until you choose one.'
      : 'No location in the file, so it’s under Unplaced photos until you choose a country.';
  }
  if (hadLocation && photo.countryCode !== chosen) return `Placed in ${countryName(photo.countryCode)} from its location.`;
  if (hadLocation) return `Placed in ${countryName(photo.countryCode)}.`;
  return `No location in the file, so it went in ${countryName(photo.countryCode)}.`;
}

// Choose or drop photos (and, on a First Class map, videos); each is read, resized,
// uploaded and saved, two at a time.
// Photos without a location, or with one at sea, go in `country` (if chosen); with
// neither, they're listed under Unplaced photos. Videos keep no location, so they always
// go in `country` (docs/API.md, "Videos"). `onUploaded` gets each new photo, and
// `onBatchDone` runs once a batch has finished (whatever came of each), when at least one
// photo of it was saved.
// The map owner's plan (docs/API.md, "Map limits"):
// - `uploadRules` ({ keepsOriginals, photosPerCountry, videos, locked }): a locked map takes
//   no photos; Economy keeps a print copy instead of the original; `videos` (First Class
//   only, else null) says how many videos each country takes, and how long and big;
// - `photoCounts` and `videoCounts` (the map's photos and videos per country, on the map
//   page): the chosen country's counts against the caps, and at the photo cap the drop
//   zone stops, with a way to upgrade (`isOwner`: the owner's own plan; anyone else is
//   told it's the owner's).
function PhotoUploader({
  mapId,
  tripId,
  defaultCountryCode = '',
  onUploaded,
  onBatchDone,
  uploadRules = null,
  photoCounts = null,
  videoCounts = null,
  isOwner = false,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [country, setCountry] = useState(defaultCountryCode || '');
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  // The map's places: the UK's nations instead of it on a map that splits it
  const splitUk = useSplitUk();
  const busy = items.some((i) => !['done', 'failed'].includes(i.stage));
  const sendingVideo = items.some((i) => i.video && !['done', 'failed', 'waiting'].includes(i.stage));

  const cap = uploadRules?.photosPerCountry ?? null;
  const count = country && photoCounts && cap !== null ? photoCounts[country] || 0 : null;
  const full = count !== null && count >= cap;
  const keepsPrintCopy = uploadRules?.keepsOriginals === false;
  const videoRules = uploadRules?.videos || null;
  const videoCap = videoRules?.perCountry ?? null;
  const videoCount = country && videoCounts && videoCap !== null ? videoCounts[country] || 0 : null;
  const videoMinutes = Math.round((videoRules?.maxSeconds || VIDEO_MAX_SECONDS) / 60);
  const videoMegabytes = Math.round((videoRules?.maxBytes || VIDEO_MAX_BYTES) / MB);

  // A video is big: leaving the page mid-upload would throw it away, so the browser asks first
  useEffect(() => {
    if (!sendingVideo) return undefined;
    const ask = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', ask);
    return () => window.removeEventListener('beforeunload', ask);
  }, [sendingVideo]);

  const update = (id, patch) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const start = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || full) return;
    const added = files.map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      name: file.name,
      file,
      video: isVideoFile(file),
      stage: 'waiting',
      progress: 0,
      sent: 0,
      total: 0,
      error: null,
      note: null,
    }));
    setItems((prev) => [...added, ...prev]);

    let saved = 0;
    await runWithConcurrencyLimit(AT_ONCE, added, async (item) => {
      // Progress at most once per percent: a 500 MB video reports thousands of times
      let shown = -1;
      const onProgress = (progress, bytes) => {
        const percent = Math.floor(progress * 100);
        if (percent === shown) return;
        shown = percent;
        update(item.id, { progress, sent: bytes?.sent || 0, total: bytes?.total || 0 });
      };
      const onStage = (stage) => update(item.id, { stage });
      try {
        const { photo, hadLocation } = item.video
          ? await uploadVideo({
              mapId,
              tripId,
              file: item.file,
              countryCode: country,
              uploadRules,
              videoCount,
              onStage,
              onProgress,
            })
          : await uploadPhoto({ mapId, tripId, file: item.file, countryCode: country, uploadRules, onStage, onProgress });
        update(item.id, { stage: 'done', note: placedNote(photo, { video: item.video, hadLocation, chosen: country }), file: null });
        saved += 1;
        onUploaded?.(photo);
      } catch (err) {
        update(item.id, { stage: 'failed', error: err.friendlyMessage || err.message || 'Something went wrong.', file: null });
      }
    });
    if (saved) {
      trackPhotosUploaded(saved);
      onBatchDone?.();
    }
  };

  if (uploadRules?.locked) return <LockedMapNote isOwner={isOwner} />;

  return (
    <div className='grid gap-4'>
      <FormField
        id={`${inputId}-country`}
        label='Country for photos with no location'
        hint={
          videoRules
            ? 'Phones usually save the place; this is for the ones that don’t, whose place is out at sea, and for every video (videos keep no location).'
            : 'Phones usually save the place; this is for the ones that don’t, or whose place is out at sea.'
        }
      >
        <PlainOptionSelect
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          options={[{ value: '', label: 'Leave unset' }, ...countryOptionsFor(splitUk)]}
        />
      </FormField>

      {/* The chosen country against the map's cap (the map page knows the counts) */}
      {full ? (
        <div role='status' className='grid gap-1 rounded-lg border px-3 py-2 text-sm tone-danger'>
          <p className='font-semibold'>
            {number(count)} of {number(cap)} photos of {countryName(country)} on this map.
          </p>
          <p>
            That’s the most this map’s plan keeps of one country. Choose another country, or leave it unset, to add photos
            that carry their own location. <PlanUpgradeLink isOwner={isOwner} />
          </p>
        </div>
      ) : count !== null ? (
        <p className='text-sm' role='status'>
          {number(count)} of {number(cap)} photos of {countryName(country)} on this map.
        </p>
      ) : cap !== null && !photoCounts ? (
        <p className='text-sm'>This map keeps up to {number(cap)} photos of each country.</p>
      ) : null}
      {/* First Class: the chosen country's videos against their own cap */}
      {videoCount !== null ? (
        <p className={`text-sm ${videoCount >= videoCap ? 'font-semibold text-status-critical' : ''}`} role='status'>
          {number(Math.min(videoCount, videoCap))} of {number(videoCap)} videos of {countryName(country)} on this map.
        </p>
      ) : videoCap !== null && !videoCounts ? (
        <p className='text-sm'>This map keeps up to {number(videoCap)} videos of each country.</p>
      ) : null}

      <label
        htmlFor={inputId}
        aria-disabled={full ? 'true' : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          start(e.dataTransfer.files);
        }}
        className={`grid place-items-center gap-1 border-2 border-dashed px-4 py-8 text-center text-sm transition ${
          full
            ? 'cursor-not-allowed border-poster-brown/40 opacity-60'
            : dragging
              ? 'cursor-pointer border-poster-red bg-poster-paper/40'
              : 'cursor-pointer border-poster-brown/60 hover:bg-poster-paper/20'
        }`}
      >
        <span className='font-travel text-xl uppercase tracking-wide text-colour6'>
          {videoRules ? 'Choose photos or videos' : 'Choose photos'}
        </span>
        <span className='opacity-80'>
          or drop them here. JPEG, PNG or WebP, up to 50 MB each.
          {videoRules ? ` Videos: MP4 or MOV, up to ${videoMinutes} minutes and ${videoMegabytes} MB each.` : ''}
        </span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        accept={videoRules ? `${PHOTO_ACCEPT},${VIDEO_ACCEPT}` : PHOTO_ACCEPT}
        multiple
        disabled={full}
        className='sr-only'
        onChange={(e) => {
          start(e.target.files);
          e.target.value = '';
        }}
      />

      {keepsPrintCopy ? (
        <p className='text-sm'>
          Economy keeps a print-quality copy (good up to A4). Business keeps your full-size originals.
        </p>
      ) : null}
      {/* Videos on a map that isn't First Class: the owner gets a button to the plan on
          their account page; anyone else is told the plan is the owner's (16 Nov 2026) */}
      {videoRules ? null : (
        <div className='grid justify-items-start gap-2 text-sm'>
          <p>{VIDEOS_ARE_FIRST_CLASS}</p>
          {isOwner ? (
            <AppLink
              to={`${ACCOUNT_PAGE_URL}#account-plan-heading`}
              label='Upgrade to First Class'
              className='btn-poster [--btn-leading:1.25rem] [--btn-pad-x:0.875rem] [--btn-pad-y:0.375rem] [--btn-size:1rem]'
            />
          ) : (
            <p>
              <PlanUpgradeLink />
            </p>
          )}
        </div>
      )}
      <p className='text-xs opacity-80'>
        {keepsPrintCopy
          ? 'Every copy has the location taken out. Only you and your editors see where each photo was taken.'
          : 'The copies people see have the location taken out. The original keeps it, and only you and your editors can download it.'}
        {videoRules ? ' A video’s location is taken out before it uploads, as everyone who can see it can play it.' : ''}
      </p>

      {items.length ? (
        <ul className='grid gap-3' aria-live='polite' aria-busy={busy ? 'true' : 'false'}>
          {items.map((item) => (
            <PhotoUploadItem key={item.id} item={item} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default PhotoUploader;
