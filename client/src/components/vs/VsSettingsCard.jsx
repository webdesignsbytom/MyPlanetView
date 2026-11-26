import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Api
import { deleteVsGroup, renameVsGroup } from '@/api/vsApi';
// Constants
import { VS_PAGE_URL } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
// Utils
import { VS_LIMITS } from '@/utils/vs/vsRules';

/** The starter's changes (26 Nov 2026): the title, and deleting it, which takes everyone out with it. */
function VsSettingsCard({ group, onChanged }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(group.title);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState('');
  const [confirming, setConfirming] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy('save');
    setError(null);
    setSaved('');
    try {
      const { group: updated } = await renameVsGroup(group.id, title);
      onChanged(updated);
      setSaved('Saved.');
    } catch (err) {
      setError(err.friendlyMessage || 'The title couldn’t be saved.');
    } finally {
      setBusy(null);
    }
  };
  const remove = async () => {
    setBusy('delete');
    setError(null);
    try {
      await deleteVsGroup(group.id);
      navigate(VS_PAGE_URL);
    } catch (err) {
      setError(err.friendlyMessage || 'The comparison couldn’t be deleted.');
      setBusy(null);
    }
  };

  return (
    <PaperCard title='Change the comparison' titleId='vs-settings-heading'>
      <form className='grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]' onSubmit={save} noValidate>
        <FormField id='vs-title' label='Title' align='start'>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={VS_LIMITS.title} />
        </FormField>
        <Button type='submit' busy={busy === 'save'} disabled={!title.trim()}>
          Save
        </Button>
      </form>
      <InlineAlert>{error}</InlineAlert>
      <InlineAlert tone='good'>{saved}</InlineAlert>
      {confirming ? (
        <div className='grid gap-2 rounded-lg border px-3 py-2 text-sm tone-danger'>
          <p>Delete “{group.title}” for everyone in it? It can’t be undone. Nobody’s maps change.</p>
          <div className='grid grid-row gap-2'>
            <Button danger busy={busy === 'delete'} onClick={remove}>
              Delete it
            </Button>
            <Button quiet onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </div>
        </div>
      ) : (
        <div className='grid justify-items-start'>
          <Button danger onClick={() => setConfirming(true)}>
            Delete the comparison
          </Button>
        </div>
      )}
    </PaperCard>
  );
}

export default VsSettingsCard;
