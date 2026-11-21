// Mock mode (the default for `npm run dev`, always on with `npm run dev:mock`): the whole
// API answered in the browser, signed in as a test user, no server needed. main.jsx
// imports this only in development, behind a constant production builds compile to
// false, so none of it ships. `?api=real` turns it off (see main.jsx).
import axios from 'axios';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { httpClient } from '@/api/client';
import { setStoredItem } from '@/utils/functions/safeStorage';
import { MOCK_MARKER, mockAdapter } from './mockAdapter';
import { installUploadInterceptor } from './mockXhr';
import { installOfferClickInterceptor } from './offerClicks';
import { loadStore, setMockRole } from './store';
import MockBadge from './MockBadge';
import { registerAccountRoutes } from './handlers/account';
import { registerMapRoutes } from './handlers/maps';
import { registerTripRoutes } from './handlers/trips';
import { registerPhotoRoutes } from './handlers/photos';
import { registerVideoRoutes } from './handlers/videos';
import { registerDataExportRoutes } from './handlers/dataExport';
import { registerMomentRoutes } from './handlers/moments';
import { registerCountryMapRoutes } from './handlers/countryMaps';
import { registerSharingRoutes } from './handlers/sharing';
import { registerAdminRoutes } from './handlers/admin';
import { registerBillingRoutes } from './handlers/billing';
import { registerPromoCodeRoutes } from './handlers/promoCodes';
import { registerOfferAdminRoutes } from './handlers/offerAdmin';
import { registerOfferRoutes } from './handlers/offers';
import { registerPassportRoutes } from './handlers/passport';
import { registerAchievementRoutes } from './handlers/achievements';
import { registerThemeRoutes } from './handlers/themes';
import { registerChallengeRoutes } from './handlers/challenges';
import { registerTravelCopyRoutes } from './handlers/travelCopies';
import { registerMapDesignRoutes } from './handlers/mapDesigns';

export function installMock() {
  // ?mockRole=ADMIN or DEVELOPER switches the test user's role, and is remembered
  const role = new URLSearchParams(window.location.search).get('mockRole');
  if (role) setMockRole(role.toUpperCase());

  loadStore();
  registerAccountRoutes();
  registerMapRoutes();
  registerCountryMapRoutes();
  registerTripRoutes();
  registerPhotoRoutes();
  registerVideoRoutes();
  registerDataExportRoutes();
  registerMomentRoutes();
  registerSharingRoutes();
  registerAdminRoutes();
  registerBillingRoutes();
  registerPromoCodeRoutes();
  registerOfferAdminRoutes();
  registerOfferRoutes();
  registerPassportRoutes();
  registerAchievementRoutes();
  registerThemeRoutes();
  registerChallengeRoutes();
  registerTravelCopyRoutes();
  registerMapDesignRoutes();

  // Every request goes to the adapter: the API client, the global axios (media uploads)
  // and the photo upload XHR
  httpClient.defaults.adapter = mockAdapter;
  axios.defaults.adapter = mockAdapter;
  installUploadInterceptor();
  // A travel offer card's link (/go/:offerId on the API) is counted and followed here
  installOfferClickInterceptor();

  // AuthProvider only checks the session when this flag is set, so you start signed in
  setStoredItem('isLoggedIn', 'true');

  const host = document.createElement('div');
  host.id = 'mock-mode-badge';
  document.body.appendChild(host);
  createRoot(host).render(createElement(MockBadge));

  console.info(`[${MOCK_MARKER}] Mock mode: signed in as the test user; every API call is answered in the browser.`);
}
