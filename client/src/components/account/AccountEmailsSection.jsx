import React, { useEffect, useId, useState } from 'react';
// Api
import { getEmailPreferences, saveEmailPreferences } from '@/api/emailsApi';
// Components
import CheckboxInput from '@/components/ui/CheckboxInput';

// The account page's emails (docs/API.md "Emails"): "On this day" on or off (saved as it's
// changed). Emails about the account itself always come.
function AccountEmailsSection() {
  const uid = useId();
  const [onThisDay, setOnThisDay] = useState(null);
  const [status, setStatus] = useState({ text: '', error: false });

  useEffect(() => {
    let alive = true;
    getEmailPreferences()
      .then((prefs) => alive && setOnThisDay(Boolean(prefs.onThisDay)))
      .catch(() => alive && setStatus({ text: 'Your email settings couldn’t be loaded.', error: true }));
    return () => {
      alive = false;
    };
  }, []);

  const change = async (next) => {
    const before = onThisDay;
    setOnThisDay(next);
    setStatus({ text: 'Saving…', error: false });
    try {
      const saved = await saveEmailPreferences({ onThisDay: next });
      setOnThisDay(Boolean(saved.onThisDay));
      setStatus({ text: 'Saved.', error: false });
    } catch (err) {
      setOnThisDay(before);
      setStatus({ text: err?.friendlyMessage || 'That couldn’t be saved. Please try again.', error: true });
    }
  };

  return (
    <div className='grid gap-3'>
      <CheckboxInput
        id={`${uid}-on-this-day`}
        checked={Boolean(onThisDay)}
        disabled={onThisDay === null}
        onChange={(e) => change(e.target.checked)}
        label={
          <span className='grid'>
            <span className='font-medium'>On this day</span>
            <span className='text-sm opacity-80'>A photo of yours from this day in an earlier year, at most once a week.</span>
          </span>
        }
      />
      <p className='text-sm opacity-80'>Emails about your account (verifying, passwords, invites, payments and gifts) always come.</p>
      <p aria-live='polite' className={`text-sm ${status.error ? 'font-medium text-status-critical' : ''}`}>
        {status.text}
      </p>
    </div>
  );
}

export default AccountEmailsSection;
