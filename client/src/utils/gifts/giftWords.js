// Gifts of a year of a plan (docs/API.md "Gifts"): the words for them.
import { formatPence } from '@/utils/constants/plans';

export const GIFT_TO_NAME_MAX = 60;
export const GIFT_MESSAGE_MAX = 300;

/** Where a gift stands, as its buyer reads it. */
export const GIFT_STATUS_WORDS = Object.freeze({
  READY: 'Ready to give',
  REDEEMED: 'Redeemed',
  REFUNDED: 'Refunded',
});

/** "A year of First Class", "6 months of Business" */
export const giftTitle = (gift) => `${gift.months === 12 ? 'A year' : `${gift.months} months`} of ${gift.planName ?? gift.name}`;

/** "£99" */
export const giftPrice = (offer) => formatPence(offer.pence);
