// Social media (My Planet View has none yet; an empty URL hides the link everywhere)
export const FACEBOOK_URL = '';
export const INSTAGRAM_URL = '';
export const LINKEDIN_URL = '';
export const BLUESKY_URL = '';
export const X_URL = '';
export const TIKTOK_URL = '';
export const TWITTER_URL = '';
export const GITHUB_URL = '';
export const GOOGLE_BUSINESS_URL = '';

// Contacts
export const TELEGRAM_URL = '';
export const DISCORD_URL = '';
export const REDDIT_URL = '';
export const SNAPCHAT_URL = '';

// Payments
export const APPLE_URL = '';
export const GOOGLE_URL = '';
export const APPLE_PAY_EMAIL = '';
export const PAYPAL_URL = '';
export const YOUPAY_URL = '';
export const CASH_APP_URL = '';
export const VENMO_URL = '';

// Forms
export const QUESTIONAIRE_URL = '';

// Structured data sameAs: real profile URLs only (bare placeholders like https://facebook.com/ are left out)
const isProfileUrl = (url) => /^https?:\/\/[^/]+\/[^/?#]/.test(url);
export const SOCIAL_URLS = [FACEBOOK_URL, INSTAGRAM_URL, LINKEDIN_URL, X_URL, BLUESKY_URL, TIKTOK_URL].filter(isProfileUrl);
