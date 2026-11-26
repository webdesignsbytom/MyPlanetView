import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaShareAlt } from 'react-icons/fa';
// Api
import { getVsGroup } from '@/api/vsApi';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Constants
import { VS_PAGE_URL } from '@/utils/constants/routes';
// Components
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import { ShareCardDialog } from '@/components/map/lazyMapPanels';
import VsMedalTable from './VsMedalTable';
import VsCategories from './VsCategories';
import VsBadges from './VsBadges';
import VsInviteCard from './VsInviteCard';
import VsMyMapCard from './VsMyMapCard';
import VsSettingsCard from './VsSettingsCard';
// Utils
import { medalsWords, placeWords } from '@/utils/vs/vsWords';
import { vsCardOptions } from '@/utils/shareCard/cardOptions';

/**
 * One comparison's page (26 Nov 2026, the user's wish: "Vs mode. Connect to another account and
 * have all your stats and badges compared. Able to add multiple people. Gold silver bronze
 * ratings for top people"; docs/API.md "Vs mode"): the medal table, every category compared
 * (two people head to head), the badges only some have, the link to bring friends (8 at most),
 * your map, and the starter's changes. "Share a picture" of your medals once you have one.
 * Anyone not in it is told it doesn't exist (the server's 404).
 */
function VsDetail({ groupId }) {
  const mustVerify = useMustVerifyEmail();
  const [state, setState] = useState({ group: null, error: null });
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ group: null, error: null });
    getVsGroup(groupId)
      .then(({ group }) => {
        if (!cancelled) setState({ group, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ group: null, error: err.friendlyMessage || 'This comparison couldn’t be opened.' });
      });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const { group, error } = state;
  // Each person a key of their own (no one's id is sent; two may share a name)
  const members = useMemo(() => (group ? group.members.map((member, i) => ({ ...member, key: `m${i}` })) : []), [group]);
  const me = members.find((m) => m.isYou);
  const card = useMemo(() => (group && me && (me.gold || me.silver || me.bronze) ? vsCardOptions({ ...group, members }) : null), [group, members, me]);
  const replace = (updated) => setState({ group: updated, error: null });

  if (error) {
    return (
      <PaperCard title='Vs mode' titleId='vs-page-heading' headingLevel={1}>
        <p role='alert' className='text-sm'>
          {error}
        </p>
        <Link to={VS_PAGE_URL} className='text-sm font-medium underline underline-offset-4'>
          Your comparisons
        </Link>
      </PaperCard>
    );
  }
  if (!group) {
    return (
      <div className='grid place-items-center py-10' role='status'>
        <LoadingSpinner lg />
        <span className='sr-only'>Loading the comparison…</span>
      </div>
    );
  }

  const counted = members.filter((m) => m.counting).length;
  return (
    <>
      <PageTitleCard
        page='Vs mode'
        title={group.title}
        headingId='vs-page-heading'
        subtitle={
          me?.place && counted > 1 ? `You’re ${placeWords(me.place)} of ${counted}: ${medalsWords(me)}.` : 'Everyone’s travels compared: names and numbers, never a map.'
        }
      />
      <PaperCard title='Medal table' titleId='vs-medals-heading'>
        <VsMedalTable members={members} />
        {card ? (
          <div className='grid justify-items-start'>
            <Button quiet onClick={() => setSharing(true)}>
              <FaShareAlt aria-hidden='true' className='self-center text-sm' />
              <span>Share a picture</span>
            </Button>
          </div>
        ) : null}
      </PaperCard>
      <PaperCard title={counted === 2 ? 'Head to head' : 'Everything compared'} titleId='vs-compare-heading'>
        {counted < 2 ? <p className='text-sm'>Your numbers so far. Medals come once a friend joins.</p> : null}
        <VsCategories categories={group.categories} members={members} />
      </PaperCard>
      <PaperCard title='Badges' titleId='vs-badges-heading'>
        <VsBadges members={members} />
      </PaperCard>
      <VsInviteCard group={group} canReset={group.youStartedIt && !mustVerify} onChanged={replace} />
      <VsMyMapCard group={group} locked={mustVerify} onChanged={replace} />
      {group.youStartedIt && !mustVerify ? <VsSettingsCard group={group} onChanged={replace} /> : null}
      {sharing && card ? (
        <Suspense fallback={null}>
          <ShareCardDialog card={card} title={card.dialogTitle} onClose={() => setSharing(false)} />
        </Suspense>
      ) : null}
    </>
  );
}

export default VsDetail;
