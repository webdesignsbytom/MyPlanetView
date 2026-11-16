// Cloudflare Stream settings (docs/API.md "Videos"), read when used so tests can set them.
// Without the five needed for uploads and playback, videos answer 503 "Videos aren't set up
// yet." The webhook secret is needed only for the "ready" notices (without it the server
// asks Stream when someone opens a video still processing).
export const streamConfig = () => ({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  apiToken: process.env.CLOUDFLARE_STREAM_API_TOKEN || '',
  // The "customer-<code>" part of the account's playback host
  customerCode: process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE || '',
  signingKeyId: process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID || '',
  // Base64 of the PEM, as Stream's "create a signing key" answers it
  signingKeyPem: process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM || '',
  webhookSecret: process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET || '',
});

export const streamEnabled = () => {
  const c = streamConfig();
  return Boolean(c.accountId && c.apiToken && c.customerCode && c.signingKeyId && c.signingKeyPem);
};

export const STREAM_NOT_SET_UP = 'Videos aren’t set up yet.';
