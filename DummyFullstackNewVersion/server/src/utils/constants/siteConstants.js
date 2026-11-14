// General
export const BusinessName = 'My Planet View';
// Must match the client FULL_BUSINESS_URL host. The intended domain, not registered yet.
export const BusinessUrl = 'myplanetview.com';

// Email logo (always the live site: mail clients can't load localhost)
export const LogoUrl = `https://${BusinessUrl}/brand/logo.png`;

// Frontend links used in emails
export const FrontendUrl =
  process.env.NODE_ENV === 'production' ? `https://${BusinessUrl}` : 'http://localhost:5173';

export const UserEmailVerificationUrl = `${FrontendUrl}/verify-email-address`;
export const UserResetPasswordUrl = `${FrontendUrl}/reset-password`;

// Travel pages (client routes the API links to; see docs/API.md)
export const SharedPageUrl = `${FrontendUrl}/shared`; // + /<share code>
export const InviteAcceptUrl = `${FrontendUrl}/invite`; // + /<token>
export const MapPageUrl = `${FrontendUrl}/maps`; // + /<mapId>
export const TripPageUrl = `${FrontendUrl}/trips`; // + /<tripId>
