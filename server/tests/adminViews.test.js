// What the admin pages are sent (src/utils/adminViews.js; the audit, 26 Nov 2026), pure.
import { describe, expect, it } from 'vitest';
import { giftAdminView, overviewView, referralAdminView } from '../src/utils/adminViews.js';
import { MAGNETIC_POLES_YEAR } from '../src/utils/specialPlaces.js';

const NOW = new Date('2026-11-26T12:00:00Z');

const COUNTS = {
  accounts: 120,
  verified: 100,
  deactivated: 2,
  newDay: 3,
  newWeek: 20,
  newMonth: 60,
  maps: 150,
  trips: 300,
  photoKinds: [
    { kind: 'PHOTO', _count: { _all: 5000 } },
    { kind: 'VIDEO', _count: { _all: 12 } },
  ],
  storageBytes: 123456789,
  subscriptions: [
    { plan: 'REGULAR', status: 'active', _count: { _all: 8 } },
    { plan: 'REGULAR', status: 'trialing', _count: { _all: 2 } },
    { plan: 'PREMIUM', status: 'past_due', _count: { _all: 1 } },
  ],
  grants: [{ plan: 'PREMIUM', _count: { _all: 4 } }],
  grantsForLife: 3,
  giftsPaid: 5,
  giftsRedeemed: 3,
  giftsRefunded: 1,
  referralKinds: [{ kind: 'CREDIT', _count: { _all: 6 } }],
  feedbackNew: 7,
};

describe('the admin overview', () => {
  it('shapes the counts', () => {
    const view = overviewView(COUNTS, [], NOW);
    expect(view).toMatchObject({
      accounts: { total: 120, verified: 100, deactivated: 2, new: { day: 3, week: 20, month: 60 } },
      maps: 150,
      trips: 300,
      photos: { photos: 5000, videos: 12 },
      storageBytes: 123456789,
      members: { paying: { REGULAR: 10, PREMIUM: 1 }, trialing: 2, pastDue: 1, complimentary: { REGULAR: 0, PREMIUM: 4 }, forLife: 3 },
      gifts: { paid: 5, redeemed: 3, refunded: 1, waiting: 1 },
      referrals: { CREDIT: 6, GRANT: 0, CAPPED: 0 },
      feedbackNew: 7,
    });
    expect(view.jobs.map((job) => [job.job, job.late])).toEqual([
      ['cleanup', true],
      ['emails', true],
    ]);
  });

  it('carries the yearly reminders due (the magnetic poles, once their year is past)', () => {
    const due = overviewView(COUNTS, [], new Date(Date.UTC(MAGNETIC_POLES_YEAR + 1, 0, 2)));
    expect(due.reminders.map((reminder) => reminder.key)).toEqual(['magneticPoles']);
    expect(due.reminders[0].text).toContain(`Move them to ${MAGNETIC_POLES_YEAR + 1}'s`);
    expect(overviewView(COUNTS, [], new Date(Date.UTC(MAGNETIC_POLES_YEAR, 5, 1))).reminders).toEqual([]);
  });

  it('copes with an empty site', () => {
    const empty = overviewView(
      { ...COUNTS, accounts: 0, photoKinds: [], subscriptions: [], grants: [], referralKinds: [], giftsPaid: 0, giftsRedeemed: 0, giftsRefunded: 0, storageBytes: null },
      [],
      NOW,
    );
    expect(empty.photos).toEqual({ photos: 0, videos: 0 });
    expect(empty.members.paying).toEqual({ REGULAR: 0, PREMIUM: 0 });
    expect(empty.gifts.waiting).toBe(0);
    expect(empty.storageBytes).toBe(0);
  });
});

describe('gifts and referral rewards for the admin', () => {
  it('a gift with its code shown, its state and who bought and redeemed it', () => {
    const gift = {
      id: 'g1',
      code: 'GFT2AD3MN4QR',
      plan: 'PREMIUM',
      months: 12,
      amountPence: 9900,
      currency: 'gbp',
      toName: null,
      createdAt: new Date('2026-11-01T10:00:00Z'),
      paidAt: new Date('2026-11-01T10:05:00Z'),
      redeemedAt: new Date('2026-11-02T09:00:00Z'),
      refundedAt: null,
      buyer: { id: 'u1', name: 'Bea', email: 'bea@example.test' },
      redeemedBy: { id: 'u2', name: 'Gran', email: 'gran@example.test' },
      grant: { startsAt: new Date('2026-11-02T09:00:00Z'), endsAt: new Date('2027-11-02T09:00:00Z') },
    };
    expect(giftAdminView(gift)).toEqual({
      id: 'g1',
      code: 'GFT2-AD3M-N4QR',
      plan: 'PREMIUM',
      planName: 'First Class',
      months: 12,
      amountPence: 9900,
      currency: 'gbp',
      status: 'REDEEMED',
      toName: null,
      createdAt: '2026-11-01T10:00:00.000Z',
      paidAt: '2026-11-01T10:05:00.000Z',
      redeemedAt: '2026-11-02T09:00:00.000Z',
      refundedAt: null,
      buyer: { name: 'Bea', email: 'bea@example.test' },
      redeemedBy: { name: 'Gran', email: 'gran@example.test' },
      grant: { startsAt: '2026-11-02T09:00:00.000Z', endsAt: '2027-11-02T09:00:00.000Z' },
    });
    expect(giftAdminView({ ...gift, redeemedAt: null, redeemedBy: null, grant: null, buyer: null }).status).toBe('READY');
  });

  it('a referral reward with who earned it and the plan given', () => {
    const reward = {
      id: 'r1',
      kind: 'GRANT',
      amountPence: null,
      createdAt: new Date('2026-11-20T00:00:00Z'),
      appliedAt: null,
      referrer: { id: 'u1', name: 'Sam', email: 'sam@example.test' },
      friend: { id: 'u3', name: 'Jo' },
      planGrant: { plan: 'REGULAR', startsAt: new Date('2026-11-20T00:00:00Z'), endsAt: new Date('2026-12-20T00:00:00Z') },
    };
    expect(referralAdminView(reward)).toEqual({
      id: 'r1',
      kind: 'GRANT',
      amountPence: null,
      createdAt: '2026-11-20T00:00:00.000Z',
      appliedAt: null,
      referrer: { name: 'Sam', email: 'sam@example.test' },
      friend: { name: 'Jo' },
      grant: { plan: 'REGULAR', planName: 'Business', startsAt: '2026-11-20T00:00:00.000Z', endsAt: '2026-12-20T00:00:00.000Z' },
    });
    expect(referralAdminView({ ...reward, friend: null, planGrant: null, referrer: null })).toMatchObject({ friend: null, grant: null, referrer: null });
  });
});
