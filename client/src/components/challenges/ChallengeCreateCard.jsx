import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Api
import { createChallenge } from '@/api/challengesApi';
// Hooks
import useCountableMaps from '@/hooks/useCountableMaps';
// Constants
import { challengePath } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import ChallengeFields from './ChallengeFields';
// Utils
import { challengeBodyFrom, emptyChallengeForm } from '@/utils/challenges/challengeForm';

// "Start a challenge": its details and the map that counts for the starter, who's in it
// from the start. Then its page opens, with the link to send friends. `locked`: the email
// address isn't verified yet, so it says so instead.
function ChallengeCreateCard({ locked = false }) {
  const navigate = useNavigate();
  const maps = useCountableMaps();
  // A client-only page: today can be read here
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState(() => emptyChallengeForm(today));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const mapId = form.mapId || maps.options[0]?.value || '';

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const parsed = challengeBodyFrom({ ...form, mapId });
    setErrors(parsed.ok ? {} : parsed.errors);
    if (!parsed.ok) return;
    setBusy(true);
    try {
      const { challenge } = await createChallenge(parsed.body);
      navigate(challengePath(challenge.id));
    } catch (err) {
      setError(err.friendlyMessage || 'The challenge couldn’t be started.');
      setBusy(false);
    }
  };

  return (
    <PaperCard title='Start a challenge' titleId='start-challenge-heading'>
      {locked ? (
        <p className='text-sm'>Verify your email address to start a challenge. Use the link we emailed you, or send a new one from your account page.</p>
      ) : (
        <form className='grid gap-3' onSubmit={submit} noValidate>
          <ChallengeFields idPrefix='new-challenge' form={{ ...form, mapId }} errors={errors} onChange={change} mapOptions={maps.options} />
          <InlineAlert>{error || maps.error}</InlineAlert>
          <div className='grid justify-items-end'>
            {/* Not before the maps have loaded: the one that counts is chosen from them */}
            <Button type='submit' busy={busy} disabled={maps.loading}>
              Start it
            </Button>
          </div>
        </form>
      )}
    </PaperCard>
  );
}

export default ChallengeCreateCard;
