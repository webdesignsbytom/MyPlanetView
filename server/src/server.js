import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { requestLogger } from './utils/requestLog.js';

// Path
import { join } from 'path';
import * as url from 'url';

import { auth } from './auth.js';
import eventRouter from './routes/events.js';
import userRouter from './routes/users.js';
import contactRouter from './routes/contact.js';
import mediaRouter from './routes/mediaGeneric.js';
// Travel
import placesRouter from './routes/places.js';
import mapRouter from './routes/maps.js';
import tripRouter from './routes/trips.js';
import photoRouter from './routes/photos.js';
import momentRouter from './routes/moments.js';
import travelCopyRouter from './routes/travelCopies.js';
import pinRouter from './routes/pins.js';
import goalRouter from './routes/goals.js';
import promoRouter from './routes/promoCodes.js';
import giftRouter from './routes/gifts.js';
import emailRouter from './routes/emails.js';
import { offerClickRouter, offersRouter } from './routes/offers.js';
import themeRouter from './routes/themes.js';
import challengeRouter from './routes/challenges.js';
import sharedRouter from './routes/shared.js';
import inviteRouter from './routes/invites.js';
// Plans and payments
import billingRouter from './routes/billing.js';
import { stripeWebhookHandler } from './controllers/billing.js';
import { streamWebhookHandler } from './controllers/videos.js';
import {
  EVENT_MESSAGES,
  RESPONSE_MESSAGES,
  sendMessageResponse,
} from './utils/responses/responses.js';
import { FRONTEND_ORIGINS } from './utils/config.js';
import { requestContextMiddleware } from './utils/requestContext.js';
import { createAppEvent } from './event/events.js';
import { globalRateLimiter } from './middleware/rateLimit.js';
import { originCheck } from './middleware/originCheck.js';

const app = express();

// Real client IP from Vercel's proxy (rate limits are per visitor)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 4000;
const HTTP_URL = process.env.HTTP_URL || 'http://localhost:';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Global middleware

// Security headers (CSP off: status page uses Google Fonts)
app.use(helmet({ contentSecurityPolicy: false }));

// The API (and its status page) never belongs in search results, and no reply is kept by a
// cache unless its route says so (themes, countries and landmarks, offers set their own):
// the Netlify site passes /api and /go through to here (client/scripts/prerender.mjs,
// 17 Nov 2026), and its CDN must never keep one person's reply for another
app.use((_req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set('Cache-Control', 'no-store');
  next();
});

// Per-request requestId (X-Request-Id)
app.use(requestContextMiddleware);

// Request logger (morgan; share codes, tokens and query values redacted)
app.use(requestLogger);

const allowedOrigins = new Set(FRONTEND_ORIGINS);

app.use(
  cors({
    origin(origin, cb) {
      // allow server-to-server tools (no Origin header)
      if (!origin) return cb(null, true);

      const ok = allowedOrigins.has(origin);
      if (!ok) {
        console.warn('[CORS] rejected origin:', origin);
      }
      return cb(null, ok);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// CSRF: a write from a browser on another site is refused (403) before anything
// runs, better-auth included (middleware/originCheck.js)
app.use(originCheck);

// Stripe's webhook needs the exact bytes it sent to check the signature, so it gets a
// raw body here, before the JSON parser. Stripe sends no Origin and no Sec-Fetch-Site,
// so originCheck lets it through; the signature is what's checked.
app.post(
  '/api/billing/webhook',
  globalRateLimiter,
  express.raw({ type: 'application/json', limit: '1mb' }),
  stripeWebhookHandler,
);
// Cloudflare Stream's notices (a video converted, or failed): raw body for the signature
app.post(
  '/api/videos/stream-webhook',
  globalRateLimiter,
  express.raw({ type: 'application/json', limit: '1mb' }),
  streamWebhookHandler,
);

// JSON only, and no urlencoded parser: every client sends JSON, while a plain HTML
// form can only post urlencoded, multipart or text/plain bodies, which stay unparsed.
app.use(express.json({ limit: '2000kb' }));

// Global rate limit
app.use(globalRateLimiter);

// Better Auth routes (mount first is fine)
app.all('/api/auth/*splat', toNodeHandler(auth));

// Routes

app.use('/api/events', eventRouter);
app.use('/api/users', userRouter);
app.use('/api/contact', contactRouter);
app.use('/api/media-services', mediaRouter);

// Travel (contract: docs/API.md)
app.use('/api', placesRouter); // /api/countries, /api/landmarks
app.use('/api/maps', mapRouter);
app.use('/api/trips', tripRouter);
app.use('/api/photos', photoRouter);
app.use('/api/moments', momentRouter);
// Taking your travels with you: one request (docs/API.md "Travel copies")
app.use('/api/travel-copies', travelCopyRouter);
app.use('/api/pins', pinRouter);
app.use('/api/goals', goalRouter);
app.use('/api/promo-codes', promoRouter);
// Gifts of a year of a plan (docs/API.md "Gifts")
app.use('/api/gifts', giftRouter);
// "On this day" and the links in its emails (docs/API.md "Emails")
app.use('/api/emails', emailRouter);
app.use('/api/offers', offersRouter);
app.use('/api/themes', themeRouter);
app.use('/api/challenges', challengeRouter);
// An offer card's link (docs/API.md, "Travel offers"): counts the click and redirects
app.use('/go', offerClickRouter);
app.use('/api/shared', sharedRouter);
app.use('/api/invites', inviteRouter);
app.use('/api/billing', billingRouter);

app.get('/', (_req, res) => {
  res.sendFile('index.html', { root: join(__dirname, 'views') });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// 404
app.use((req, res) => {
  res.status(404);

  if (req.accepts('html')) {
    res.sendFile(join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    sendMessageResponse(res, 404, '404 Not Found');
  } else {
    res.type('txt').send('404 Not Found');
  }
});

// Global error handler (anything a controller didn't catch)
app.use((error, req, res, _next) => {
  // Body-parser errors are the client's (bad JSON, body too large): no 500, no CRITICAL event
  const clientStatus = error?.status >= 400 && error?.status < 500 ? error.status : null;
  if (clientStatus) {
    if (res.headersSent) return;
    if (clientStatus === 413) return sendMessageResponse(res, 413, 'Request body is too large.');
    return sendMessageResponse(res, 400, EVENT_MESSAGES.malformedData);
  }

  console.error('[ERROR HANDLER]', error);

  createAppEvent({
    level: 'CRITICAL',
    domain: 'system',
    action: 'uncaught-error',
    message: error?.message || 'Unhandled server error',
    statusCode: 500,
    stack: error?.stack,
    path: req.originalUrl,
    method: req.method,
  }).catch((e) =>
    console.error('[ERROR HANDLER] failed to persist AppEvent:', e)
  );

  if (res.headersSent) return;

  // Prisma errors a controller let through
  if (error.code === 'P2002') return sendMessageResponse(res, 409, RESPONSE_MESSAGES.ConflictEvent);
  if (error.code === 'P2025') return sendMessageResponse(res, 404, 'That record does not exist.');

  return sendMessageResponse(res, 500, RESPONSE_MESSAGES.ServerErrorEvent);
});

// Skip listen() under test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(
      `\nServer is running on ${HTTP_URL}${PORT}\nThis no longer consumes souls\n`,
    );
  });
}

export default app;
