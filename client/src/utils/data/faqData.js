// Constants
import { CompanyName } from '../constants/constants';
import { PLANS, formatPence } from '../constants/plans';

export const faqsArray = [
  {
    question: 'Who can see my map?',
    answer: `Only you, until you share it. Your map, your trips and your photos are private by default, and nothing on ${CompanyName} is public unless you choose to share it.`,
  },
  {
    question: 'How does sharing work?',
    answer:
      'Like a shared document. You can add people by email as viewers, who can look, or editors, who can add photos and trips. You can also turn on a link that anyone can view. Turn the link off, or reset it, and every old copy of it stops working.',
  },
  {
    question: 'Do people need an account to see something I have shared?',
    answer:
      'Not to view it. Anyone with an open link can look without signing in. Editors need an account, so we know who added what.',
  },
  {
    question: 'Can I share one trip without sharing my whole map?',
    answer:
      'Yes. Every trip can be shared on its own, with its own people and its own link, so friends from one holiday only see that holiday.',
  },
  {
    question: 'What happens to the location data in my photos?',
    answer:
      'Your phone saves the place each photo was taken inside the file. We use it to put the photo in the right country and to suggest landmarks. The small and screen-sized copies other people see have that location removed, and only you and your editors see where a photo was taken. On Business and First Class, the original you can download still has it.',
  },
  {
    question: 'Do you keep my original photos?',
    answer:
      'On Business and First Class, yes: we keep the full-size file exactly as you uploaded it, in private storage, alongside a thumbnail and a screen-sized copy. On Economy we keep a 2,400-pixel print copy instead, which prints well up to about A4, and your original never leaves your device. Upgrading later keeps originals of the photos you add from then on.',
  },
  {
    question: 'How are photos matched to landmarks?',
    answer:
      'From the location saved in the photo. If it was taken close to a landmark we know, we suggest it, and it is only added once you confirm it. You can also pick a landmark yourself.',
  },
  {
    question: 'Can a couple or a family share one map?',
    answer:
      'Yes. When you set up, choose solo, couple or family and add everyone as travellers. Children do not need accounts. A couple can share one login, but we recommend each adult signs in separately and is added as an editor, so you can both add photos from your own phones.',
  },
  {
    question: `What does ${CompanyName} cost?`,
    answer: `Economy is free: one map, 30 photos of each country and sharing with as many people as you like. Business is ${formatPence(PLANS.REGULAR.price.MONTH)} a month and First Class ${formatPence(PLANS.PREMIUM.price.MONTH)}, with full-size originals and more photos of each country. Extra maps are extra on any plan. The Pricing page has every detail.`,
  },
  {
    question: 'Where are my photos stored?',
    answer:
      'In private cloud storage with Cloudflare R2. Photos are shown through short-lived links, so when you stop sharing with someone they lose access to the files too.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'From your account page. First you choose what happens to each map you own: give it to someone on it, with every photo on it, or delete it. You also choose whether the photos you added to other people’s maps stay there. Then your account is deleted for good.',
  },
];

// FAQPage markup, built from the questions the page shows
export const faqSchemaItems = faqsArray.map(({ question, answer }) => ({ q: question, a: answer }));
