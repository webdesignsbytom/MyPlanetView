import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Api
import { leaveVsGroup, setMyVsMap } from '@/api/vsApi';
// Hooks
import useCountableMaps from '@/hooks/useCountableMaps';
// Constants
import { VS_PAGE_URL } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';

/**
 * You in a comparison (26 Nov 2026): the map that counts for you (one you own or edit), which you
 * can change, and leaving (not for the starter, who deletes it instead). `locked`: the email
 * address isn't verified, so the map can't change yet.
 */
function VsMyMapCard({ group, locked = false, onChanged }) {
  const navigate = useNavigate();
  const maps = useCountableMaps();
  const [mapId, setMapId] = useState(group.myMap?.id || '');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const counting = group.members.find((m) => m.isYou)?.counting;

  const save = async () => {
    setBusy('map');
    setError(null);
    try {
      const { group: updated } = await setMyVsMap(group.id, mapId);
      onChanged(updated);
    } catch (err) {
      setError(err.friendlyMessage || 'That map couldn’t be chosen.');
    } finally {
      setBusy(null);
    }
  };
  const leave = async () => {
    setBusy('leave');
    setError(null);
    try {
      await leaveVsGroup(group.id);
      navigate(VS_PAGE_URL);
    } catch (err) {
      setError(err.friendlyMessage || 'You couldn’t leave it. Try again.');
      setBusy(null);
    }
  };

  return (
    <PaperCard title='Your map' titleId='vs-my-map-heading'>
      <p className='text-sm'>
        {counting
          ? `Counting “${group.myMap?.name || 'your map'}”. Only its numbers and badges are shown to the others.`
          : 'No map is counting for you: the one you chose is gone, or you no longer edit it. Choose another.'}
      </p>
      {locked ? (
        <p className='text-sm'>Verify your email address to change the map that counts.</p>
      ) : (
        <div className='grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'>
          <FormField id='vs-my-map' label='The map that counts for you' align='start'>
            <PlainOptionSelect value={mapId} onChange={(e) => setMapId(e.target.value)} options={maps.options} placeholder='Choose a map' />
          </FormField>
          <Button quiet busy={busy === 'map'} disabled={!mapId || (mapId === group.myMap?.id && counting)} onClick={save}>
            Count this map
          </Button>
        </div>
      )}
      <InlineAlert>{error || maps.error}</InlineAlert>
      {group.youStartedIt ? null : (
        <div className='grid justify-items-start'>
          <Button danger busy={busy === 'leave'} onClick={leave}>
            Leave the comparison
          </Button>
        </div>
      )}
    </PaperCard>
  );
}

export default VsMyMapCard;
