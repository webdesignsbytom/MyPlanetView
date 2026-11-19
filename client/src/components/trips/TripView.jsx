import React, { Suspense, useMemo, useState } from 'react';
// Components
import TripHeader from './TripHeader';
import TravelDesk from '@/components/offers/TravelDesk';
import TripMiniMap from './TripMiniMap';
import TripStopList from './TripStopList';
import TripPhotosSection from './TripPhotosSection';
import TripMoments from './TripMoments';
import TripMyMaps from './TripMyMaps';
// Lazy: only the trip's owner opens it, and share links never (19 Nov 2026, the audit)
import { ShareDialog } from '@/components/map/lazyMapPanels';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Hooks
import { SplitUkProvider } from '@/hooks/useSplitUk';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Utils
import { canEditRole } from '@/utils/sharing/shareRoles';
import { isUpcomingPlannedTrip, placeCountries, todayString, tripPlace } from '@/utils/offers/offerContext';

/**
 * One trip: header, the caller's own maps showing it (a group trip: "Add to my map"),
 * route map, stops, moments and photos, each a piece of travel paperwork laid
 * out like the public pages' cards (16px apart, 8px from lg up). Editors change it here;
 * a share-link visitor (`shareCode`) only views. `onDelete` returns a promise that
 * removes the trip. An editor whose email address isn't verified yet (`locked`) sees it
 * as a viewer would, with the reason where the edit controls would be.
 * `styleId` and `showAntarctica` are the viewer's map settings, for the route map.
 */
function TripView({ trip, onTripChange, shareCode = null, styleId, showAntarctica = true, currentUser = null, onDelete, onLeft }) {
  const roleCanEdit = !shareCode && canEditRole(trip.role);
  const mustVerify = useMustVerifyEmail();
  const locked = roleCanEdit && mustVerify;
  const canEdit = roleCanEdit && !locked;
  const [sharing, setSharing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // The Travel Desk (docs/FEATURE-PLAN.md, "Travel Desk"), for everyone who can see the
  // trip: offers for its countries, the links carrying each stop's place, and the trip's
  // dates while it's planned and still to come (a client-only page: today is read here)
  const deskTrip = useMemo(() => {
    const place = tripPlace(trip);
    return isUpcomingPlannedTrip(trip, todayString()) ? place : { ...place, from: null, to: null };
  }, [trip]);
  const deskCountries = useMemo(() => placeCountries(deskTrip), [deskTrip]);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete();
    } catch (err) {
      setDeleteError(err.friendlyMessage || 'The trip could not be deleted.');
      setDeleting(false);
    }
  };

  return (
    // The trip's map's choice to show the UK as its four nations: the mini map, the stop
    // and photo pickers, the landmark lists (the trip page and trip share links alike)
    <SplitUkProvider value={Boolean(trip.splitUk)}>
    <div className='grid min-w-0 gap-4 lg:gap-2'>
      <TripHeader
        trip={trip}
        canEdit={canEdit}
        locked={locked}
        linkToMap={!shareCode}
        onChanged={onTripChange}
        onShare={currentUser && !shareCode ? () => setSharing(true) : null}
        onDelete={onDelete ? () => setConfirmingDelete(true) : null}
        travelDesk={<TravelDesk fill countryCodes={deskCountries} trip={deskTrip} />}
      />

      {confirmingDelete ? (
        <div role='group' aria-label='Delete this trip' className='ticket-edge grid gap-4 bg-paper-cream px-6 py-5 text-colour4 sm:px-8'>
          <p className='font-medium text-poster-red-deep'>Delete “{trip.title}” and its stops? Its photos stay on the map.</p>
          <div className='grid gap-2 sm:grid-row'>
            <Button danger busy={deleting} onClick={handleDelete}>
              Yes, delete the trip
            </Button>
            <Button quiet onClick={() => setConfirmingDelete(false)}>
              Keep it
            </Button>
          </div>
          <InlineAlert>{deleteError}</InlineAlert>
        </div>
      ) : null}

      {currentUser && !shareCode && (trip.canAddToMyMap || trip.onMyMaps?.length) ? (
        <TripMyMaps trip={trip} userId={currentUser.id} locked={mustVerify} onTripChange={onTripChange} />
      ) : null}

      <TripMiniMap trip={trip} styleId={styleId} showAntarctica={showAntarctica} />
      <TripStopList trip={trip} canEdit={canEdit} onChanged={onTripChange} />
      <TripMoments trip={trip} canEdit={canEdit} shareCode={shareCode} onTripChange={onTripChange} />
      <TripPhotosSection trip={trip} canEdit={canEdit} locked={locked} shareCode={shareCode} />

      {sharing ? (
        <Suspense fallback={null}>
          <ShareDialog
            resource='trips'
            id={trip.id}
            name={trip.title}
            role={trip.role}
            currentUserId={currentUser?.id}
            onLeft={onLeft}
            onClose={() => setSharing(false)}
          />
        </Suspense>
      ) : null}
    </div>
    </SplitUkProvider>
  );
}

export default TripView;
