import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Api
import { createVsGroup } from '@/api/vsApi';
// Hooks
import useCountableMaps from '@/hooks/useCountableMaps';
// Constants
import { vsPath } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { VS_DEFAULT_TITLE, VS_LIMITS } from '@/utils/vs/vsRules';

/**
 * Starting a comparison (26 Nov 2026): a title and the map that counts for you, then it opens
 * with its link to send. `locked`: an unverified email address can't start one yet.
 */
function VsCreateCard({ locked = false }) {
  const navigate = useNavigate();
  const maps = useCountableMaps();
  const [title, setTitle] = useState('');
  const [mapId, setMapId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const chosen = mapId || maps.options[0]?.value || '';

  const start = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { group } = await createVsGroup({ title: title.trim() || VS_DEFAULT_TITLE, mapId: chosen });
      navigate(vsPath(group.id));
    } catch (err) {
      setError(err.friendlyMessage || 'The comparison couldn’t be started.');
      setBusy(false);
    }
  };

  return (
    <PaperCard title='Start a comparison' titleId='vs-create-heading'>
      <p className='text-sm'>
        Compare everything with up to {VS_LIMITS.members - 1} friends: countries, landmarks, badges, flights and more, with gold, silver and bronze in each. Everyone sees names and numbers, never a map or photos.
      </p>
      {locked ? (
        <p className='text-sm'>Verify your email address to start one.</p>
      ) : (
        <form className='grid gap-3' onSubmit={start} noValidate>
          <FormField id='vs-new-title' label='Title' align='start'>
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={VS_LIMITS.title} placeholder={VS_DEFAULT_TITLE} autoComplete='off' />
          </FormField>
          <FormField id='vs-new-map' label='The map that counts for you' hint='One you own or edit. You can change it later.' align='start'>
            <PlainOptionSelect value={chosen} onChange={(e) => setMapId(e.target.value)} options={maps.options} placeholder='Choose a map' />
          </FormField>
          <InlineAlert>{error || maps.error}</InlineAlert>
          <div className='grid justify-items-end'>
            <Button type='submit' busy={busy} disabled={maps.loading || !chosen}>
              Start the comparison
            </Button>
          </div>
        </form>
      )}
    </PaperCard>
  );
}

export default VsCreateCard;
