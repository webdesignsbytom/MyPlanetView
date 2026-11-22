import React, { useEffect, useMemo, useRef, useState } from 'react';
// Icons
import { FaMapMarkedAlt, FaPlay } from 'react-icons/fa';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
import useMomentPage from '@/hooks/useMomentPage';
import useGalleryOffers from '@/hooks/useGalleryOffers';
import useSplitUk from '@/hooks/useSplitUk';
import usePlannedTripPlace from '@/hooks/usePlannedTripPlace';
import useMediaQuery from '@/hooks/useMediaQuery';
import { NOT_PHONE_QUERY } from '@/utils/layout/phone';
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
import CountryPlannedTrips from './CountryPlannedTrips';
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
import { countryPhotoFilters } from '@/utils/map/preloadCountryLists';
import { regionParent } from '@/utils/map/regionPlaces';
import { countryMapCodeFor, countryMapInfo } from '@/utils/map/countryMapGeo';
import { getSubdivisions } from '@/api/travelApi';
import { NOTES_MAX } from '@/utils/map/visitNotes';

// A status's weight, to raise a nation to the UK's mark and never lower it
const STATUS_RANK = { WANT_TO_GO: 1, VISITED: 2, LIVED: 3 };

const NO_TRIPS = [];

// One country on this map, as a boarding pass (CountryTicket): its poster always on the
// stub to the left (CountryTicketStub), then its note, its status, when you first went,
// its moments, your photos from there and its landmarks. An editor's "Been there?" and
// "First went" sit in the stub under the poster from md up (17 Nov 2026, the user's wish);
// on phones the stub is too narrow, so they head the ticket's content. A special place (Antarctica or a
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
// A region (Bali, Tasmania: regionPlaces.js) has its own ticket, with its poster, status, first
// visit, note and the landmarks inside it; its photos and moments are its country's, which
// `onOpenPlace(code)` opens from here (18 Nov 2026, the user's wish).
// Planned trips (22 Nov 2026, the user's wish): `plannedTrips` are the trips planned to it
// (utils/trips/plannedTrips.js; none through a share link), and an editor's "Plan a trip"
// (`onPlanTrip(code)`) starts one with it as the first stop.
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
  plannedTrips = NO_TRIPS,
  onPlanTrip = null,
  onAddTraveller,
  onMomentsChanged,
  adEvery = null,
  nextTrip = null,
  canFetchTrips = true,
  mapKey = '',
  onOpenPlace,
  onOpenCountryMap,
  onClose,
}) {
  const country = COUNTRY_BY_CODE[code];
  // A region's country (Bali: Indonesia), where its photos, moments and landmarks are kept
  const parent = regionParent(code);
  const parentName = parent ? COUNTRY_BY_CODE[parent]?.name : null;
  const splitUk = useSplitUk();
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deskOpened, setDeskOpened] = useState(false);
  const photoFilters = useMemo(() => countryPhotoFilters(photoSource, code), [photoSource, code]);
  const photos = usePhotoPage({ ...photoFilters, enabled: Boolean(code) && !parent });
  const moments = useMomentPage({ ...photoSource, country: code, enabled: Boolean(code) && !parent });
  const cardsDue = Boolean(adEvery) && photos.photos.length >= adEvery;
  const plannedTrip = usePlannedTripPlace(nextTrip, { enabled: cardsDue || deskOpened, canFetch: canFetchTrips });
  const offerSlots = useGalleryOffers({ every: adEvery, slotKey: `${mapKey}:${code}`, country: code, plannedTrip });
  const deskCountries = useMemo(() => [parent ?? code], [parent, code]);
  // md and up: the status controls go in the stub (Tailwind's md, 48rem)
  const controlsInStub = useMediaQuery(NOT_PHONE_QUERY);
  // Its own map (a region's is its country's): how many of its states the map has been to
  const mapCode = countryMapCodeFor(code);
  const stateInfo = mapCode ? countryMapInfo(mapCode) : null;
  // The count is drawn at once as 0 while it loads, so the ticket's header doesn't change size
  // when it arrives (19 Nov 2026, the user's wish); kept with its country's code, so another
  // country's count never shows for a moment
  const [statesMarked, setStatesMarked] = useState({ code: null, count: 0 });
  const markedHere = statesMarked.code === mapCode ? statesMarked.count : 0;
  useEffect(() => {
    if (!mapCode || !stateInfo?.count || !photoSource) return undefined;
    let live = true;
    getSubdivisions(photoSource, mapCode)
      .then(({ subdivisions = [] }) => live && setStatesMarked({ code: mapCode, count: subdivisions.filter((s) => countsAsVisited(s.status)).length }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [mapCode, stateInfo?.count, photoSource]);
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
  // Moments belong to a place you've been: the section shows once the country is visited or
  // lived in (18 Nov 2026, the user's wish), or when it has some already (a status cleared
  // later never hides them)
  const showMoments = countsAsVisited(status) || moments.moments.length > 0;
  const special = isSpecialPlace(code);
  const continent = CONTINENT_LABELS[country.continent];

  // On a map that splits the UK, the UK itself is marked only from before the split: its
  // ticket asks which nations that means (UkNationsPrompt) instead of offering a status
  const ukToPlace = splitUk && code === 'GB';
  // `codes`: every nation ticked. Each is raised to the UK's status (never lowered), and the
  // UK's note and first visit go to the first of them: the note after its own, the date when
  // it's earlier. Nothing is lost when the nations ticked were marked already (19 Nov 2026,
  // the audit: the note was deleted with the UK's mark, and the date never carried over)
  const chooseNations = async (codes) => {
    const [first] = codes;
    for (const nation of codes) {
      const current = visitOf(nation);
      const raise = (STATUS_RANK[current?.status] ?? 0) < STATUS_RANK[status];
      const extra = {};
      if (nation === first && visit?.notes) {
        extra.notes = current?.notes ? `${current.notes}\n\n${visit.notes}`.slice(0, NOTES_MAX) : visit.notes;
      }
      if (nation === first && visit?.firstVisitedOn && (!current?.firstVisitedOn || visit.firstVisitedOn < current.firstVisitedOn)) {
        extra.firstVisitedOn = visit.firstVisitedOn;
      }
      const hasExtra = Object.keys(extra).length > 0;
      if (raise || hasExtra) await onSetVisit(nation, raise ? status : current.status, hasExtra ? extra : undefined);
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

  // The kicker over the name: the place's badge once visited, and its continent (a
  // region's country)
  const kicker = (
    <p className='grid grid-cols-reg items-center justify-start gap-2'>
      {countsAsVisited(status) ? (
        <PlaceBadgeIcon code={code} lived={status === 'LIVED'} className='h-7 w-7 -rotate-6 drop-shadow-md' />
      ) : null}
      <span>{parentName ? `A region of ${parentName}` : continent || 'The world'}</span>
    </p>
  );

  // Marking the country, for editors (the UK on a split map asks about its nations instead).
  // Never disabled while saving (that drops focus); the saves are optimistic.
  const editsStatus = canEdit && !ukToPlace;
  const statusControls = editsStatus ? (
    <div className={`grid w-full items-start gap-3 ${controlsInStub ? '' : 'sm:grid-cols-2'}`} aria-busy={saving ? 'true' : undefined}>
      <FormField id={`visit-${code}`} label='Been there?'>
        <VisitStatusSelect
          labelled
          countryName={country.name}
          status={status}
          onChange={(next) => save(next, next ? { firstVisitedOn: visit?.firstVisitedOn || undefined } : undefined)}
        />
      </FormField>
      {status && status !== 'WANT_TO_GO' ? (
        <FirstVisitDateField id={`first-visit-${code}`} value={visit?.firstVisitedOn || ''} onSave={(date) => save(status, { firstVisitedOn: date })} />
      ) : null}
      {error ? (
        <p role='alert' className='rounded-lg border px-3 py-2 text-sm tone-danger sm:col-span-2'>
          {error}
        </p>
      ) : null}
    </div>
  ) : null;

  return (
    <CountryTicket
      title={country.name}
      kicker={kicker}
      // How many of its states the map has been to, under its name
      subtitle={
        stateInfo?.count > 1 ? (
          <span data-states-marked='' aria-busy={statesMarked.code === mapCode ? undefined : 'true'}>
            {markedHere} of {stateInfo.count} {stateInfo.word[1]} visited{mapCode !== code ? ` in ${COUNTRY_BY_CODE[mapCode]?.name}` : ''}
          </span>
        ) : null
      }
      // The country on its own, with its states and pins (a region opens its country's).
      // Smaller on phones and tablets, where it shares the continent's row (CountryTicket).
      action={
        mapCode && onOpenCountryMap ? (
          <button
            type='button'
            onClick={() => onOpenCountryMap(mapCode)}
            aria-label={mapCode === code ? `Open ${country.name} on its own map` : `Open the map of ${COUNTRY_BY_CODE[mapCode]?.name ?? mapCode}`}
            className='btn-paper grid-flow-col gap-2 [--btn-leading:1.25rem] [--btn-pad-x:0.625rem] [--btn-pad-y:0.3125rem] [--btn-size:0.875rem] lg:[--btn-leading:1.75rem] lg:[--btn-pad-x:0.75rem] lg:[--btn-pad-y:0.375rem] lg:[--btn-size:0.9375rem]'
          >
            <FaMapMarkedAlt aria-hidden='true' className='self-center' />
            <span className='phone:sr-only'>Open country</span>
          </button>
        ) : null
      }
      onClose={onClose}
      stub={
        <CountryTicketStub
          code={code}
          countryName={country.name}
          status={status}
          firstVisitedOn={visit?.firstVisitedOn}
          controls={controlsInStub ? statusControls : null}
        />
      }
    >
      {special ? (
        <p className='grid justify-start'>
          <span className='grid -rotate-2 grid-cols-reg items-center gap-1.5 border-2 border-double border-colour9 px-2 py-0.5 font-travel text-xs uppercase tracking-wide text-colour9'>
            <ExpeditionStampIcon className='h-4 w-4' />
            Special place
          </span>
        </p>
      ) : null}
      {parent ? (
        <p className='grid justify-start'>
          <span className='-rotate-2 border-2 border-double border-colour9 px-2 py-0.5 font-travel text-xs uppercase tracking-wide text-colour9'>
            Region
          </span>
        </p>
      ) : null}
      {isMagneticPole(code) ? (
        <p className='text-sm'>
          The magnetic poles wander, tens of kilometres a year. This is where NOAA’s World Magnetic Model puts it for 2025.
        </p>
      ) : null}

      {/* On phones "Been there?" heads the content, before the notes (the stub is too narrow
          for it; 19 Nov 2026, the audit: it came after them) */}
      {editsStatus && !controlsInStub ? statusControls : null}

      {/* The note belongs to the visit, so an editor writes one once the country has a status */}
      <CountryNotes
        code={code}
        notes={visit?.notes}
        canEdit={canEdit && Boolean(status)}
        onSave={(notes) => onSetVisit(code, status, { notes })}
      />

      {ukToPlace && status ? <UkNationsPrompt ukStatus={status} visitOf={visitOf} canEdit={canEdit} onChoose={chooseNations} /> : null}

      {editsStatus ? null : (
        <p className='text-sm font-medium'>
          {status ? VISIT_STATUS_LABELS[status] : 'Not been yet'}
          {visit?.firstVisitedOn ? `, first on ${formatDay(visit.firstVisitedOn)}` : ''}
        </p>
      )}
      {locked ? <VerifyFirstNote action='mark countries, write notes, plan trips, or add moments and photos' /> : null}

      <CountryPlannedTrips code={code} trips={plannedTrips} />

      {parent ? (
        <section className='grid gap-2' aria-labelledby={`part-of-${code}`}>
          <h3 id={`part-of-${code}`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
            Part of {parentName}
          </h3>
          <p className='text-sm'>
            {country.name} has its own visit and note, but it’s never counted as a country: marking it visited or lived in marks{' '}
            {parentName} visited too. Its photos and moments are kept with {parentName}.
          </p>
          {onOpenPlace ? (
            <MapActionButton onClick={() => onOpenPlace(parent)}>Open {parentName}</MapActionButton>
          ) : null}
        </section>
      ) : (
        <>
      {showMoments ? (
      <section className='grid' aria-labelledby={`moments-${code}`}>
        <MomentList
          inPanel
          header={
            <h3 id={`moments-${code}`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
              Moments
            </h3>
          }
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
          onOpen={(photo) => onOpenPhoto(photo, { filters: photoFilters })}
          onMove={canEdit ? (photoId, afterId) => photos.movePhoto(photoId, afterId, 'country') : undefined}
          offerSlots={offerSlots}
          emptyText={`No photos from ${country.name} yet.`}
        />
      </section>
        </>
      )}

      {/* The slideshow, adding photos, the country's photos as a zip, and partner offers for
          it (every plan, only when asked for), before the landmarks, whose list can be long:
          side by side from lg, in equal columns that fill the row (18 Nov 2026, the user's
          wish: "Add photos" joined it the same day), one to a row below, evenly spaced (19
          Nov 2026, the user's wish: the slideshow sat further off, under the photos; the
          labels name no country) */}
      <div className='grid gap-2 lg:auto-cols-fr lg:grid-flow-col'>
        {!parent && onPlay && photos.photos.length ? (
          <MapActionButton quiet onClick={() => onPlay(code)}>
            <FaPlay aria-hidden='true' className='self-center text-sm' />
            <span>Play slideshow</span>
          </MapActionButton>
        ) : null}
        {!parent && canEdit && onAddPhotos ? (
          <MapActionButton onClick={() => onAddPhotos(code)}>Add photos</MapActionButton>
        ) : null}
        {canEdit && onPlanTrip ? <MapActionButton onClick={() => onPlanTrip(code)}>Plan a trip</MapActionButton> : null}
        {!parent && (canEdit || locked) && photoSource?.mapId && photos.photos.length ? (
          <PrintDownload inMapPanel fill scope={{ mapId: photoSource.mapId, country: code }} title={country.name} />
        ) : null}
        <TravelDesk
          inMapPanel
          fill
          countryCodes={deskCountries}
          trip={plannedTrip && plannedTrip.stops.some((s) => s.countryCode === (parent ?? code)) ? plannedTrip : null}
          onOpen={() => setDeskOpened(true)}
        />
      </div>

      {/* A region's: its country's landmarks inside it (useLandmarks) */}
      <CountryLandmarks countryCode={code} moments={parent ? [] : moments.moments} />
    </CountryTicket>
  );
}

export default CountryPanel;
