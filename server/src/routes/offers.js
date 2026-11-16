import { Router } from 'express';
import { listOffersHandler, offerClickHandler } from '../controllers/offers.js';

// Travel offers (docs/API.md, "Travel offers"). No account needed for either: the cards
// show on share links and public country pages too. The admin's routes are under
// /api/users/admin/offers.

/** Mounted at /api/offers: the live offers, which the client picks cards from. */
export const offersRouter = Router();
offersRouter.get('/', listOffersHandler);

/** Mounted at /go: a card's link. It counts the click, then redirects to the partner. */
export const offerClickRouter = Router();
offerClickRouter.get('/:offerId', offerClickHandler);
