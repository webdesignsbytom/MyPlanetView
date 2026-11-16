import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Api
import { deleteChallenge, updateChallenge } from '@/api/challengesApi';
// Constants
import { CHALLENGES_PAGE_URL } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import ChallengeFields from './ChallengeFields';
// Utils
import { challengeBodyFrom, challengeFormFrom } from '@/utils/challenges/challengeForm';

// The starter's changes: the title, the dates and the target (what it counts stays), and
// deleting it, which takes everyone out with it.
function ChallengeSettingsCard({ challenge, onChanged }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => challengeFormFrom(challenge));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaved('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const parsed = challengeBodyFrom(form, { existing: challenge });
    setErrors(parsed.ok ? {} : parsed.errors);
    if (!parsed.ok) return;
    setBusy('save');
    try {
      const { challenge: updated } = await updateChallenge(challenge.id, parsed.body);
      onChanged(updated);
      setSaved('Saved.');
    } catch (err) {
      setError(err.friendlyMessage || 'The changes couldn’t be saved.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    setError(null);
    try {
      await deleteChallenge(challenge.id);
      navigate(CHALLENGES_PAGE_URL);
    } catch (err) {
      setError(err.friendlyMessage || 'The challenge couldn’t be deleted.');
      setBusy(null);
    }
  };

  return (
    <PaperCard title='Change the challenge' titleId='challenge-settings-heading'>
      <form className='grid gap-3' onSubmit={submit} noValidate>
        <ChallengeFields idPrefix='edit-challenge' form={form} errors={errors} onChange={change} measureFixed />
        <InlineAlert>{error}</InlineAlert>
        <InlineAlert tone='good'>{saved}</InlineAlert>
        <div className='grid justify-items-end'>
          <Button type='submit' busy={busy === 'save'}>
            Save changes
          </Button>
        </div>
      </form>
      {confirmingDelete ? (
        <div className='grid gap-2 rounded-lg border px-3 py-2 text-sm tone-danger'>
          <p>Delete “{challenge.title}” for everyone in it? It can’t be undone.</p>
          <div className='grid grid-row gap-2'>
            <Button danger busy={busy === 'delete'} onClick={remove}>
              Delete it
            </Button>
            <Button quiet onClick={() => setConfirmingDelete(false)}>
              Keep it
            </Button>
          </div>
        </div>
      ) : (
        <div className='grid justify-items-start'>
          <Button danger onClick={() => setConfirmingDelete(true)}>
            Delete the challenge
          </Button>
        </div>
      )}
    </PaperCard>
  );
}

export default ChallengeSettingsCard;
