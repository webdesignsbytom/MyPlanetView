import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { prisma } from './prisma.js';
import { FRONTEND_ORIGINS } from './utils/config.js';
import {
  BusinessName,
  BusinessUrl,
  LogoUrl,
  UserEmailVerificationUrl,
  UserResetPasswordUrl,
} from './utils/constants/siteConstants.js';
import {
  AUTH_EMAIL_RATE_LIMIT,
  BETTER_AUTH_RATE_LIMIT,
  IPV6_SUBNET,
} from './utils/constants/rateLimitConstants.js';
import { rateLimitsOff } from './middleware/rateLimit.js';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES_MESSAGE,
  isValidPassword,
} from './utils/passwordRules.js';
import {
  sendUserChangeEmailConfirmation,
  sendUserPasswordResetEmail,
  sendUserVerificationEmail,
} from './services/email/emailHandler.js';
import { runAfterResponse } from './utils/background.js';
import { cleanDisplayName } from './utils/displayName.js';
// Account media cleanup
import { hardDeleteObject } from './services/s3/mediaService.js';
import { clearUserAvatar, findOwnedAvatarKeys, findUserStatusById } from './domain/users.js';
// Travel data that follows the account
import { ensureDefaultMap } from './services/travel/maps.js';
import {
  acceptInvitesForVerifiedUser,
  releaseTravelDataForDeletedUser,
} from './services/travel/accounts.js';
// Influencer codes: checked before sign-up, recorded after, the offer given once verified
import { recordSignUpPromoCode, usablePromoCode } from './services/billing/promo.js';
import { endSubscriptionOfDeletedAccount } from './services/billing/subscriptions.js';
// Responses
import { EVENT_MESSAGES } from './utils/responses/responses.js';
// Events
import { logEvent } from './utils/events/logEvent.js';
import {
  createUserRegisterSuccessEvent,
  createUserVerifyEmailSuccessEvent,
  createUserResendVerificationSuccessEvent,
  createUserPasswordChangeSuccessEvent,
  createUserPasswordResetRequestSuccessEvent,
  createUserPasswordResetPerformSuccessEvent,
  createUserUpdateRequestedEvent,
  createUserUpdateSuccessEvent,
  createUserDeleteSuccessEvent,
} from './event/userUtils.js';

const isProd = process.env.NODE_ENV === 'production';

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL; // https://bytetoast-studio.vercel.app

// Reset/verification link lifetimes
const RESET_PASSWORD_EXPIRES_IN_SECONDS = 60 * 60; // 1 hour
const EMAIL_VERIFICATION_EXPIRES_IN_SECONDS = 60 * 60 * 24; // 24 hours

// Strict limit for endpoints that send email
const EMAIL_SEND_RATE_LIMIT = { window: AUTH_EMAIL_RATE_LIMIT.windowSeconds, max: AUTH_EMAIL_RATE_LIMIT.max };

const formatExpiry = (seconds) =>
  new Date(Date.now() + seconds * 1000).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  });

// Seed turns this off so sign-ups don't email real addresses
let authEmailsEnabled = true;
export const disableAuthEmails = () => {
  authEmailsEnabled = false;
};

// Production keeps SameSite=None for now, because the API's host isn't decided and
// may be a different site from the client's (middleware/originCheck.js refuses
// cross-site writes meanwhile). Switch to 'lax' once the API is on api.<domain>.
// The browser must see these cookies as the site's own: called on another site
// (my-planet-view.vercel.app from the Netlify site), they're third-party, which Safari and
// many phone browsers never keep, and every request after signing in got "No valid
// session found" (17 Nov 2026). So the Netlify site passes /api through to here
// (client/scripts/prerender.mjs), and the client calls its own address (VITE_API_URL).
const cookieAttributes = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

// The subscription ends first (so Stripe stops charging; if Stripe can't be told, nothing
// is deleted), then travel data, then avatar files, before the user row (ownership is
// lost after; admin delete reuses this). Shared maps pass to an editor first.
export const deleteUserMedia = async (user) => {
  try {
    await endSubscriptionOfDeletedAccount(user.id);
  } catch (err) {
    console.error('[AUTH] subscription not cancelled, account kept:', err.message);
    throw new APIError('SERVICE_UNAVAILABLE', { message: EVENT_MESSAGES.subscriptionNotCancelled });
  }
  await releaseTravelDataForDeletedUser(user);

  const keys = await findOwnedAvatarKeys(user.id);
  await clearUserAvatar(user.id);
  for (const key of keys) {
    try {
      await hardDeleteObject({ key, user });
    } catch (err) {
      console.error('[AUTH] avatar cleanup failed:', key, err.message);
    }
  }
};

// Audit events for account actions handled by better-auth
const AUDITED_PATHS = {
  '/sign-up/email': (user) => createUserRegisterSuccessEvent({ target: user }),
  '/verify-email': (user) => createUserVerifyEmailSuccessEvent({ user, target: user }),
  '/send-verification-email': (user) => createUserResendVerificationSuccessEvent({ user }),
  '/change-password': (user) => createUserPasswordChangeSuccessEvent({ user, target: user }),
  '/request-password-reset': () => createUserPasswordResetRequestSuccessEvent({ user: null }),
  '/reset-password': () => createUserPasswordResetPerformSuccessEvent({ userId: null }),
  '/change-email': (user) => createUserUpdateRequestedEvent({ user }),
  '/update-user': (user) => createUserUpdateSuccessEvent({ user, target: user }),
};

// A sign-up's promo code (optional; better-auth ignores fields it doesn't know)
const promoCodeIn = (body) =>
  body && typeof body === 'object' && typeof body.promoCode === 'string' && body.promoCode.trim() ? body.promoCode : null;

const auditAfterHook = createAuthMiddleware(async (ctx) => {
  const audit = AUDITED_PATHS[ctx.path];
  if (!audit || ctx.context.returned instanceof Error) return;
  const user = ctx.context.newSession?.user ?? ctx.context.session?.user ?? null;
  logEvent(audit(user));
  // The new account keeps the code it signed up with; a failure never fails the sign-up
  if (ctx.path === '/sign-up/email' && user && promoCodeIn(ctx.body)) {
    await recordSignUpPromoCode(user, promoCodeIn(ctx.body)).catch((err) =>
      console.error('[AUTH] promo code not recorded:', err.message)
    );
  }
});

// Paths whose `name` is cleaned before better-auth stores it
const NAME_PATHS = new Set(['/sign-up/email', '/update-user']);

// Paths that set a new password, and the body field that carries it
const NEW_PASSWORD_FIELDS = {
  '/sign-up/email': 'password',
  '/reset-password': 'newPassword',
  '/change-password': 'newPassword',
};

// Checks before better-auth's own handlers run
const beforeHook = createAuthMiddleware(async (ctx) => {
  // Deleting the account always needs the password, which better-auth then checks
  // (without one it only wants a "fresh" session, so a stolen cookie would do)
  if (ctx.path === '/delete-user') {
    const password = ctx.body?.password;
    if (typeof password !== 'string' || !password) {
      throw new APIError('BAD_REQUEST', { message: EVENT_MESSAGES.passwordRequiredToDelete });
    }
    return undefined;
  }

  // A new password follows the client's rules (utils/passwordRules.js). Only for
  // requests over HTTP: the seed's sign-ups (auth.api, no request) keep their
  // simple test passwords. A missing password is left to better-auth (400).
  const passwordField = NEW_PASSWORD_FIELDS[ctx.path];
  if (passwordField && ctx.request) {
    const password = ctx.body?.[passwordField];
    if (typeof password === 'string' && !isValidPassword(password)) {
      throw new APIError('BAD_REQUEST', { message: PASSWORD_RULES_MESSAGE });
    }
  }

  // A promo code that can't be used is refused before the account is made, so the
  // person can fix it or sign up without one
  if (ctx.path === '/sign-up/email' && promoCodeIn(ctx.body) && !(await usablePromoCode(promoCodeIn(ctx.body)))) {
    throw new APIError('BAD_REQUEST', { message: EVENT_MESSAGES.promoCodeInvalid });
  }

  // Names go into emails other people get (share emails): one line, at most 80
  // characters, no control characters (utils/displayName.js)
  if (NAME_PATHS.has(ctx.path) && ctx.body && typeof ctx.body === 'object' && 'name' in ctx.body) {
    const name = cleanDisplayName(ctx.body.name);
    if (!name) throw new APIError('BAD_REQUEST', { message: EVENT_MESSAGES.nameRequired });
    return { context: { body: { ...ctx.body, name } } };
  }

  return undefined;
});

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  trustedOrigins: FRONTEND_ORIGINS,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  // better-auth's rate limiter, counted in the database (the AuthRateLimit model) so
  // every Vercel instance shares one count. Keyed on the client IP (an IPv6 address
  // on its /64; see `advanced.ipAddress`) and the path. Off under test.
  rateLimit: {
    enabled: !rateLimitsOff(),
    storage: 'database',
    modelName: 'authRateLimit',
    window: BETTER_AUTH_RATE_LIMIT.windowSeconds,
    max: BETTER_AUTH_RATE_LIMIT.max,
    customRules: {
      '/request-password-reset': EMAIL_SEND_RATE_LIMIT,
      '/send-verification-email': EMAIL_SEND_RATE_LIMIT,
    },
  },

  // Every request reads the session and its user from the database (no cookie
  // cache), so a changed role or a deactivation applies at once (middleware/auth.js)
  session: {
    cookieCache: { enabled: false },
  },

  // Email/password auth (callbacks only send the emails)
  emailAndPassword: {
    enabled: true,
    // The rest of the rules are checked in beforeHook
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: RESET_PASSWORD_EXPIRES_IN_SECONDS,
    sendResetPassword: async ({ user, token }) => {
      if (!authEmailsEnabled) return;
      const resetUrl = `${UserResetPasswordUrl}/${user.id}/${token}`;

      // Send in background (constant timing hides account existence)
      runAfterResponse(sendUserPasswordResetEmail(
        user.email,
        `${BusinessName}: Reset Password`,
        'userPasswordResetEmail',
        {
          title: `${BusinessName}: Reset Password`,
          email: user.email,
          resetUrl,
          expiryTime: formatExpiry(RESET_PASSWORD_EXPIRES_IN_SECONDS),
          businessUrl: BusinessUrl,
          businessName: BusinessName,
          logoUrl: LogoUrl,
          year: new Date().getFullYear(),
        }
      ));
    },
  },

  // Sign-up, resend and change-email all send this
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: EMAIL_VERIFICATION_EXPIRES_IN_SECONDS,
    sendVerificationEmail: async ({ user, token }) => {
      if (!authEmailsEnabled) return;
      const confirmationUrl = `${UserEmailVerificationUrl}/${user.id}/${token}`;

      // Send in background
      runAfterResponse(sendUserVerificationEmail(
        user.email,
        `${BusinessName}: Verify email address`,
        'userVerificationEmail',
        {
          title: `${BusinessName}: Verify email address`,
          email: user.email,
          confirmationUrl,
          expiryTime: formatExpiry(EMAIL_VERIFICATION_EXPIRES_IN_SECONDS),
          businessUrl: BusinessUrl,
          businessName: BusinessName,
          logoUrl: LogoUrl,
          year: new Date().getFullYear(),
        }
      ));
    },
  },

  user: {
    // Columns of our own on the user row. Declared so the session's user carries
    // them (middleware/auth.js uses them without reading the row again). Never set
    // through better-auth: a sign-up always gets the defaults, and update-user
    // refuses them (400); only the admin routes change them.
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'USER', input: false },
      isActive: { type: 'boolean', required: false, defaultValue: true, input: false },
    },
    // A verified account confirms from its current address first; that link
    // (through /verify-email) then sends the usual verification to the new address,
    // and the email changes once that one is clicked. An unverified account skips
    // the first step: the link goes straight to the new address. An address that
    // already has an account gets the same 200 and no email (better-auth 1.5+), so
    // the answer doesn't say whether it's taken.
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, token }) => {
        if (!authEmailsEnabled) return;
        // `?change=confirm` lets the client page say what happens next
        const confirmationUrl = `${UserEmailVerificationUrl}/${user.id}/${token}?change=confirm`;
        const title = `${BusinessName}: Confirm your new email address`;

        runAfterResponse(sendUserChangeEmailConfirmation(
          user.email,
          title,
          'userChangeEmailConfirmation',
          {
            title,
            email: user.email,
            newEmail,
            confirmationUrl,
            expiryTime: formatExpiry(EMAIL_VERIFICATION_EXPIRES_IN_SECONDS),
            businessUrl: BusinessUrl,
            businessName: BusinessName,
            logoUrl: LogoUrl,
            year: new Date().getFullYear(),
          }
        ));
      },
    },
    // The password is required (beforeHook) and checked by better-auth. (1.4.13
    // multiplied freshAge by 1000 twice, so any session under about 1000 days old
    // counted as fresh; 1.6 fixed that, but a stolen fresh cookie would still do
    // without the hook, so it stays.)
    deleteUser: {
      enabled: true,
      beforeDelete: deleteUserMedia,
      afterDelete: async () => logEvent(createUserDeleteSuccessEvent({ user: null })),
    },
  },

  // Avatars are only set through /api/users/user/upload-or-change-avatar
  databaseHooks: {
    user: {
      create: {
        before: async () => ({ data: { image: null } }),
        // Every account starts with its own map ("My map", solo); a failure here
        // never blocks sign-up (GET /api/maps makes it on demand)
        after: async (user) => {
          try {
            await ensureDefaultMap(user);
            await acceptInvitesForVerifiedUser(user);
          } catch (err) {
            console.error('[AUTH] default map setup failed:', err.message);
          }
        },
      },
      update: {
        before: async (data) => ('image' in data ? { data: { image: undefined } } : undefined),
        // A newly verified address picks up any maps or trips shared with it (once each).
        // A promo code's free month comes later, with the first paid Checkout.
        after: async (user) => {
          if (!user?.emailVerified) return;
          await acceptInvitesForVerifiedUser(user).catch((err) =>
            console.error('[AUTH] invite conversion failed:', err.message)
          );
        },
      },
    },
    // Deactivated users can't sign in (403 + message for the login form)
    session: {
      create: {
        before: async (session) => {
          const user = await findUserStatusById(session.userId);
          if (user?.isActive === false) {
            throw new APIError('FORBIDDEN', { message: EVENT_MESSAGES.accountDeactivated });
          }
        },
      },
    },
  },

  hooks: { before: beforeHook, after: auditAfterHook },

  advanced: {
    // __Secure- cookie names need the Secure flag, so production only
    useSecureCookies: isProd,

    // Cross-site frontend -> api cookies (every cookie better-auth sets)
    defaultCookieAttributes: cookieAttributes,

    // The client IP for the rate limiter. Vercel overwrites x-forwarded-for with the
    // visitor's address (one value, the same one Express's req.ip gives with
    // `trust proxy` 1); a header with several values isn't trusted. IPv6 counts per /64.
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for'],
      ipv6Subnet: IPV6_SUBNET,
    },
  },
});
