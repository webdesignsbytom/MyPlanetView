import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
// Api
import { unsubscribeFromEmails } from '@/api/emailsApi';
// Constants
import { ACCOUNT_PAGE_URL, UNSUBSCRIBE_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import TravelTicket from '@/components/auth/TravelTicket';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';

// An email's unsubscribe link (docs/API.md "Emails"): `?u=&t=`, signed, so no sign-in is
// needed. It asks before stopping anything (mail scanners open links on their own; the email's
// one-click header is how a mail app stops it in one go).
function UnsubscribePage() {
  const [params] = useSearchParams();
  const u = params.get('u') || '';
  const t = params.get('t') || '';
  const [state, setState] = useState({ busy: false, done: false, error: '' });

  const stop = async () => {
    setState({ busy: true, done: false, error: '' });
    try {
      await unsubscribeFromEmails({ u, t });
      setState({ busy: false, done: true, error: '' });
    } catch (err) {
      setState({ busy: false, done: false, error: err?.friendlyMessage || 'That didn’t work. Change your emails on your account page instead.' });
    }
  };

  return (
    <>
      <AppPageHead route={UNSUBSCRIBE_PAGE_URL} />
      <AppPageShell width='max-w-2xl' mainProps={{ 'aria-labelledby': 'unsubscribe-heading' }}>
        <TravelTicket kicker='Emails' title='On this day' headingId='unsubscribe-heading' stub={['Emails', 'On this day', 'Once a week at most']} widthClassName=''>
          <div className='grid gap-4'>
            {state.done ? (
              <p role='status' className='font-medium'>
                Done: no more “On this day” emails. You can switch them back on from your account page.
              </p>
            ) : (
              <>
                <p>Stop the “On this day” emails, with a photo of yours from that day in an earlier year?</p>
                <InlineAlert>{state.error}</InlineAlert>
                <Button busy={state.busy} disabled={!u || !t} onClick={stop}>
                  Stop these emails
                </Button>
              </>
            )}
            <p className='text-sm'>
              Signed in, you can change your emails on{' '}
              <Link to={ACCOUNT_PAGE_URL} className='font-semibold text-poster-red-deep underline underline-offset-2'>
                your account page
              </Link>
              .
            </p>
          </div>
        </TravelTicket>
      </AppPageShell>
    </>
  );
}

export default UnsubscribePage;
