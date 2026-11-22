import React, { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Components
import Button from '@/components/common/Button';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
// Constants
import { GIFTS_PAGE_URL, giftPath } from '@/utils/constants/routes';

// The account page's gifts (docs/API.md "Gifts"): a gift code to redeem (it opens the gift's
// page, which redeems it), and the way to give one.
function AccountGiftsSection() {
  const uid = useId();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const open = (e) => {
    e.preventDefault();
    const clean = code.toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (clean) navigate(giftPath(clean));
  };
  return (
    <div className='grid gap-4'>
      <form className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end' onSubmit={open}>
        <FormField id={`${uid}-code`} label='Have a gift code?' align='start'>
          <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder='XXXX-XXXX-XXXX' autoComplete='off' autoCapitalize='characters' spellCheck={false} />
        </FormField>
        <Button type='submit' quiet disabled={!code.trim()}>
          Open it
        </Button>
      </form>
      <p className='text-sm'>
        Or give someone a year of travel:{' '}
        <Link to={GIFTS_PAGE_URL} className='font-semibold text-poster-red-deep underline underline-offset-2'>
          gifts of Business or First Class
        </Link>
        .
      </p>
    </div>
  );
}

export default AccountGiftsSection;
