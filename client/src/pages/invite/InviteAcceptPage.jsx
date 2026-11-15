import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
// Api
import { acceptInvite } from '@/api/travelApi';
// Constants
import { INVITE_PAGE_URL, LOGIN_PAGE_URL, SIGN_UP_PAGE_URL, mapPath, tripPath } from '@/utils/constants/routes';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Utils
import { forgetMapLists } from '@/utils/map/mapListCache';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// An emailed invite to a map or trip. Signed out: sign in or create an account first
// (both come back here). Signed in: accept it and go straight there.
function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [error, setError] = useState(null);
  const triedRef = useRef(false);

  useEffect(() => {
    if (loading || !isAuthenticated || triedRef.current) return;
    triedRef.current = true;
    acceptInvite(token)
      .then(({ resource, id }) => {
        // The new map or trip isn't in the lists kept for this session yet
        forgetMapLists();
        navigate(resource === 'trip' ? tripPath(id) : mapPath(id), { replace: true });
      })
      .catch((err) => {
        const status = err.response?.status;
        setError(
          status === 403
            ? 'This invite was sent to a different email address, or yours isn’t verified yet. Check your email for the verification link, then open the invite again.'
            : status === 400
              ? 'This invite has expired or has already been used. Ask the person who sent it for a new one.'
              : err.friendlyMessage || 'The invite could not be accepted.',
        );
      });
  }, [loading, isAuthenticated, token, navigate]);

  const back = { from: location.pathname };

  return (
    <>
      <AppPageHead route={INVITE_PAGE_URL} />
      <AppPageShell width='max-w-xl'>
        <h1 className='text-3xl font-semibold'>You’ve been invited</h1>
        {loading || (isAuthenticated && !error) ? (
          <div className='grid place-items-center py-10' role='status'>
            <LoadingSpinner md />
            <span className='sr-only'>Accepting the invite…</span>
          </div>
        ) : null}
        <InlineAlert>{error}</InlineAlert>
        {!loading && !isAuthenticated ? (
          <div className='grid gap-4'>
            <p>Sign in to see what’s been shared with you. New here? Create an account with the email address the invite was sent to.</p>
            <div className='grid grid-row-wrap gap-3'>
              <Link to={LOGIN_PAGE_URL} state={back} className='rounded-lg bg-colour6 px-4 py-2 font-medium text-colour1 hover:brightness-110'>
                Sign in
              </Link>
              <Link to={SIGN_UP_PAGE_URL} state={back} className='rounded-lg border border-colour5/40 px-4 py-2 font-medium hover:bg-colour3'>
                Create an account
              </Link>
            </div>
          </div>
        ) : null}
      </AppPageShell>
    </>
  );
}

export default InviteAcceptPage;
