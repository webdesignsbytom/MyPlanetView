import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
// Api
import { joinVsGroup, previewVsGroup } from '@/api/vsApi';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Hooks
import useCountableMaps from '@/hooks/useCountableMaps';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Constants
import { LOGIN_PAGE_URL, SIGN_UP_PAGE_URL, VS_JOIN_PAGE_URL, vsPath } from '@/utils/constants/routes';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import TravelTicket from '@/components/auth/TravelTicket';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// A Vs mode comparison's join link (docs/API.md "Vs mode"): its title, who started it and how
// many are in (8 at most), for anyone with the link. Signed in, you pick the map that counts for
// you and join; signed out, you're sent to sign in and brought back. Someone already in goes
// straight to its page.
function VsJoinPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const mustVerify = useMustVerifyEmail();
  const maps = useCountableMaps({ enabled: isAuthenticated });
  const [state, setState] = useState({ group: null, error: null });
  const [mapId, setMapId] = useState('');
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const chosen = mapId || maps.options[0]?.value || '';

  useEffect(() => {
    if (authLoading) return undefined;
    let cancelled = false;
    previewVsGroup(code)
      .then(({ group }) => {
        if (cancelled) return;
        if (group.youAreIn) navigate(vsPath(group.id), { replace: true });
        else setState({ group, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ group: null, error: err.friendlyMessage || 'That comparison’s link doesn’t work.' });
      });
    return () => {
      cancelled = true;
    };
  }, [code, authLoading, navigate]);

  const join = async () => {
    setBusy(true);
    setJoinError(null);
    try {
      const { group } = await joinVsGroup(code, chosen);
      navigate(vsPath(group.id), { replace: true });
    } catch (err) {
      setJoinError(err.friendlyMessage || 'You couldn’t join. Try again.');
      setBusy(false);
    }
  };

  const { group, error } = state;
  const back = { from: location.pathname };
  return (
    <>
      <AppPageHead route={VS_JOIN_PAGE_URL} />
      <AppPageShell width='max-w-2xl' mainProps={{ 'aria-labelledby': 'vs-join-heading' }}>
        <TravelTicket
          kicker='Vs mode'
          title={group ? group.title : 'Compare your travels'}
          headingId='vs-join-heading'
          stub={['Match ticket', group ? `${group.memberCount} of ${group.memberLimit} in` : 'Friends only', 'Seat: Podium']}
          widthClassName=''
        >
          <div className='grid gap-4'>
            {!group && !error ? (
              <div className='grid place-items-center py-10' role='status'>
                <LoadingSpinner md />
                <span className='sr-only'>Opening the comparison…</span>
              </div>
            ) : null}
            <InlineAlert>{error}</InlineAlert>
            {group ? (
              <>
                <p className='text-sm'>
                  {group.startedBy ? `${group.startedBy} wants to compare travels` : 'A friend wants to compare travels'}: countries, landmarks, badges,
                  flights and more, with gold, silver and bronze in each. {group.memberCount === 1 ? '1 person is in' : `${group.memberCount} people are in`}{' '}
                  so far, {group.memberLimit} at most.
                </p>
                <p className='text-sm opacity-80'>The others see your name and your numbers, never your map or photos.</p>

                {group.full ? (
                  <p className='text-sm font-medium'>This comparison is full.</p>
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
                    <FormField id='join-vs-map' label='The map that counts for you' hint='One you own or edit. You can change it later.'>
                      <PlainOptionSelect value={chosen} onChange={(e) => setMapId(e.target.value)} options={maps.options} />
                    </FormField>
                    <InlineAlert>{joinError}</InlineAlert>
                    <Button busy={busy} onClick={join}>
                      Join the comparison
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

export default VsJoinPage;
