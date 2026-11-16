import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Api
import { leaveChallenge, setMyChallengeMap } from '@/api/challengesApi';
// Hooks
import useCountableMaps from '@/hooks/useCountableMaps';
// Constants
import { CHALLENGES_PAGE_URL } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';

// You in a challenge: the map that counts for you (one you own or edit), which you can
// change, and leaving (not for the starter, who deletes it instead). `locked`: the email
// address isn't verified, so the map can't change yet.
function ChallengeMyMapCard({ challenge, locked = false, onChanged }) {
  const navigate = useNavigate();
  const maps = useCountableMaps();
  const [mapId, setMapId] = useState(challenge.myMap?.id || '');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const counting = challenge.members.find((m) => m.isYou)?.counting;

  const save = async () => {
    setBusy('map');
    setError(null);
    try {
      const { challenge: updated } = await setMyChallengeMap(challenge.id, mapId);
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
      await leaveChallenge(challenge.id);
      navigate(CHALLENGES_PAGE_URL);
    } catch (err) {
      setError(err.friendlyMessage || 'You couldn’t leave it. Try again.');
      setBusy(null);
    }
  };

  return (
    <PaperCard title='Your map' titleId='challenge-my-map-heading'>
      <p className='text-sm'>
        {counting
          ? `Counting “${challenge.myMap?.name || 'your map'}”. Only the count is shown to the others.`
          : 'No map is counting for you: the one you chose is gone, or you no longer edit it. Choose another.'}
      </p>
      {locked ? (
        <p className='text-sm'>Verify your email address to change the map that counts.</p>
      ) : (
        <div className='grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'>
          <FormField id='challenge-my-map' label='The map that counts for you'>
            <PlainOptionSelect value={mapId} onChange={(e) => setMapId(e.target.value)} options={maps.options} placeholder='Choose a map' />
          </FormField>
          <Button quiet busy={busy === 'map'} disabled={!mapId || (mapId === challenge.myMap?.id && counting)} onClick={save}>
            Count this map
          </Button>
        </div>
      )}
      <InlineAlert>{error || maps.error}</InlineAlert>
      {challenge.youStartedIt ? null : (
        <div className='grid justify-items-start'>
          <Button danger busy={busy === 'leave'} onClick={leave}>
            Leave the challenge
          </Button>
        </div>
      )}
    </PaperCard>
  );
}

export default ChallengeMyMapCard;
