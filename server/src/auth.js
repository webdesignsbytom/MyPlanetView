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
import { BETTER_AUTH_RATE_LIMIT } from './utils/constants/rateLimitConstants.js';
import {
  sendUserPasswordResetEmail,
  sendUserVerificationEmail,
} from './services/email/emailHandler.js';
import { runAfterResponse } from './utils/background.js';
// Account media cleanup
import { hardDeleteObject } from './services/s3/mediaService.js';
import { clearUserAvatar, findOwnedAvatarKeys, findUserStatusById } from './domain/users.js';
// Travel data that follows the account
import { ensureDefaultMap } from './services/travel/maps.js';
import {
  acceptInvitesForVerifiedUser,
  releaseTravelDataForDeletedUser,
} from './services/travel/accounts.js';
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
const EMAIL_SEND_RATE_LIMIT = { window: 15 * 60, max: 5 };

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

const cookieAttributes = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

// Travel data, then avatar files, go before the user row (ownership is lost
// after; admin delete reuses this). Shared maps pass to an editor first.
export const deleteUserMedia = async (user) => {
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

const auditAfterHook = createAuthMiddleware(async (ctx) => {
  const audit = AUDITED_PATHS[ctx.path];
  if (!audit || ctx.context.returned instanceof Error) return;
  const user = ctx.context.newSession?.user ?? ctx.context.session?.user ?? null;
  logEvent(audit(user));
});

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  trustedOrigins: FRONTEND_ORIGINS,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  // better-auth rate limiter (off under test)
  rateLimit: {
    enabled: process.env.NODE_ENV !== 'test',
    window: BETTER_AUTH_RATE_LIMIT.windowSeconds,
    max: BETTER_AUTH_RATE_LIMIT.max,
    customRules: {
      '/request-password-reset': EMAIL_SEND_RATE_LIMIT,
      '/send-verification-email': EMAIL_SEND_RATE_LIMIT,
    },
  },

  // Email/password auth (callbacks only send the emails)
  emailAndPassword: {
    enabled: true,
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
    // Link goes to the new address; email changes once it's clicked
    changeEmail: { enabled: true },
    // Password is required by the client
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
        // A newly verified address picks up any maps or trips shared with it
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

  hooks: { after: auditAfterHook },

  advanced: {
    // __Secure- cookie names need the Secure flag, so production only
    useSecureCookies: isProd,

    // Cross-site frontend -> api cookies
    cookies: {
      session_token: { attributes: cookieAttributes },
      session_data: { attributes: cookieAttributes },
      dont_remember: { attributes: cookieAttributes },
    },
  },
});
