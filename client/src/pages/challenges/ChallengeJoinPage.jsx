import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
// Api
import { joinChallenge, previewChallenge } from '@/api/challengesApi';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Hooks
import useCountableMaps from '@/hooks/useCountableMaps';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Constants
import { CHALLENGE_JOIN_PAGE_URL, LOGIN_PAGE_URL, SIGN_UP_PAGE_URL, challengePath } from '@/utils/constants/routes';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import TravelTicket from '@/components/auth/TravelTicket';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { CHALLENGE_MEASURES, STATUS_WORDS, dateRange, measureLabel } from '@/utils/challenges/challengeWords';

// A friends challenge's join link (docs/API.md, "Friends challenges"): what it counts, the
// dates and who started it, for anyone with the link. Signed in, you pick the map that
// counts for you (one you own or edit) and join; signed out, you're sent to sign in and
// brought back. Someone already in goes straight to its page.
function ChallengeJoinPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const mustVerify = useMustVerifyEmail();
  const maps = useCountableMaps({ enabled: isAuthenticated });
  const [state, setState] = useState({ challenge: null, error: null });
  const [mapId, setMapId] = useState('');
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const chosen = mapId || maps.options[0]?.value || '';

  useEffect(() => {
    if (authLoading) return undefined;
    let cancelled = false;
    previewChallenge(code)
      .then(({ challenge }) => {
        if (cancelled) return;
        if (challenge.youAreIn) navigate(challengePath(challenge.id), { replace: true });
        else setState({ challenge, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ challenge: null, error: err.friendlyMessage || 'That challenge link doesn’t work.' });
      });
    return () => {
      cancelled = true;
    };
  }, [code, authLoading, navigate]);

  const join = async () => {
    setBusy(true);
    setJoinError(null);
    try {
      const { challenge } = await joinChallenge(code, chosen);
      navigate(challengePath(challenge.id), { replace: true });
    } catch (err) {
      setJoinError(err.friendlyMessage || 'You couldn’t join. Try again.');
      setBusy(false);
    }
  };

  const { challenge, error } = state;
  const back = { from: location.pathname };
  return (
    <>
      <AppPageHead route={CHALLENGE_JOIN_PAGE_URL} />
      <AppPageShell width='max-w-2xl' mainProps={{ 'aria-labelledby': 'challenge-join-heading' }}>
        <TravelTicket
          kicker='Friends challenge'
          title={challenge ? challenge.title : 'You’ve been challenged'}
          headingId='challenge-join-heading'
          stub={['Race ticket', challenge ? STATUS_WORDS[challenge.status] : 'Friends only', 'Seat: Start line']}
          widthClassName=''
        >
          <div className='grid gap-4'>
            {!challenge && !error ? (
              <div className='grid place-items-center py-10' role='status'>
                <LoadingSpinner md />
                <span className='sr-only'>Opening the challenge…</span>
              </div>
            ) : null}
            <InlineAlert>{error}</InlineAlert>
            {challenge ? (
              <>
                <dl className='grid gap-1 text-sm'>
                  <div className='grid grid-cols-reg gap-2'>
                    <dt className='font-medium'>Counts</dt>
                    <dd>{measureLabel(challenge.measure)}: {CHALLENGE_MEASURES[challenge.measure]?.description}</dd>
                  </div>
                  <div className='grid grid-cols-reg gap-2'>
                    <dt className='font-medium'>When</dt>
                    <dd>{dateRange(challenge)}</dd>
                  </div>
                  {challenge.target ? (
                    <div className='grid grid-cols-reg gap-2'>
                      <dt className='font-medium'>Target</dt>
                      <dd>First to {challenge.target}</dd>
                    </div>
                  ) : null}
                  <div className='grid grid-cols-reg gap-2'>
                    <dt className='font-medium'>Who</dt>
                    <dd>
                      {challenge.startedBy ? `Started by ${challenge.startedBy}` : 'Started by a friend'},{' '}
                      {challenge.memberCount === 1 ? '1 person in' : `${challenge.memberCount} people in`}
                    </dd>
                  </div>
                </dl>
                <p className='text-sm opacity-80'>The others see your name and your count, never your map or photos.</p>

                {challenge.status === 'ENDED' ? (
                  <p className='text-sm font-medium'>This challenge has finished.</p>
                ) : challenge.full ? (
                  <p className='text-sm font-medium'>This challenge is full.</p>
                ) : !isAuthenticated ? (
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <Link to={LOGIN_PAGE_URL} state={back} className='btn-poster'>
                      Sign in to join
                    </Link>
                    <Link to={SIGN_UP_PAGE_URL} state={back} className='btn-paper'>
                      Create an account
                    </Link>
                  </div>
                ) : mustVerify ? (
                  <p className='text-sm'>Verify your email address to join. Use the link we emailed you, then open this link again.</p>
                ) : maps.options.length ? (
                  <div className='grid gap-3'>
                    <FormField id='join-challenge-map' label='The map that counts for you' hint='One you own or edit. You can change it later.'>
                      <PlainOptionSelect value={chosen} onChange={(e) => setMapId(e.target.value)} options={maps.options} />
                    </FormField>
                    <InlineAlert>{joinError}</InlineAlert>
                    <Button busy={busy} onClick={join}>
                      Join the challenge
                    </Button>
                  </div>
                ) : maps.loading ? null : (
                  <p className='text-sm'>{maps.error || 'You need a map of your own (or one you edit) to join.'}</p>
                )}
              </>
            ) : null}
          </div>
        </TravelTicket>
      </AppPageShell>
    </>
  );
}

export default ChallengeJoinPage;
