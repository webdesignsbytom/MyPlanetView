import React, { Suspense, lazy, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Link, generatePath, useLocation, useParams, useSearchParams } from 'react-router-dom';
// Api
import { getPassport, updateMap } from '@/api/travelApi';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Constants
import { MAP_PASSPORT_PAGE_URL, SHARED_PAGE_URL, SHARED_PASSPORT_PAGE_URL, mapPath } from '@/utils/constants/routes';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import PassportBook from '@/components/passport/PassportBook';
import BadgeOwnerSwitch from '@/components/achievements/BadgeOwnerSwitch';
import PassportCoverPicker from '@/components/passport/PassportCoverPicker';

// Opened from a stamp, and only then fetched
const PhotoViewer = lazy(() => import('@/components/photos/PhotoViewer'));
// A traveller's photo and signature (25 Nov 2026), fetched when one is opened
const TravellerPhotoDialog = lazy(() => import('@/components/passport/TravellerPhotoDialog'));
const TravellerSignatureDialog = lazy(() => import('@/components/passport/TravellerSignatureDialog'));

/**
 * A map's passport (docs/API.md, "Passport"): /maps/:mapId/passport for anyone with a role
 * on the map, /shared/:code/passport through a map's share link (read only, whoever opens
 * it). Nobody picks a stamp's photo here (24 Nov 2026, the user's wish): each shows its
 * earliest, or one picked before then.
 * On a family's map, each traveller has their own passport too (21 Nov 2026, the user's wish:
 * each child's own passport): "Whose passport" picks one (`?traveller=<id>`, so it can be
 * linked), and the book has only their places and stamps, their name on its cover.
 * Opened from a celebration's "Open passport" (24 Nov 2026, the user's wish), the link's state
 * names the place (`openAt`): the book opens from its cover straight to that place's page.
 * The map's editors give each traveller a passport photo and a signature on the travellers page
 * (25 Nov 2026, the user's wish: TravellerPhotoDialog, TravellerSignatureDialog); never through
 * a share link, and an unverified address is told why it can't yet. The owner and co-owners
 * choose the cover's colour under the book (26 Nov 2026, the user's wish: PassportCoverPicker),
 * shown at once and put back if it can't be saved; never through a share link.
 */
function PassportPage() {
  const { mapId, code } = useParams();
  const shareCode = code || null;
  const openAt = useLocation().state?.openAt ?? null;
  const [searchParams, setSearchParams] = useSearchParams();
  const holderId = searchParams.get('traveller') || null;
  const headingId = useId();
  const [passport, setPassport] = useState(null);
  // Every traveller on the map, kept while one traveller's passport shows (for the switch)
  const [travellers, setTravellers] = useState([]);
  const [error, setError] = useState(null);
  const [photoId, setPhotoId] = useState(null);
  // A traveller's photo or signature being changed: { kind: 'photo'|'signature', traveller }
  const [editing, setEditing] = useState(null);
  const mustVerifyEmail = useMustVerifyEmail();
  const [cover, setCover] = useState({ busy: false, error: '' });

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

  // A family's map: a passport each (as its badges are: a couple travels together)
  const perPerson = passport?.map.groupType === 'FAMILY' && travellers.length > 1;
  const holder = passport?.map.traveller ?? null;
  const chooseHolder = (id) => setSearchParams(id ? { traveller: id } : {}, { replace: true });

  const openPhoto = useCallback((id) => setPhotoId(id), []);
  const canEditTravellers = Boolean(passport?.map.canEdit) && !shareCode;
  const travellerEdit = useMemo(
    () =>
      canEditTravellers
        ? {
            onEditPhoto: (traveller) => setEditing({ kind: 'photo', traveller }),
            onEditSignature: (traveller) => setEditing({ kind: 'signature', traveller }),
            locked: mustVerifyEmail,
          }
        : null,
    [canEditTravellers, mustVerifyEmail],
  );
  // The cover's colour: on the book at once, saved on the map, put back if it can't be
  const chooseCover = useCallback(
    async (colour) => {
      const before = passport?.map.passportColour ?? null;
      const setColour = (value) => setPassport((current) => (current ? { ...current, map: { ...current.map, passportColour: value } } : current));
      setColour(colour);
      setCover({ busy: true, error: '' });
      try {
        await updateMap(passport.map.id, { passportColour: colour });
        setCover({ busy: false, error: '' });
      } catch (err) {
        setColour(before);
        setCover({ busy: false, error: err?.friendlyMessage || 'The colour couldn’t be saved.' });
      }
    },
    [passport],
  );

  // The traveller as saved, in the book and the switch at once
  const travellerSaved = useCallback((saved) => {
    const merge = (list) => list.map((t) => (t.id === saved.id ? { ...t, ...saved } : t));
    setPassport((current) => (current ? { ...current, travellers: merge(current.travellers) } : current));
    setTravellers(merge);
  }, []);
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
          <PassportBook passport={passport} onOpenPhoto={openPhoto} openAt={typeof openAt === 'string' ? openAt : null} travellerEdit={travellerEdit} />
        ) : null}
        {passport?.map.canChooseCover && !shareCode ? (
          <PaperCard>
            <div className='px-6 py-5 sm:px-8'>
              <PassportCoverPicker value={passport.map.passportColour ?? null} plan={passport.map.plan} onChange={chooseCover} busy={cover.busy} error={cover.error} />
            </div>
          </PaperCard>
        ) : null}
      </AppPageShell>

      {photoId ? (
        <Suspense fallback={null}>
          <PhotoViewer photoId={photoId} shareCode={shareCode} onClose={() => setPhotoId(null)} />
        </Suspense>
      ) : null}
      {editing && passport ? (
        <Suspense fallback={null}>
          {editing.kind === 'photo' ? (
            <TravellerPhotoDialog mapId={passport.map.id} traveller={editing.traveller} onSaved={travellerSaved} onClose={() => setEditing(null)} />
          ) : (
            <TravellerSignatureDialog mapId={passport.map.id} traveller={editing.traveller} onSaved={travellerSaved} onClose={() => setEditing(null)} />
          )}
        </Suspense>
      ) : null}
    </>
  );
}

export default PassportPage;
