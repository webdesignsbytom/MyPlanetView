import React, { useId, useRef, useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import PhotoUploadItem from './PhotoUploadItem';
import LockedMapNote from '@/components/plans/LockedMapNote';
import PlanUpgradeLink from '@/components/plans/PlanUpgradeLink';
// Utils
import { COUNTRY_OPTIONS, countryName } from '@/utils/map/countries';
import { runWithConcurrencyLimit } from '@/utils/functions/runWithConcurrencyLimit';
import { uploadPhoto } from '@/utils/photos/uploadPhoto';

const AT_ONCE = 2;
const number = (n) => Number(n).toLocaleString('en-GB');

// Choose or drop photos; each is read, resized, uploaded and saved, two at a time.
// Photos without a location, or with one at sea, go in `country` (if chosen); with
// neither, they're listed under Unplaced photos. `onUploaded` gets each new photo.
// The map owner's plan (docs/API.md, "Map limits"):
// - `uploadRules` ({ keepsOriginals, photosPerCountry, locked }): a locked map takes no
//   photos; Economy keeps a print copy instead of the original;
// - `photoCounts` (the map's photos per country, on the map page): the chosen country's
//   count against the cap, and at the cap the drop zone stops, with a way to upgrade
//   (`isOwner`: the owner's own plan; anyone else is told it's the owner's).
function PhotoUploader({ mapId, tripId, defaultCountryCode = '', onUploaded, uploadRules = null, photoCounts = null, isOwner = false }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [country, setCountry] = useState(defaultCountryCode || '');
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const busy = items.some((i) => !['done', 'failed'].includes(i.stage));

  const cap = uploadRules?.photosPerCountry ?? null;
  const count = country && photoCounts && cap !== null ? photoCounts[country] || 0 : null;
  const full = count !== null && count >= cap;
  const keepsPrintCopy = uploadRules?.keepsOriginals === false;

  const update = (id, patch) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const start = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || full) return;
    const added = files.map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      name: file.name,
      file,
      stage: 'waiting',
      progress: 0,
      error: null,
      note: null,
    }));
    setItems((prev) => [...added, ...prev]);

    await runWithConcurrencyLimit(AT_ONCE, added, async (item) => {
      try {
        const { photo, hadLocation } = await uploadPhoto({
          mapId,
          tripId,
          file: item.file,
          countryCode: country,
          uploadRules,
          onStage: (stage) => update(item.id, { stage }),
          onProgress: (progress) => update(item.id, { progress }),
        });
        // A location in no country (at sea) falls back on the chosen country, like no location
        const note = !photo.countryCode
          ? hadLocation
            ? 'Its location isn’t in any country, so it’s under Unplaced photos until you choose one.'
            : 'No location in the file, so it’s under Unplaced photos until you choose a country.'
          : hadLocation && photo.countryCode !== country
            ? `Placed in ${countryName(photo.countryCode)} from its location.`
            : hadLocation
              ? `Placed in ${countryName(photo.countryCode)}.`
              : `No location in the file, so it went in ${countryName(photo.countryCode)}.`;
        update(item.id, { stage: 'done', note, file: null });
        onUploaded?.(photo);
      } catch (err) {
        update(item.id, { stage: 'failed', error: err.friendlyMessage || err.message || 'Something went wrong.', file: null });
      }
    });
  };

  if (uploadRules?.locked) return <LockedMapNote isOwner={isOwner} />;

  return (
    <div className='grid gap-4'>
      <FormField
        id={`${inputId}-country`}
        label='Country for photos with no location'
        hint='Phones usually save the place; this is for the ones that don’t, or whose place is out at sea.'
      >
        <PlainOptionSelect
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          options={[{ value: '', label: 'Leave unset' }, ...COUNTRY_OPTIONS]}
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
        <span className='font-travel text-xl uppercase tracking-wide text-colour6'>Choose photos</span>
        <span className='opacity-80'>or drop them here. JPEG, PNG or WebP, up to 50 MB each.</span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        accept='image/jpeg,image/png,image/webp'
        multiple
        disabled={full}
        className='sr-only'
        onChange={(e) => {
          start(e.target.files);
          e.target.value = '';
        }}
      />

      {keepsPrintCopy ? (
        <p className='border-l-4 border-poster-brown pl-3 text-sm'>
          Economy keeps a print-quality copy (good up to A4). Business keeps your full-size originals.
        </p>
      ) : null}
      <p className='text-xs opacity-80'>
        {keepsPrintCopy
          ? 'Every copy has the location taken out. Only you and your editors see where each photo was taken.'
          : 'The copies people see have the location taken out. The original keeps it, and only you and your editors can download it.'}
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
