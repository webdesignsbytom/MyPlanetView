import React, { useRef, useState } from 'react';
// Icons
import { FaDownload } from 'react-icons/fa';
// Components
import FormAlert from '@/components/forms/FormAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { buildDataExport, dataExportFileName, saveJsonFile } from '@/utils/account/dataExport';

const LINK_DAYS = 7;

/**
 * "Your data" (docs/API.md, "Your data"): a copy of everything the account holds, free on
 * every plan, as one JSON file: the account and plan, every map you own (its countries,
 * trips, moments, goals, badges and who it's shared with) with its photos, and your photos
 * on other people's maps. Each photo has a link to its best copy that works for a week.
 */
function AccountDataSection() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [alert, setAlert] = useState({ message: '', variant: 'error' });
  const alertRef = useRef(null);

  const onDownload = async () => {
    if (busy) return;
    setBusy(true);
    setAlert({ message: '', variant: 'error' });
    try {
      const contents = await buildDataExport({ onProgress: setProgress });
      saveJsonFile(contents, dataExportFileName(contents.exportedAt));
      setAlert({ message: `Your data is downloading. The photo links in it work for ${LINK_DAYS} days.`, variant: 'success' });
    } catch (err) {
      setAlert({ message: err.friendlyMessage || 'Your data couldn’t be gathered. Please try again.', variant: 'error' });
    } finally {
      setBusy(false);
      setProgress('');
      requestAnimationFrame(() => alertRef.current?.focus());
    }
  };

  return (
    <div className='grid gap-4 justify-items-center text-center'>
      <p className='text-sm'>
        A copy of everything your account holds, free on every plan: your maps, countries, trips, moments, goals and
        badges, who they’re shared with, and every photo’s details with a link to download it (the links work for{' '}
        {LINK_DAYS} days). It’s one JSON file that other apps can read.
      </p>
      <button type='button' className='btn-poster grid grid-cols-reg items-center gap-2' onClick={onDownload} aria-busy={busy} disabled={busy}>
        {busy ? <LoadingSpinner xs /> : <FaDownload aria-hidden='true' />}
        Download my data
      </button>
      <p role='status' className='text-sm'>
        {busy && progress ? `Gathering: ${progress}…` : ''}
      </p>
      <FormAlert innerRef={alertRef} message={alert.message} variant={alert.variant} />
    </div>
  );
}

export default AccountDataSection;
