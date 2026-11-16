// Terms and privacy policy for My Planet View. Plain-English drafts written from
// docs/SITE-DESIGN.md: have them checked before launch, and update the version and
// date whenever the wording changes. The payment terms (16 Nov 2026) follow how billing
// works (docs/API.md "Plans and billing", FEATURE-PLAN.md "Upgrades and downgrades") and
// the user's refund choice: in full within 14 days of a first payment, none after.
import {
  CompanyEmailAddress,
  CompanyName,
  OperatorName,
  ADDRESS_LINES,
} from '../constants/constants.js';
import { PLANS, TRANSFER_GRACE_DAYS } from '../constants/plans.js';
import { REFUND_DAYS } from '../plans/billing.js';
import { PROMO_TRIAL_DAYS } from '../plans/promoCodes.js';

const PAID = `${PLANS.REGULAR.name} and ${PLANS.PREMIUM.name}`;

export const LEGAL_VERSION = {
  lastUpdated: '2026-11-16',
  version: '1.1.1',
};

// Terms of use
export const TermsSectionsArray = [
  {
    id: 'terms-overview',
    title: 'Overview',
    group: 'agreements',
    content: [
      `These terms cover your use of ${CompanyName}, a website for keeping a private map of your travels, your travel photos and your trip plans. ${CompanyName} is run by ${OperatorName}.`,
      'By creating an account or using the site you agree to these terms and to the privacy policy below.',
    ],
  },
  {
    id: 'eligibility-and-accounts',
    title: 'Accounts',
    group: 'agreements',
    content: [
      'You need to be 13 or older to create an account, including to be added as an editor on someone else’s map. If you are under 18, you need a parent’s or guardian’s permission. Younger children can appear on a family map as travellers, without an account of their own.',
      'Keep your password safe. You are responsible for what happens under your account, including on a login you choose to share with a partner or family member.',
      'If you think someone else is using your account, change your password and tell us straight away.',
    ],
  },
  {
    id: 'your-content',
    title: 'Your photos and content',
    group: 'agreements',
    content: [
      'You keep ownership of everything you upload: photos, captions, trips and notes.',
      `You give us permission to store your content, make the smaller copies needed to show it, and show it to you and to the people you share it with. We use it only to run ${CompanyName}, and never sell it or use it for advertising.`,
      'Only upload photos you have the right to share. Please think before uploading pictures of other people, especially children, to anything you plan to share.',
    ],
  },
  {
    id: 'sharing',
    title: 'Sharing',
    group: 'agreements',
    content: [
      'Everything is private until you share it. You can add people as viewers or editors, or turn on a link that anyone can open without signing in.',
      'Anyone you share with can see, and could save, what you have shared with them. Turning sharing off or resetting a link stops further access, but cannot undo what someone has already saved.',
      'Editors can add, change and remove content on the map or trip you shared with them.',
    ],
  },
  {
    id: 'children-on-maps',
    title: 'Children on a map',
    group: 'agreements',
    content: [
      'Children under 13 cannot have an account. A parent or guardian can list them on a family map as travellers, with just a first name, and add photos for them.',
      'Young people aged 13 to 17 can have an account, and be editors on a family map, with a parent’s or guardian’s permission. If you add someone under 18 as an editor, you confirm that you are their parent or guardian, or that you have that person’s permission.',
      'Editors see everything on the map they edit, including where each photo was taken. Only add a child as an editor on a map you are happy for them to see in full.',
      'Think carefully before turning on link sharing for a map with photos of children: anyone with the link can see them, without signing in.',
      'If we learn that an account belongs to someone under 13, we will close it and delete what it uploaded. A parent or guardian can ask us at any time to remove a child’s account, photos or details.',
    ],
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    group: 'agreements',
    content: [
      'Do not use the site to store or share anything illegal, abusive, or that infringes someone else’s rights or privacy.',
      'Do not try to access other people’s maps, get round sharing settings or rate limits, or interfere with how the site runs.',
      'We may remove content or suspend an account that breaks these rules.',
    ],
  },
  {
    id: 'plans-and-prices',
    title: 'Plans and prices',
    group: 'agreements',
    content: [
      `${PLANS.FREE.name} is free. ${PAID} are paid plans, by the month or by the year, and you can add extra maps to any plan. The prices are on the Pricing page, and the price shown at checkout, including any VAT that applies, is what you pay.`,
      'A map follows its owner’s plan: everyone who edits or views it gets that plan’s limits.',
      'Payments are handled by Stripe. Your card details go straight to them: we never see or store them.',
    ],
  },
  {
    id: 'renewing-and-cancelling',
    title: 'Renewing and cancelling',
    group: 'agreements',
    content: [
      'A paid plan renews by itself at the end of each month or year, on the card you gave, until you cancel. We remind you by email before a yearly plan renews.',
      `You can cancel at any time with “Manage billing” on your account page. Your plan carries on until the end of the period you have paid for, then your account moves to ${PLANS.FREE.name}. Apart from the ${REFUND_DAYS} days below, we don’t refund part of a period.`,
      'If we change a price, we will tell you at least 30 days before it applies to you, so you can cancel first if you want to.',
      `If a payment fails, Stripe tries again over the following days and we ask you to update your card; your plan keeps working meanwhile. If it still can’t be paid, the plan ends and your account moves to ${PLANS.FREE.name}.`,
    ],
  },
  {
    id: 'refunds',
    title: `${REFUND_DAYS} days to change your mind`,
    group: 'agreements',
    content: [
      `When you first pay for a plan, or for extra maps, you have ${REFUND_DAYS} days to change your mind. Cancel, and tell us within ${REFUND_DAYS} days of that first payment, and we will refund it in full, even if you have used the plan meanwhile.`,
      `With a promo code’s free month, the ${REFUND_DAYS} days start on the day of your first payment, when the free month ends.`,
      `To ask, email ${CompanyEmailAddress} or use the contact page. The refund goes back to the card you paid with, within ${REFUND_DAYS} days of your asking.`,
      'Renewals, and payments after those first days, aren’t refunded. Nothing in these terms takes away your rights under consumer law, for example if the service isn’t as described.',
    ],
  },
  {
    id: 'changing-plans',
    title: 'Changing plan, and what happens to your photos',
    group: 'agreements',
    content: [
      'A change of plan takes effect straight away. Moving up, you pay the difference for the rest of the period; moving down, the difference comes off your next payment.',
      `Nothing is deleted when you move down or a plan ends. Your photos, the originals already kept and your videos all stay. A country already over the new plan’s limit keeps its photos but takes no more; on ${PLANS.FREE.name}, new uploads keep a print-quality copy instead of the original; and videos stay viewable, but no new ones can be added.`,
      'Extra maps you stop paying for are never deleted either. They stay viewable and shareable but take no new photos until they are paid for again. Your first map always stays fully active, and you choose which of the others do.',
      `A map someone hands over to you keeps working fully for ${TRANSFER_GRACE_DAYS} days, so you have time to add an extra map for it if you need one.`,
    ],
  },
  {
    id: 'free-memberships-and-promo-codes',
    title: 'Free memberships and promo codes',
    group: 'agreements',
    content: [
      `We sometimes give a plan free for a set time, for example to people who help us spread the word. When it ends, your account moves to ${PLANS.FREE.name} unless you choose to pay. Nothing is charged and nothing is deleted.`,
      `A promo code gives you your first month of ${PAID} free, once per account. You give a card at checkout. If you don’t cancel within the ${PROMO_TRIAL_DAYS} days, the plan carries on as a paid plan: your card is charged when the free month ends, and at each renewal after that.`,
    ],
  },
  {
    id: 'changes-to-the-service',
    title: 'Changes to the service',
    group: 'agreements',
    content: [
      'We may add, change or remove features. We will give notice before removing anything you rely on. If a change takes away something your paid plan includes, you can cancel and we will refund the part of the period you hadn’t used.',
    ],
  },
  {
    id: 'travel-offers',
    title: 'Travel offers',
    group: 'agreements',
    content: [
      `${CompanyName} shows travel offers from partners such as hotel, tour and flight booking sites: cards marked “Ad” in photo galleries and at the end of slideshows (not on First Class maps, and never to Business or First Class members), two on each country guide, and the Travel Desk, which opens only when you ask.`,
      'They are affiliate links. If you book through one, the partner may pay us a commission. It costs you nothing extra, and it helps keep Economy free.',
      'A booking is between you and the partner, on their terms. We choose partners with care, but we are not responsible for their prices, availability or service.',
    ],
  },
  {
    id: 'availability',
    title: 'Availability and your own copies',
    group: 'agreements',
    content: [
      'We work to keep the site running and your photos safe, but we cannot promise it will always be available or free of errors.',
      'Keep your own copies of photos that matter to you. You can download your originals at any time.',
    ],
  },
  {
    id: 'ending',
    title: 'Closing your account',
    group: 'agreements',
    content: [
      'You can delete your account at any time from your account page. That deletes your maps, trips and the photos you uploaded.',
      `Deleting your account cancels any subscription straight away, so nothing more is charged. Within ${REFUND_DAYS} days of your first payment you can still ask for your refund; otherwise the rest of the period isn’t refunded.`,
      'If you own a map that other people edit, it is handed to one of those editors first, so their photos are not lost with your account.',
      'We may close an account that seriously or repeatedly breaks these terms, and will tell you why where we can.',
    ],
  },
  {
    id: 'liability',
    title: 'Our responsibility to you',
    group: 'agreements',
    content: [
      'The site is provided as it is. Nothing in these terms limits liability that cannot be limited by law, such as for death or personal injury caused by negligence.',
      'Otherwise, we are not responsible for losses that were not foreseeable, or for losses caused by events outside our reasonable control.',
    ],
  },
  {
    id: 'changes-to-terms',
    title: 'Changes to these terms',
    group: 'agreements',
    content: [
      'We may update these terms. If a change matters, we will tell you by email or on the site before it takes effect.',
    ],
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    group: 'agreements',
    content: [
      'These terms are governed by the law of England and Wales, and disputes are dealt with by its courts. If you live elsewhere in the UK or the EU you keep the protection of your local consumer law.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    group: 'other',
    content: [`Questions about these terms: ${CompanyEmailAddress}, or the contact page.`],
  },
  {
    id: 'imprint',
    title: 'Who runs the site',
    group: 'other',
    content: [ADDRESS_LINES.join(', ')],
  },
];

// Privacy policy
export const PrivacySectionsArray = [
  {
    id: 'privacy-overview',
    title: 'Overview',
    group: 'policies',
    content: [
      `This policy explains what ${CompanyName} stores about you, why, where it is kept and how to control it. The short version: your map is private unless you share it, and we never sell your data.`,
    ],
  },
  {
    id: 'data-controller',
    title: 'Who is responsible',
    group: 'policies',
    content: [
      `${OperatorName} is the data controller for ${CompanyName}. Contact: ${CompanyEmailAddress}, or ${ADDRESS_LINES.join(', ')}.`,
    ],
  },
  {
    id: 'data-we-collect',
    title: 'What we store',
    group: 'policies',
    content: [
      'Your account: your name, email address and a securely hashed password.',
      'Your maps: the countries you mark, your trips and their stops, and the travellers on each map (names, and optionally a birth country and favourite country).',
      'Your photos: the files you upload, their captions, the date each was taken and, where your phone saved it, the place it was taken.',
      `Your plan, if you pay: which plan and how often you pay, any extra maps, the promo code you signed up with, and the references Stripe gives your customer record and subscription. Your card details go straight to Stripe; we never see or store them.`,
      'Messages you send through the contact form.',
      'Security records: sign-in sessions, the device and IP address they came from, and a log of important actions, used to protect accounts and investigate problems.',
    ],
  },
  {
    id: 'location-data',
    title: 'Location data in your photos',
    group: 'policies',
    content: [
      'Phones usually save the place a photo was taken inside the file. We read it to put the photo in the right country and to suggest landmarks.',
      'We keep it only in your original file and in your map’s records. The thumbnail and screen-sized copies that other people see have it removed.',
      'Only you and the editors of your map can see a photo’s exact location or download the original.',
      'A moment can be pinned to its exact spot on the map. Only you and your map’s editors see the pin, unless you tick “Show the exact spot to everyone the map is shared with” on that pin.',
    ],
  },
  {
    id: 'how-we-use-data',
    title: 'How we use it',
    group: 'policies',
    content: [
      `To run ${CompanyName}: show your map, place and match your photos, and share what you choose with the people you choose.`,
      'To send the emails the service needs: confirming your address, resetting your password and telling you when someone shares something with you.',
      'To keep the site secure and working, and to answer you when you contact us.',
    ],
  },
  {
    id: 'lawful-bases',
    title: 'Our legal reasons',
    group: 'compliance',
    content: [
      'Running the service you signed up for (contract) covers your account, maps, photos and payments.',
      'Keeping records of payments is a legal obligation (tax law).',
      'Our legitimate interest in keeping the site secure covers security records and rate limits.',
      'Your consent covers analytics cookies, and you can withdraw it at any time.',
    ],
  },
  {
    id: 'data-sharing',
    title: 'Who else handles it',
    group: 'policies',
    content: [
      'We use a small number of providers to run the site, each bound to use your data only on our instructions: Cloudflare (photo storage, R2, and First Class videos, Stream), Vercel (the server), InMotion Hosting (the website), Stripe (payments), our database host and our email provider.',
      'Google Analytics runs only if you accept analytics cookies.',
      'We never sell your data or share it with advertisers. We would only disclose it if the law required us to.',
      'Some providers may process data outside the UK. Where they do, they use approved safeguards such as standard contractual clauses.',
    ],
  },
  {
    id: 'travel-offers-privacy',
    title: 'Travel offers and affiliate links',
    group: 'policies',
    content: [
      'The offer cards marked “Ad” and the Travel Desk are partner offers. If you book through one, we may earn a commission, at no cost to you.',
      'They are our own cards with plain links: no advertiser’s or partner’s scripts, tracking pixels or cookies run on our pages. Nothing about you, your map or your photos is sent to choose them: your browser picks each card from the same list everyone gets, by the country you are looking at or a trip you are planning.',
      'Opening an offer goes through our server, which adds one to a count for that offer, that day and where the card was (a photo gallery, a slideshow, a country guide or the Travel Desk). We record nothing about who clicked: no account, map, share link or time of day.',
      'The partner sees the place and, for a trip you are planning, the dates in the link, so their search starts there, but not the page you came from. What happens on their site is covered by their own privacy policy.',
    ],
  },
  {
    id: 'storage-and-security',
    title: 'Where your photos are kept',
    group: 'policies',
    content: [
      'Photos are kept in private cloud storage with Cloudflare R2. They are shown through links that expire after a short time, so when you stop sharing with someone, their access to the files ends too.',
      'Connections to the site are encrypted, passwords are stored hashed, and access to our systems is limited to the people who run the site.',
    ],
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    group: 'policies',
    content: [
      'We keep your account and content until you delete them or close your account.',
      'Deleting a photo deletes all its files. Closing your account deletes your maps, trips and uploads, apart from shared maps that are handed to another editor first.',
      'Contact messages are kept while we deal with them, and security records for as long as they are needed to protect the site.',
      'Records of payments (invoices and receipts, kept in our Stripe account) are kept for six years, as UK tax law requires, even after you close your account.',
    ],
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    group: 'compliance',
    content: [
      'You can download a copy of your data at any time (“Download my data” on your account page), ask us to correct or delete it, object to how we use it, and download your original photos at any time.',
      `Email ${CompanyEmailAddress} to use any of these rights. If you are unhappy with how we handle your data, you can complain to the Information Commissioner’s Office (ico.org.uk).`,
    ],
  },
  {
    id: 'cookies-policy',
    title: 'Cookies',
    group: 'policies',
    content: [
      'An essential cookie keeps you signed in. It is needed for the site to work, so it is not optional.',
      'Analytics cookies (Google Analytics) are set only if you accept them in the cookie banner. Your choice is saved in your browser.',
      'You can change it at any time with “Cookie settings” at the foot of this page. Saying no there deletes the analytics cookies, and nothing more is sent to Google Analytics.',
    ],
  },
  {
    id: 'children',
    title: 'Children',
    group: 'policies',
    content: [
      'Accounts are for people aged 13 and over, and those aged 13 to 17 need a parent’s or guardian’s permission.',
      'A parent can add younger children as travellers on a family map. A first name is all that is needed, and we keep only what the parent enters.',
      'Teenagers’ accounts get the same protections as everyone’s: everything is private until it is shared, the place a photo was taken is shown only to a map’s editors, and nothing is used for advertising or profiling.',
      `A parent or guardian can ask to see, correct or delete a child’s information: email ${CompanyEmailAddress}.`,
    ],
  },
  {
    id: 'changes-to-policy',
    title: 'Changes to this policy',
    group: 'policies',
    content: [
      'We will update this policy when what we do changes, and tell you about important changes before they take effect.',
    ],
  },
  {
    id: 'contact-privacy',
    title: 'Contact',
    group: 'policies',
    content: [`Privacy questions: ${CompanyEmailAddress}.`],
  },
];
