import React, { useEffect, useMemo, useRef, useState } from 'react';
// Icons
import { FaPlay } from 'react-icons/fa';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
import useMomentPage from '@/hooks/useMomentPage';
import useGalleryOffers from '@/hooks/useGalleryOffers';
import useSplitUk from '@/hooks/useSplitUk';
import usePlannedTripPlace from '@/hooks/usePlannedTripPlace';
// Components
import CountryTicket from './CountryTicket';
import CountryTicketStub from './CountryTicketStub';
import CountryNotes from './CountryNotes';
import MapActionButton from './MapActionButton';
import VisitStatusSelect from './VisitStatusSelect';
import FirstVisitDateField from './FirstVisitDateField';
import CountryLandmarks from './CountryLandmarks';
import { ExpeditionStampIcon, PlaceBadgeIcon } from './StarBadge';
import VerifyFirstNote from './VerifyFirstNote';
import UkNationsPrompt from './UkNationsPrompt';
import MomentList from '@/components/moments/MomentList';
import PhotoGrid from '@/components/photos/PhotoGrid';
import PrintDownload from '@/components/photos/PrintDownload';
import TravelDesk from '@/components/offers/TravelDesk';
import FormField from '@/components/ui/FormField';
// Utils
import { CONTINENT_LABELS, COUNTRY_BY_CODE } from '@/utils/map/countries';
import { VISIT_STATUS_LABELS, countsAsVisited } from '@/utils/map/visitStatus';
import { formatDay } from '@/utils/functions/dates';
import { isMagneticPole, isSpecialPlace } from '@/utils/map/specialPlaces';

const NO_TRIPS = [];

// One country on this map, as a boarding pass (CountryTicket): its poster always on the
// stub to the left (CountryTicketStub), then its note, its status, when you first went,
// its moments, your photos from there and its landmarks. A special place (Antarctica or a
// pole) says so with a stamp, and a magnetic pole that it moves. The map page centres it
// on wide screens.
// Moments: `mapId` (editors add them; `trips` are the map's own, `travellers` its people,
// `onAddTraveller` adds a baby born here) and `onMomentsChanged` after a change (the
// map's marks count them). `onPlay(code)` plays the country's photos as a slideshow.
// Travel offers (docs/API.md, "Travel offers"): a card every `adEvery` photos (the map's
// `ads.every`; null for none), and the Travel Desk for this country, on every plan.
// `nextTrip` is the map's soonest planned trip (its list summary): where it goes is worked
// out only when a card or the desk needs it (fetched unless `canFetchTrips` is false, as
// through a share link). `mapKey` names the map in each card slot's seed.
// "Print or download" (docs/API.md, "Downloads"): the country's photos as a zip, for the
// map's editors (verified or not), never through a share link.
function CountryPanel({
  code,
  visit,
  // The map's visit for any place (the UK's ticket on a map that splits it asks about the nations)
  visitOf = () => null,
  canEdit,
  locked = false,
  onSetVisit,
  photoSource,
  photosVersion,
  onOpenPhoto,
  onPlay,
  onAddPhotos,
  mapId = null,
  travellers = [],
  trips = NO_TRIPS,
  onAddTraveller,
  onMomentsChanged,
  adEvery = null,
  nextTrip = null,
  canFetchTrips = true,
  mapKey = '',
  onClose,
}) {
  const country = COUNTRY_BY_CODE[code];
  const splitUk = useSplitUk();
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deskOpened, setDeskOpened] = useState(false);
  const photos = usePhotoPage({ ...photoSource, country: code, limit: 12, enabled: Boolean(code) });
  const moments = useMomentPage({ ...photoSource, country: code, enabled: Boolean(code) });
  const cardsDue = Boolean(adEvery) && photos.photos.length >= adEvery;
  const plannedTrip = usePlannedTripPlace(nextTrip, { enabled: cardsDue || deskOpened, canFetch: canFetchTrips });
  const offerSlots = useGalleryOffers({ every: adEvery, slotKey: `${mapKey}:${code}`, country: code, plannedTrip });
  const deskCountries = useMemo(() => [code], [code]);
  const { reload } = photos;
  const { reload: reloadMoments } = moments;

  // A new upload or edit elsewhere on the page: show it here too (and in the moments,
  // whose photos may have been hidden or deleted)
  const seenVersionRef = useRef(photosVersion);
  useEffect(() => {
    if (photosVersion === seenVersionRef.current) return;
    seenVersionRef.current = photosVersion;
    reload();
    reloadMoments();
  }, [photosVersion, reload, reloadMoments]);

  if (!country) return null;
  const status = visit?.status || null;
  const special = isSpecialPlace(code);
  const continent = CONTINENT_LABELS[country.continent];

  // On a map that splits the UK, the UK itself is marked only from before the split: its
  // ticket asks which nations that means (UkNationsPrompt) instead of offering a status
  const ukToPlace = splitUk && code === 'GB';
  const chooseNations = async (codes) => {
    // The UK's note goes with it to each nation that has none
    for (const nation of codes) {
      await onSetVisit(nation, status, visit?.notes && !visitOf(nation)?.notes ? { notes: visit.notes } : undefined);
    }
    await onSetVisit(code, null);
    onClose();
  };

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

  // The kicker over the name: the place's badge once visited, and its continent
  const kicker = (
    <p className='grid grid-cols-reg items-center justify-start gap-2'>
      {countsAsVisited(status) ? (
        <PlaceBadgeIcon code={code} lived={status === 'LIVED'} className='h-7 w-7 -rotate-6 drop-shadow-md' />
      ) : null}
      <span>{continent || 'The world'}</span>
    </p>
  );

  return (
    <CountryTicket
      title={country.name}
      kicker={kicker}
      onClose={onClose}
      stub={<CountryTicketStub code={code} countryName={country.name} status={status} firstVisitedOn={visit?.firstVisitedOn} />}
    >
      {special ? (
        <p className='grid justify-start'>
          <span className='grid -rotate-2 grid-cols-reg items-center gap-1.5 border-2 border-double border-colour9 px-2 py-0.5 font-travel text-xs uppercase tracking-wide text-colour9'>
            <ExpeditionStampIcon className='h-4 w-4' />
            Special place
          </span>
        </p>
      ) : null}
      {isMagneticPole(code) ? (
        <p className='text-sm'>
          The magnetic poles wander, tens of kilometres a year. This is where NOAA’s World Magnetic Model puts it for 2025.
        </p>
      ) : null}

      {/* The note belongs to the visit, so an editor writes one once the country has a status */}
      <CountryNotes
        code={code}
        notes={visit?.notes}
        canEdit={canEdit && Boolean(status)}
        onSave={(notes) => onSetVisit(code, status, { notes })}
      />

      {ukToPlace && status ? <UkNationsPrompt ukStatus={status} visitOf={visitOf} canEdit={canEdit} onChoose={chooseNations} /> : null}

      {canEdit && !ukToPlace ? (
        // Never disabled while saving (that drops focus); the saves are optimistic
        <div className='grid items-start gap-3 sm:grid-cols-2' aria-busy={saving ? 'true' : undefined}>
          <FormField id={`visit-${code}`} label='Been there?'>
            <VisitStatusSelect
              labelled
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
      {locked ? <VerifyFirstNote action='mark countries, write notes, or add moments and photos' /> : null}
      {error ? (
        <p role='alert' className='rounded-lg border px-3 py-2 text-sm tone-danger'>
          {error}
        </p>
      ) : null}

      <section className='grid gap-2' aria-labelledby={`moments-${code}`}>
        <h3 id={`moments-${code}`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
          Moments
        </h3>
        <MomentList
          inPanel
          list={moments}
          canEdit={canEdit && Boolean(mapId)}
          travellers={travellers}
          trips={trips}
          onOpenPhoto={onOpenPhoto}
          onChanged={onMomentsChanged}
          emptyText={`No moments in ${country.name} yet.`}
          form={{
            mapId,
            countryCode: code,
            trips,
            travellers,
            photoSource: { ...photoSource, country: code },
            wholeMap: photoSource,
            visitStatus: status,
            onMarkVisit: (next) => save(next),
            onAddTraveller,
          }}
        />
      </section>

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
          onMove={canEdit ? (photoId, afterId) => photos.movePhoto(photoId, afterId, 'country') : undefined}
          offerSlots={offerSlots}
          emptyText={`No photos from ${country.name} yet.`}
        />
        {onPlay && photos.photos.length ? (
          <MapActionButton quiet onClick={() => onPlay(code)}>
            <FaPlay aria-hidden='true' className='self-center text-sm' />
            <span>Slideshow of {country.name}</span>
          </MapActionButton>
        ) : null}
        {canEdit && onAddPhotos ? (
          <MapActionButton onClick={() => onAddPhotos(code)}>Add photos from {country.name}</MapActionButton>
        ) : null}
        {(canEdit || locked) && photoSource?.mapId && photos.photos.length ? (
          <PrintDownload inMapPanel scope={{ mapId: photoSource.mapId, country: code }} title={country.name} />
        ) : null}
      </section>

      {/* Partner offers for this country, only when asked for (every plan), before the
          landmarks, whose list can be long */}
      <TravelDesk
        inMapPanel
        countryCodes={deskCountries}
        trip={plannedTrip && plannedTrip.stops.some((s) => s.countryCode === code) ? plannedTrip : null}
        onOpen={() => setDeskOpened(true)}
      />

      <CountryLandmarks countryCode={code} moments={moments.moments} />
    </CountryTicket>
  );
}

export default CountryPanel;
