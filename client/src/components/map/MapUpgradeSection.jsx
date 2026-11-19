import React, { useState } from 'react';
// Api
import { cancelMapUpgrade, upgradeMap } from '@/api/travelApi';
// Constants
import { ACCOUNT_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppLink from '@/components/common/AppLink';
import MapActionButton from './MapActionButton';
import VerifyFirstNote from './VerifyFirstNote';
// Utils
import { extraMapPriceText, planOf } from '@/utils/constants/plans';
import { forgetMapLists } from '@/utils/map/mapListCache';

/**
 * Which plan this map runs on, for its owner, on a map that isn't their main one (19 Nov 2026,
 * docs/API.md "Map limits"): every account has 3 free maps, the main one on the account's plan
 * and the others on Economy; each extra map paid for puts one more on the plan.
 * - On Economy (`map.tier` ECONOMY), on a paid plan: "Upgrade this map" chooses it
 *   (POST /maps/:mapId/upgrade). If an extra map already paid for was free to move, it's on
 *   the plan at once; if not, `onPay()` opens the extra-map dialog to pay for one.
 * - On Economy on an Economy account: upgrading means choosing a plan first (the account page).
 * - On the plan by choice: "Move the upgrade off this map" (DELETE) frees its extra map for another.
 * Locked maps say so in their banner (MapPlanBanner), not here.
 */
function MapUpgradeSection({ map, locked = false, onChanged, onPay }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (!map.tier || map.tier === 'LOCKED') return null;
  const accountPlan = map.accountPlan?.id ? planOf(map.accountPlan.id) : planOf('FREE');
  const paidAccount = accountPlan.id !== 'FREE';

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      forgetMapLists();
      await onChanged?.();
      return result;
    } catch (err) {
      setError(err.friendlyMessage || 'That didn’t work. Try again.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const upgrade = async () => {
    const result = await run(() => upgradeMap(map.id));
    // No extra map to spare: pay for one, and this map takes it
    if (result?.map && result.map.tier !== 'PLAN') onPay?.();
  };

  let text;
  if (map.tier === 'PLAN') {
    text = map.upgraded
      ? `“${map.name}” runs on your ${accountPlan.name} plan, as one of the extra maps you pay for.`
      : `“${map.name}” runs on your ${accountPlan.name} plan, using one of the extra maps you pay for.`;
  } else if (!paidAccount) {
    text = `“${map.name}” is one of your 3 free maps, on Economy. Choose Business or First Class for your account, and you can upgrade any of your maps.`;
  } else if (map.upgraded) {
    text = `“${map.name}” is waiting for its upgrade to ${accountPlan.name}: pay for one more extra map and it moves onto your plan.`;
  } else {
    text = `“${map.name}” is one of your 3 free maps, on Economy: ${planOf('FREE').limits.photosPerCountry} photos of each country, and print copies rather than originals. Upgrade it to your ${accountPlan.name} plan with an extra map. ${extraMapPriceText(accountPlan.id)}`;
  }

  return (
    <section className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='map-upgrade-heading'>
      <h3 id='map-upgrade-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        This map’s plan
      </h3>
      <p className='text-sm opacity-80'>{text}</p>
      {locked ? (
        <VerifyFirstNote action='change which plan this map is on' />
      ) : map.tier === 'PLAN' ? (
        map.upgraded ? (
          <MapActionButton quiet busy={busy} onClick={() => run(() => cancelMapUpgrade(map.id))}>
            Move the upgrade off this map
          </MapActionButton>
        ) : null
      ) : paidAccount ? (
        <MapActionButton busy={busy} onClick={map.upgraded ? () => onPay?.() : upgrade}>
          {map.upgraded ? 'Pay for an extra map' : `Upgrade this map to ${accountPlan.name}`}
        </MapActionButton>
      ) : (
        <AppLink
          to={`${ACCOUNT_PAGE_URL}#account-plan-heading`}
          label='Choose a plan'
          description='your account page, where you choose a plan'
          className='btn-paper justify-self-start'
        />
      )}
      {error ? (
        <p role='alert' className='text-sm text-status-critical'>
          {error}
        </p>
      ) : null}
    </section>
  );
}

export default MapUpgradeSection;
