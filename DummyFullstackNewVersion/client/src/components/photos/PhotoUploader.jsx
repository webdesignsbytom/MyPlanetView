import React, { useId, useRef, useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import PhotoUploadItem from './PhotoUploadItem';
// Utils
import { COUNTRY_OPTIONS, countryName } from '@/utils/map/countries';
import { runWithConcurrencyLimit } from '@/utils/functions/runWithConcurrencyLimit';
import { uploadPhoto } from '@/utils/photos/uploadPhoto';

const AT_ONCE = 2;

// Choose or drop photos; each is read, resized, uploaded and saved, two at a time.
// Photos without a location go in `country` (if chosen). `onUploaded` gets each new photo.
function PhotoUploader({ mapId, tripId, defaultCountryCode = '', onUploaded }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [country, setCountry] = useState(defaultCountryCode || '');
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const busy = items.some((i) => !['done', 'failed'].includes(i.stage));

  const update = (id, patch) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const start = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
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
          onStage: (stage) => update(item.id, { stage }),
          onProgress: (progress) => update(item.id, { progress }),
        });
        const note = hadLocation
          ? photo.countryCode
            ? `Placed in ${countryName(photo.countryCode)} from its location.`
            : 'It has a location, but not on any country on the map.'
          : country
            ? `No location in the file, so it went in ${countryName(country)}.`
            : 'No location in the file: open it to choose a country.';
        update(item.id, { stage: 'done', note, file: null });
        onUploaded?.(photo);
      } catch (err) {
        update(item.id, { stage: 'failed', error: err.friendlyMessage || err.message || 'Something went wrong.', file: null });
      }
    });
  };

  return (
    <div className='grid gap-4'>
      <FormField id={`${inputId}-country`} label='Country for photos with no location' hint='Phones usually save the place; this is for the ones that don’t.'>
        <PlainOptionSelect
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          options={[{ value: '', label: 'Leave unset' }, ...COUNTRY_OPTIONS]}
        />
      </FormField>

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          start(e.dataTransfer.files);
        }}
        className={`grid cursor-pointer place-items-center gap-1 rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm ${
          dragging ? 'border-colour6 bg-colour3' : 'border-colour5/50'
        }`}
      >
        <span className='font-semibold'>Choose photos</span>
        <span className='opacity-80'>or drop them here. JPEG, PNG, WebP or HEIC, up to 50 MB each.</span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'
        multiple
        className='sr-only'
        onChange={(e) => {
          start(e.target.files);
          e.target.value = '';
        }}
      />

      <p className='text-xs opacity-80'>
        The copies people see have the location taken out. The original keeps it, and only you and your editors
        can download it.
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
