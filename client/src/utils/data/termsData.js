// Terms and privacy policy for My Planet View. Plain-English drafts written from
// docs/SITE-DESIGN.md: have them checked before launch, and update the version and
// date whenever the wording changes.
import {
  CompanyEmailAddress,
  CompanyName,
  OperatorName,
  ADDRESS_LINES,
} from '../constants/constants.js';

export const LEGAL_VERSION = {
  lastUpdated: '2026-11-15',
  version: '1.0.1',
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
      'You need to be 13 or older to create an account. Children can appear on a family map as travellers without an account of their own.',
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
    id: 'cost-and-changes',
    title: 'Cost and changes to the service',
    group: 'agreements',
    content: [
      `${CompanyName} is free while it is new. If we add paid plans, for example with more storage, we will tell you before anything changes for your account.`,
      'We may add, change or remove features. We will give notice before removing anything you rely on.',
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
      'Running the service you signed up for (contract) covers your account, maps and photos.',
      'Our legitimate interest in keeping the site secure covers security records and rate limits.',
      'Your consent covers analytics cookies, and you can withdraw it at any time.',
    ],
  },
  {
    id: 'data-sharing',
    title: 'Who else handles it',
    group: 'policies',
    content: [
      'We use a small number of providers to run the site, each bound to use your data only on our instructions: Cloudflare (photo storage, R2), Vercel (the server), InMotion Hosting (the website), our database host and our email provider.',
      'Google Analytics runs only if you accept analytics cookies.',
      'We never sell your data or share it with advertisers. We would only disclose it if the law required us to.',
      'Some providers may process data outside the UK. Where they do, they use approved safeguards such as standard contractual clauses.',
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
    ],
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    group: 'compliance',
    content: [
      'You can ask for a copy of your data, ask us to correct or delete it, object to how we use it, and download your original photos at any time.',
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
      'Accounts are for people aged 13 and over. A parent can add children as travellers on a family map; a first name is all that is needed.',
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
