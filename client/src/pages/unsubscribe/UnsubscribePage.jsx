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

// Each email's words: no `l` is "On this day" (its first emails' links have none)
const LISTS = {
  'on-this-day': {
    title: 'On this day',
    stub: 'Once a week at most',
    ask: 'Stop the “On this day” emails, with a photo of yours from that day in an earlier year?',
    done: 'Done: no more “On this day” emails. You can switch them back on from your account page.',
  },
  trips: {
    title: 'Welcome home',
    stub: 'The day after a trip',
    ask: 'Stop the “Welcome home” emails, the reminder to share a trip the day after it ends?',
    done: 'Done: no more “Welcome home” emails. You can switch them back on from your account page.',
  },
};

// An email's unsubscribe link (docs/API.md "Emails"): `?u=&t=&l=`, signed, so no sign-in is
// needed; `l` says which email (LISTS). It asks before stopping anything (mail scanners open
// links on their own; the email's one-click header is how a mail app stops it in one go).
function UnsubscribePage() {
  const [params] = useSearchParams();
  const u = params.get('u') || '';
  const t = params.get('t') || '';
  const l = params.get('l') || '';
  const list = LISTS[l || 'on-this-day'] ?? LISTS['on-this-day'];
  const [state, setState] = useState({ busy: false, done: false, error: '' });

  const stop = async () => {
    setState({ busy: true, done: false, error: '' });
    try {
      // The link's own list goes back as it came (the server refuses one it doesn't know)
      await unsubscribeFromEmails(l ? { u, t, l } : { u, t });
      setState({ busy: false, done: true, error: '' });
    } catch (err) {
      setState({ busy: false, done: false, error: err?.friendlyMessage || 'That didn’t work. Change your emails on your account page instead.' });
    }
  };

  return (
    <>
      <AppPageHead route={UNSUBSCRIBE_PAGE_URL} />
      <AppPageShell width='max-w-2xl' mainProps={{ 'aria-labelledby': 'unsubscribe-heading' }}>
        <TravelTicket kicker='Emails' title={list.title} headingId='unsubscribe-heading' stub={['Emails', list.title, list.stub]} widthClassName=''>
          <div className='grid gap-4'>
            {state.done ? (
              <p role='status' className='font-medium'>
                {list.done}
              </p>
            ) : (
              <>
                <p>{list.ask}</p>
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
