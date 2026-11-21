import React, { useId, useRef } from 'react';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';

// Importing from Polarsteps, step 1 (docs/API.md "Importing from Polarsteps"): how to get the
// download, and choosing it: the zip Polarsteps emails, or the folder it was unzipped to. It's
// read on this device; nothing is sent until the trips are chosen.
function ImportPickCard({ reading, error, onPick }) {
  const uid = useId();
  const zipRef = useRef(null);
  const folderRef = useRef(null);
  const picked = (e) => {
    const files = e.target.files;
    if (files?.length) onPick(files);
    e.target.value = '';
  };
  return (
    <PaperCard title='Your Polarsteps download' titleId={`${uid}-title`} kicker='Step 1'>
      <ol className='grid list-decimal gap-1 pl-5'>
        <li>In Polarsteps, open your account settings and choose “Download my data”, then start your archive.</li>
        <li>Polarsteps emails you a link to a zip of your trips, photos and stories. Download it to this computer.</li>
        <li>Choose it here, or the folder you unzipped it to.</li>
      </ol>
      <p className='text-sm opacity-80'>
        It’s read here, on your device. Only the trips you choose, with their photos and stories, are sent to your map. Your
        route history stays on your device.
      </p>
      <input ref={zipRef} type='file' accept='.zip,application/zip' className='sr-only' tabIndex={-1} aria-label='Choose the zip' data-import-zip onChange={picked} />
      <input
        ref={folderRef}
        type='file'
        webkitdirectory=''
        directory=''
        multiple
        className='sr-only'
        tabIndex={-1}
        aria-label='Choose the folder'
        data-import-folder
        onChange={picked}
      />
      <div className='grid gap-2 sm:grid-cols-2'>
        <Button busy={reading} onClick={() => zipRef.current?.click()}>
          Choose the zip
        </Button>
        <Button quiet disabled={reading} onClick={() => folderRef.current?.click()}>
          Choose the unzipped folder
        </Button>
      </div>
      {reading ? (
        <p role='status' className='text-sm'>
          Reading your download…
        </p>
      ) : null}
      <InlineAlert>{error}</InlineAlert>
    </PaperCard>
  );
}

export default ImportPickCard;
