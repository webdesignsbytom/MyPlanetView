import React, { Suspense, lazy, useCallback, useEffect, useId, useState } from 'react';
import { Link, generatePath, useParams, useSearchParams } from 'react-router-dom';
// Api
import { getPassport } from '@/api/travelApi';
// Constants
import { MAP_PASSPORT_PAGE_URL, SHARED_PAGE_URL, SHARED_PASSPORT_PAGE_URL, mapPath } from '@/utils/constants/routes';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
import PassportBook from '@/components/passport/PassportBook';
import BadgeOwnerSwitch from '@/components/achievements/BadgeOwnerSwitch';

// Opened from a stamp, and only then fetched
const PhotoViewer = lazy(() => import('@/components/photos/PhotoViewer'));
const StampPhotoPicker = lazy(() => import('@/components/passport/StampPhotoPicker'));

/**
 * A map's passport (docs/API.md, "Passport"): /maps/:mapId/passport for anyone with a role
 * on the map, /shared/:code/passport through a map's share link (read only, whoever opens
 * it: choosing a stamp's photo happens on the map's own address). The owner and editors
 * (the API marks their stamps with `photoChosen`) can pick each stamp's photo.
 * On a family's map, each traveller has their own passport too (21 Nov 2026, the user's wish:
 * each child's own passport): "Whose passport" picks one (`?traveller=<id>`, so it can be
 * linked), and the book has only their places and stamps, their name on its cover.
 */
function PassportPage() {
  const { mapId, code } = useParams();
  const shareCode = code || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const holderId = searchParams.get('traveller') || null;
  const headingId = useId();
  const [passport, setPassport] = useState(null);
  // Every traveller on the map, kept while one traveller's passport shows (for the switch)
  const [travellers, setTravellers] = useState([]);
  const [error, setError] = useState(null);
  const [photoId, setPhotoId] = useState(null);
  const [picking, setPicking] = useState(null); // { stamp }
  const mustVerify = useMustVerifyEmail();

  // Another map: start afresh (another traveller keeps the book on show while theirs loads)
  useEffect(() => {
    setPassport(null);
    setTravellers([]);
  }, [mapId, shareCode]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getPassport(shareCode ? { shareCode } : { mapId }, { travellerId: holderId })
      .then(({ passport: loaded }) => {
        if (cancelled) return;
        setPassport(loaded);
        setTravellers(loaded.travellers);
      })
      .catch((err) => {
        if (cancelled) return;
        setPassport(null);
        if (err.response?.status !== 404) setError(err.friendlyMessage || 'The passport could not be opened.');
        else if (holderId) setError('That traveller isn’t on this map any more.');
        else if (shareCode) setError('This link doesn’t work. It may have been reset, or sharing may have been turned off.');
        else setError('This map doesn’t exist, or it hasn’t been shared with you.');
      });
    return () => {
      cancelled = true;
    };
  }, [mapId, shareCode, holderId]);

  // After a stamp's photo changes: the passport again, in place
  const reload = useCallback(async () => {
    const { passport: loaded } = await getPassport({ mapId }, { travellerId: holderId });
    setPassport(loaded);
  }, [mapId, holderId]);

  // A family's map: a passport each (as its badges are: a couple travels together)
  const perPerson = passport?.map.groupType === 'FAMILY' && travellers.length > 1;
  const holder = passport?.map.traveller ?? null;
  const chooseHolder = (id) => setSearchParams(id ? { traveller: id } : {}, { replace: true });

  // The owner and editors get `photoChosen` on their stamps; never through a share link
  const canPick = !shareCode && Boolean(passport?.pages.some((page) => page.stamps.some((stamp) => stamp.photoChosen !== undefined)));
  const openPhoto = useCallback((id) => setPhotoId(id), []);
  const pickPhoto = useCallback((stamp) => setPicking({ stamp }), []);
  const backTo = shareCode ? generatePath(SHARED_PAGE_URL, { code: shareCode }) : mapPath(mapId);

  return (
    <>
      <AppPageHead route={shareCode ? SHARED_PASSPORT_PAGE_URL : MAP_PASSPORT_PAGE_URL} title={passport ? `${passport.map.name}: passport` : undefined} />
      <AppPageShell width='max-w-4xl' mainProps={{ 'aria-labelledby': headingId, 'aria-busy': !passport && !error ? 'true' : undefined }}>
        <PageTitleCard
          page='Passport'
          title={holder ? `${holder.name}’s passport` : passport?.map.name || 'Passport'}
          headingId={headingId}
          subtitle={
            holder
              ? `${holder.name}’s own: a page for every country they’ve been to, with a stamp for every landmark in their photos.`
              : 'A page for every country, in the order it was first visited, with a stamp for every landmark in the photos.'
          }
          stamp={['Passport', 'Control']}
        >
          <Link to={backTo} className='justify-self-start text-sm font-semibold text-poster-red-deep underline underline-offset-2'>
            Back to the map
          </Link>
        </PageTitleCard>

        {perPerson ? (
          <PaperCard>
            <BadgeOwnerSwitch label='Whose passport' everyone='The whole family' travellers={travellers} value={holderId} onChange={chooseHolder} />
          </PaperCard>
        ) : null}

        {canPick && mustVerify ? (
          <PaperCard>
            <VerifyFirstNote action='choose the photos your stamps show' />
          </PaperCard>
        ) : null}

        {error ? (
          <PaperCard>
            <InlineAlert>{error}</InlineAlert>
          </PaperCard>
        ) : null}
        {!passport && !error ? (
          <PaperCard>
            <div className='grid place-items-center py-10' role='status'>
              <LoadingSpinner md />
              <span className='sr-only'>Opening the passport…</span>
            </div>
          </PaperCard>
        ) : null}
        {passport ? (
          <PassportBook passport={passport} canPick={canPick} locked={mustVerify} onOpenPhoto={openPhoto} onPickPhoto={pickPhoto} />
        ) : null}
      </AppPageShell>

      {photoId ? (
        <Suspense fallback={null}>
          <PhotoViewer photoId={photoId} shareCode={shareCode} onClose={() => setPhotoId(null)} />
        </Suspense>
      ) : null}
      {picking ? (
        <Suspense fallback={null}>
          <StampPhotoPicker
            mapId={mapId}
            stamp={picking.stamp}
            onSaved={reload}
            onClose={() => setPicking(null)}
          />
        </Suspense>
      ) : null}
    </>
  );
}

export default PassportPage;
