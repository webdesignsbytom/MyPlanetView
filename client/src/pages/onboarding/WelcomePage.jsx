import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Api
import { createMap, getMap, getMyMaps, updateMap } from '@/api/travelApi';
// Constants
import { MAP_PAGE_URL, WELCOME_PAGE_URL } from '@/utils/constants/routes';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import TravelTicket from '@/components/auth/TravelTicket';
import MapSetupForm from '@/components/onboarding/MapSetupForm';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { saveMapSetup } from '@/utils/map/saveMapSetup';

// After sign-up: who your map is for (solo, couple or family) and who travels. It sets up
// the map the server made for you; if there isn't one, it makes it.
function WelcomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [map, setMap] = useState(undefined); // undefined: loading; null: no map yet
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyMaps()
      .then(async ({ maps }) => {
        const own = (maps || []).find((m) => m.isDefault && m.role === 'OWNER') || (maps || []).find((m) => m.role === 'OWNER');
        const detail = own ? (await getMap(own.id)).map : null;
        if (!cancelled) setMap(detail);
      })
      .catch((err) => {
        if (!cancelled) setError(err.friendlyMessage || 'Your map could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (form) => {
    if (map) {
      await saveMapSetup(map.id, map, form);
    } else {
      const created = await createMap({
        name: form.name.trim(),
        groupType: form.groupType,
        travellers: form.travellers
          .filter((t) => t.name.trim())
          .map((t) => ({
            name: t.name.trim(),
            birthCountryCode: t.birthCountryCode || null,
            favouriteCountryCode: t.favouriteCountryCode || null,
          })),
      });
      // A new map starts with the UK as its four nations (the server's default since 18 Nov
      // 2026): only turning that off needs saying (19 Nov 2026, the audit)
      if (!form.splitUk && created?.map?.id) await updateMap(created.map.id, { splitUk: false });
    }
    navigate(MAP_PAGE_URL, { replace: true });
  };

  return (
    <>
      <AppPageHead route={WELCOME_PAGE_URL} />
      <AppPageShell width='max-w-3xl' mainProps={{ 'aria-labelledby': 'welcome-heading', 'aria-describedby': 'welcome-intro' }}>
        {/* Check-in after the sign-up page's boarding pass: the same ticket, with the map's
            set-up (the settings panel's form, so its paper fields too) on the cream */}
        <TravelTicket
          kicker='Check-in'
          title={`Welcome${user?.name ? `, ${user.name}` : ''}`}
          headingId='welcome-heading'
          subtitle='Tell us who this map is for. A couple or a family share one map: add everyone who travels, children included. Anyone can have their own login later, and you can change all of this in the map’s settings.'
          subtitleId='welcome-intro'
          stub={['Check-in', 'Gate: Your map', 'Seat: Window']}
          stamp={['Bon', 'voyage']}
          widthClassName=''
        >
          <div className='paper-fields grid gap-5'>
            {user?.emailVerified === false ? (
              <p className='tone-info border px-3 py-2 text-sm leading-relaxed'>
                We’ve emailed a link to {user.email}. Setting up your map works now; once you’ve verified your address,
                you can add countries, trips and photos.
              </p>
            ) : null}
            <InlineAlert>{error}</InlineAlert>
            {map === undefined && !error ? (
              <div className='grid place-items-center py-10' role='status'>
                <LoadingSpinner md />
                <span className='sr-only'>Loading…</span>
              </div>
            ) : null}
            {map !== undefined ? (
              <MapSetupForm
                initial={
                  map || {
                    name: '',
                    groupType: 'SOLO',
                    splitUk: true,
                    travellers: [{ name: user?.name || '', birthCountryCode: '', favouriteCountryCode: '' }],
                  }
                }
                submitLabel='Start my map'
                onSubmit={handleSubmit}
              />
            ) : null}
          </div>
        </TravelTicket>
      </AppPageShell>
    </>
  );
}

export default WelcomePage;
