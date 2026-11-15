import React, { useEffect, useRef, useState } from 'react';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import MapPanel from './MapPanel';
import MapActionButton from './MapActionButton';
import VisitStatusSelect from './VisitStatusSelect';
import FirstVisitDateField from './FirstVisitDateField';
import CountryPoster from './CountryPoster';
import CountryLandmarks from './CountryLandmarks';
import { StarBadgeIcon } from './StarBadge';
import VerifyFirstNote from './VerifyFirstNote';
import PhotoGrid from '@/components/photos/PhotoGrid';
import FormField from '@/components/ui/FormField';
// Utils
import { CONTINENT_LABELS, COUNTRY_BY_CODE } from '@/utils/map/countries';
import { VISIT_STATUS_LABELS, countsAsVisited } from '@/utils/map/visitStatus';
import { formatDay } from '@/utils/functions/dates';

// One country on this map: its status, when you first went, your photos from there,
// its landmarks, and a poster if you haven't been yet.
function CountryPanel({ code, visit, canEdit, locked = false, onSetVisit, photoSource, photosVersion, onOpenPhoto, onAddPhotos, onClose }) {
  const country = COUNTRY_BY_CODE[code];
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const photos = usePhotoPage({ ...photoSource, country: code, limit: 12, enabled: Boolean(code) });
  const { reload } = photos;

  // A new upload or edit elsewhere on the page: show it here too
  const seenVersionRef = useRef(photosVersion);
  useEffect(() => {
    if (photosVersion === seenVersionRef.current) return;
    seenVersionRef.current = photosVersion;
    reload();
  }, [photosVersion, reload]);

  if (!country) return null;
  const status = visit?.status || null;

  const save = async (nextStatus, extra) => {
    setSaving(true);
    setError(null);
    try {
      await onSetVisit(code, nextStatus, extra);
    } catch (err) {
      setError(err.friendlyMessage || 'That change could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MapPanel title={country.name} onClose={onClose}>
      <div className='grid grid-cols-reg items-center gap-2'>
        {countsAsVisited(status) ? (
          <StarBadgeIcon lived={status === 'LIVED'} className='h-9 w-9 -rotate-6 drop-shadow-md' />
        ) : null}
        <p className='text-sm opacity-80'>{CONTINENT_LABELS[country.continent]}</p>
      </div>

      {canEdit ? (
        // Never disabled while saving (that drops focus); the saves are optimistic
        <div className='grid items-start gap-3 sm:grid-cols-2' aria-busy={saving ? 'true' : undefined}>
          <FormField id={`visit-${code}`} label='Status'>
            <VisitStatusSelect
              countryName={country.name}
              status={status}
              onChange={(next) => save(next, next ? { firstVisitedOn: visit?.firstVisitedOn || undefined } : undefined)}
            />
          </FormField>
          {status && status !== 'WANT_TO_GO' ? (
            <FirstVisitDateField
              id={`first-visit-${code}`}
              value={visit?.firstVisitedOn || ''}
              onSave={(date) => save(status, { firstVisitedOn: date })}
            />
          ) : null}
        </div>
      ) : (
        <p className='text-sm font-medium'>
          {status ? VISIT_STATUS_LABELS[status] : 'Not been yet'}
          {visit?.firstVisitedOn ? `, first on ${formatDay(visit.firstVisitedOn)}` : ''}
        </p>
      )}
      {locked ? <VerifyFirstNote action='mark countries or add photos' /> : null}
      {error ? (
        <p role='alert' className='rounded-lg border px-3 py-2 text-sm tone-danger'>
          {error}
        </p>
      ) : null}

      <section className='grid gap-2' aria-labelledby={`photos-${code}`}>
        <h3 id={`photos-${code}`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
          Photos
        </h3>
        <PhotoGrid
          narrow
          photos={photos.photos}
          loading={photos.loading}
          error={photos.error}
          hasMore={Boolean(photos.nextCursor)}
          onLoadMore={photos.loadMore}
          onOpen={onOpenPhoto}
          emptyText={`No photos from ${country.name} yet.`}
        />
        {canEdit && onAddPhotos ? (
          <MapActionButton onClick={() => onAddPhotos(code)}>Add photos from {country.name}</MapActionButton>
        ) : null}
      </section>

      <CountryLandmarks countryCode={code} />

      {!countsAsVisited(status) ? <CountryPoster code={code} countryName={country.name} /> : null}
    </MapPanel>
  );
}

export default CountryPanel;
