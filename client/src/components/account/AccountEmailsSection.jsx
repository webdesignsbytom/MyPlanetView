import React, { useEffect, useId, useState } from 'react';
// Api
import { getEmailPreferences, saveEmailPreferences } from '@/api/emailsApi';
// Components
import CheckboxInput from '@/components/ui/CheckboxInput';

// The emails someone can stop, each saved as it's changed
const EMAILS = [
  { key: 'onThisDay', title: 'On this day', blurb: 'A photo of yours from this day in an earlier year, at most once a week.' },
  { key: 'tripShare', title: 'Welcome home', blurb: 'The day after a trip ends, a reminder to share it with your friends.' },
];

// The account page's emails (docs/API.md "Emails"): "On this day" and "Welcome home" on or off
// (saved as each is changed). Emails about the account itself always come.
function AccountEmailsSection() {
  const uid = useId();
  const [prefs, setPrefs] = useState(null);
  const [status, setStatus] = useState({ text: '', error: false });

  useEffect(() => {
    let alive = true;
    getEmailPreferences()
      .then((saved) => alive && setPrefs({ onThisDay: saved.onThisDay !== false, tripShare: saved.tripShare !== false }))
      .catch(() => alive && setStatus({ text: 'Your email settings couldn’t be loaded.', error: true }));
    return () => {
      alive = false;
    };
  }, []);

  const change = async (key, next) => {
    const before = prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: next }));
    setStatus({ text: 'Saving…', error: false });
    try {
      const saved = await saveEmailPreferences({ [key]: next });
      setPrefs((prev) => ({ ...prev, [key]: saved[key] !== false }));
      setStatus({ text: 'Saved.', error: false });
    } catch (err) {
      setPrefs((prev) => ({ ...prev, [key]: before }));
      setStatus({ text: err?.friendlyMessage || 'That couldn’t be saved. Please try again.', error: true });
    }
  };

  return (
    <div className='grid gap-3'>
      {EMAILS.map((email) => (
        <CheckboxInput
          key={email.key}
          id={`${uid}-${email.key}`}
          checked={Boolean(prefs?.[email.key])}
          disabled={prefs === null}
          onChange={(e) => change(email.key, e.target.checked)}
          label={
            <span className='grid'>
              <span className='font-medium'>{email.title}</span>
              <span className='text-sm opacity-80'>{email.blurb}</span>
            </span>
          }
        />
      ))}
      <p className='text-sm opacity-80'>Emails about your account (verifying, passwords, invites, payments and gifts) always come.</p>
      <p aria-live='polite' className={`text-sm ${status.error ? 'font-medium text-status-critical' : ''}`}>
        {status.text}
      </p>
    </div>
  );
}

export default AccountEmailsSection;
