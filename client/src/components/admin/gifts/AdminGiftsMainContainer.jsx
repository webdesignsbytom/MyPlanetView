import React, { useCallback, useEffect, useState } from 'react';
// Api
import { getAdminGifts, getAdminReferrals } from '@/api/adminApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import GiftAdminItem from './GiftAdminItem';
// Utils
import { referralWords, whenWords } from '@/utils/admin/adminWords';

/** A list that may still be loading, may have failed, or may be empty */
function ListBody({ items, error, empty, children }) {
  if (error) return <InlineAlert>{error}</InlineAlert>;
  if (items === null) {
    return (
      <div className='grid place-items-center py-4' aria-busy='true'>
        <LoadingSpinner lg />
      </div>
    );
  }
  if (!items.length) return <p className='text-center'>{empty}</p>;
  return children;
}

/**
 * Gifts and referral rewards for support (docs/API.md "Admin"; the audit, 26 Nov 2026): a gift
 * found by its code ("my code doesn't work"), the gifts bought lately, and who earned which
 * referral reward.
 */
function AdminGiftsMainContainer() {
  const [code, setCode] = useState('');
  const [found, setFound] = useState(null); // null: nothing looked up yet
  const [finding, setFinding] = useState(false);
  const [findError, setFindError] = useState(null);
  const [latest, setLatest] = useState(null);
  const [latestError, setLatestError] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [rewardsError, setRewardsError] = useState(null);

  const loadLists = useCallback(() => {
    setLatest(null);
    setRewards(null);
    getAdminGifts()
      .then((page) => setLatest(page.gifts || []))
      .catch((err) => setLatestError(err.friendlyMessage || 'The gifts couldn’t be loaded.'));
    getAdminReferrals()
      .then((page) => setRewards(page.rewards || []))
      .catch((err) => setRewardsError(err.friendlyMessage || 'The referral rewards couldn’t be loaded.'));
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  async function find(e) {
    e.preventDefault();
    if (!code.trim()) {
      setFindError('Type the gift’s code, as XXXX-XXXX-XXXX.');
      return;
    }
    setFinding(true);
    setFindError(null);
    try {
      setFound((await getAdminGifts({ code })).gifts || []);
    } catch (err) {
      setFound(null);
      setFindError(err.friendlyMessage || 'That code couldn’t be looked up.');
    } finally {
      setFinding(false);
    }
  }

  return (
    <>
      <PaperCard title='Find a gift' titleId='admin-find-gift-heading' className='paper-fields'>
        <form className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end' onSubmit={find} noValidate aria-labelledby='admin-find-gift-heading'>
          <FormField id='admin-gift-code' label='Gift code' hint='As the buyer or the person given it reads it out: XXXX-XXXX-XXXX, any case.' align='start'>
            <TextInput value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} autoComplete='off' autoCapitalize='characters' spellCheck='false' />
          </FormField>
          <Button type='submit' busy={finding}>
            Find
          </Button>
        </form>
        <InlineAlert>{findError}</InlineAlert>
        {found ? (
          <section aria-label='The gift found' className='grid gap-3'>
            {found.length ? found.map((gift) => <GiftAdminItem key={gift.id} gift={gift} />) : <p className='text-center'>No gift has that code.</p>}
          </section>
        ) : null}
      </PaperCard>

      <PaperCard
        title='Gifts bought lately'
        titleId='admin-latest-gifts-heading'
        action={
          <Button small quiet onClick={loadLists} ariaLabel='Reload the gifts and referral rewards'>
            Reload
          </Button>
        }
      >
        <ListBody items={latest} error={latestError} empty='No gifts bought yet.'>
          <ul className='grid gap-3 lg:grid-cols-2' aria-label='Gifts bought lately'>
            {(latest || []).map((gift) => (
              <li key={gift.id} className='grid'>
                <GiftAdminItem gift={gift} />
              </li>
            ))}
          </ul>
        </ListBody>
      </PaperCard>

      <PaperCard title='Referral rewards' titleId='admin-referrals-heading'>
        <p className='text-sm'>
          A member earns one when a friend who signed up with their invite link first pays: a month off their bill if they pay, else a month of a plan, at most 12 a year.
        </p>
        <ListBody items={rewards} error={rewardsError} empty='No referral rewards yet.'>
          <ul className='grid gap-2' aria-label='Referral rewards'>
            {(rewards || []).map((reward) => (
              <li key={reward.id} className='grid gap-1 border-2 border-poster-brown bg-paper-cream p-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]' data-admin-reward={reward.kind}>
                <p>
                  <span className='font-semibold'>{reward.referrer ? reward.referrer.name : 'An account since deleted'}</span>
                  {reward.referrer ? (
                    <>
                      {' '}
                      (
                      <a href={`mailto:${reward.referrer.email}`} className='underline'>
                        {reward.referrer.email}
                      </a>
                      )
                    </>
                  ) : null}
                  , for {reward.friend ? reward.friend.name : 'a friend since deleted'}: {referralWords(reward)}
                </p>
                <p>{whenWords(reward.createdAt)}</p>
              </li>
            ))}
          </ul>
        </ListBody>
      </PaperCard>
    </>
  );
}

export default AdminGiftsMainContainer;
