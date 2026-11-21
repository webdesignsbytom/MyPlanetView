import React from 'react';
import { Link } from 'react-router-dom';
// Constants
import { IMPORT_PAGE_URL } from '@/utils/constants/routes';

// The account page: bringing your travels from Polarsteps (docs/API.md "Importing from Polarsteps")
function AccountImportSection() {
  return (
    <div className='grid gap-3'>
      <p>Already on Polarsteps? Bring your trips, their photos and each step’s story to your map. Your download is read on your own device.</p>
      <Link to={IMPORT_PAGE_URL} className='btn-paper justify-self-start'>
        Bring your travels from Polarsteps
      </Link>
    </div>
  );
}

export default AccountImportSection;
