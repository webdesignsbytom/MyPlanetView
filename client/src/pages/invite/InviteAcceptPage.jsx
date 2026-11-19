import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
// Api
import { acceptInvite, getInvite } from '@/api/travelApi';
// Constants
import { INVITE_PAGE_URL, LOGIN_PAGE_URL, SIGN_UP_PAGE_URL, mapPath, tripPath } from '@/utils/constants/routes';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Utils
import { forgetMapLists } from '@/utils/map/mapListCache';
import { ROLE_WITH_ARTICLE } from '@/utils/sharing/shareRoles';
import { invitePageOfferText } from '@/utils/plans/inviteOffer';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import TravelTicket from '@/components/auth/TravelTicket';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// An emailed invite to a map or trip. Signed out: what it's for (who sent it, the map, the
// role and, for a co-owner, the traveller: GET /api/invites/:token), then sign in (back here)
// or create an account with the invite's address filled in, which verifies it and accepts
// the invite in one step (RegisterForm; 19 Nov 2026). Signed in: accept it and go straight there.
function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [error, setError] = useState(null);
  // What the invite is for (signed out), or false when the link no longer works
  const [preview, setPreview] = useState(null);
  const triedRef = useRef(false);

  useEffect(() => {
    if (loading || isAuthenticated) return undefined;
    let live = true;
    getInvite(token)
      .then(({ invite }) => live && setPreview(invite || false))
      .catch(() => live && setPreview(false));
    return () => {
      live = false;
    };
  }, [loading, isAuthenticated, token]);

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
  // Sign-up with the invite: its address kept, the traveller's name suggested
  const signUpState = preview
    ? { ...back, invite: { token, email: preview.email, name: preview.travellerName || '', kind: preview.kind, id: preview.id } }
    : back;
  const whatFor = preview
    ? `${preview.invitedBy || 'Someone'} invited you to be ${ROLE_WITH_ARTICLE[preview.role] || 'a viewer'} of the ${preview.kind} “${preview.name}”${
        preview.travellerName ? `, as ${preview.travellerName}` : ''
      }.`
    : null;

  return (
    <>
      <AppPageHead route={INVITE_PAGE_URL} />
      <AppPageShell width='max-w-2xl' mainProps={{ 'aria-labelledby': 'invite-heading' }}>
        {/* A guest pass: the sign-in pages' boarding pass, stamped "Admit one" */}
        <TravelTicket
          kicker='Invitation'
          title='You’ve been invited'
          headingId='invite-heading'
          stub={['Guest pass', 'Shared with you', 'Seat: Window']}
          widthClassName=''
        >
          <div className='grid gap-4'>
            {loading || (isAuthenticated && !error) ? (
              <div className='grid place-items-center py-10' role='status'>
                <LoadingSpinner md />
                <span className='sr-only'>Accepting the invite…</span>
              </div>
            ) : null}
            <InlineAlert>{error}</InlineAlert>
            {!loading && !isAuthenticated ? (
              <>
                {whatFor ? <p className='font-medium leading-relaxed'>{whatFor}</p> : null}
                {preview?.offer ? (
                  <p className='border-2 border-dashed border-status-good bg-paper-cream p-3 text-sm' data-testid='invite-offer'>
                    {invitePageOfferText(preview.offer)}
                  </p>
                ) : null}
                {preview === false ? (
                  <InlineAlert tone='info'>
                    This invite has expired or has already been used. If you’ve already joined, sign in. Otherwise, ask the person
                    who sent it for a new one.
                  </InlineAlert>
                ) : null}
                <p className='leading-relaxed'>
                  {preview
                    ? `New here? Create a free account with ${preview.email}: it opens straight away, with no email to confirm. Already have an account? Sign in.`
                    : 'Sign in to see what’s been shared with you. New here? Create an account with the email address the invite was sent to.'}
                </p>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <Link to={LOGIN_PAGE_URL} state={back} className='btn-poster'>
                    Sign in
                  </Link>
                  <Link to={SIGN_UP_PAGE_URL} state={signUpState} className='btn-paper'>
                    Create an account
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </TravelTicket>
      </AppPageShell>
    </>
  );
}

export default InviteAcceptPage;
