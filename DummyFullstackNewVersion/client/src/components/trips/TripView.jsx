import React, { useState } from 'react';
// Components
import TripHeader from './TripHeader';
import TripMiniMap from './TripMiniMap';
import TripStopList from './TripStopList';
import TripPhotosSection from './TripPhotosSection';
import ShareDialog from '@/components/sharing/ShareDialog';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { canEditRole } from '@/utils/sharing/shareRoles';

/**
 * One trip: header, route map, stops and photos. Editors change it here; a share-link
 * visitor (`shareCode`) only views. `onDelete` returns a promise that removes the trip.
 */
function TripView({ trip, onTripChange, shareCode = null, styleId, currentUser = null, onDelete, onLeft }) {
  const canEdit = !shareCode && canEditRole(trip.role);
  const [sharing, setSharing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    <div className='grid gap-8'>
      <TripHeader
        trip={trip}
        canEdit={canEdit}
        linkToMap={!shareCode}
        onChanged={onTripChange}
        onShare={currentUser && !shareCode ? () => setSharing(true) : null}
        onDelete={onDelete ? () => setConfirmingDelete(true) : null}
      />

      {confirmingDelete ? (
        <div className='grid gap-2 rounded-xl border px-4 py-3 tone-danger'>
          <p>Delete “{trip.title}” and its stops? Its photos stay on the map.</p>
          <div className='grid grid-row gap-2'>
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

      <TripMiniMap trip={trip} styleId={styleId} />
      <TripStopList trip={trip} canEdit={canEdit} onChanged={onTripChange} />
      <TripPhotosSection trip={trip} canEdit={canEdit} shareCode={shareCode} />

      {sharing ? (
        <ShareDialog
          resource='trips'
          id={trip.id}
          name={trip.title}
          role={trip.role}
          currentUserId={currentUser?.id}
          onLeft={onLeft}
          onClose={() => setSharing(false)}
        />
      ) : null}
    </div>
  );
}

export default TripView;
