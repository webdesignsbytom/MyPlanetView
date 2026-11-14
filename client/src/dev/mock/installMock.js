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
import { loadStore, setMockRole } from './store';
import MockBadge from './MockBadge';
import { registerAccountRoutes } from './handlers/account';
import { registerMapRoutes } from './handlers/maps';
import { registerTripRoutes } from './handlers/trips';
import { registerPhotoRoutes } from './handlers/photos';
import { registerSharingRoutes } from './handlers/sharing';
import { registerAdminRoutes } from './handlers/admin';

export function installMock() {
  // ?mockRole=ADMIN or DEVELOPER switches the test user's role, and is remembered
  const role = new URLSearchParams(window.location.search).get('mockRole');
  if (role) setMockRole(role.toUpperCase());

  loadStore();
  registerAccountRoutes();
  registerMapRoutes();
  registerTripRoutes();
  registerPhotoRoutes();
  registerSharingRoutes();
  registerAdminRoutes();

  // Every request goes to the adapter: the API client, the global axios (media uploads)
  // and the photo upload XHR
  httpClient.defaults.adapter = mockAdapter;
  axios.defaults.adapter = mockAdapter;
  installUploadInterceptor();

  // AuthProvider only checks the session when this flag is set, so you start signed in
  setStoredItem('isLoggedIn', 'true');

  const host = document.createElement('div');
  host.id = 'mock-mode-badge';
  document.body.appendChild(host);
  createRoot(host).render(createElement(MockBadge));

  console.info(`[${MOCK_MARKER}] Mock mode: signed in as the test user; every API call is answered in the browser.`);
}
