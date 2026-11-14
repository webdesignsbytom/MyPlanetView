// Constants
import { CompanyName } from '../constants/constants';

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
      'Your phone saves the place each photo was taken inside the file. We use it to put the photo in the right country and to suggest landmarks. The small and screen-sized copies other people see have that location removed. Only you and your editors can download the original, which still has it.',
  },
  {
    question: 'Do you keep my original photos?',
    answer:
      'Yes. We keep the full-size file exactly as you uploaded it, in private storage, alongside a thumbnail and a screen-sized copy for viewing. You can download your originals at any time.',
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
    answer:
      'It is free while it is new. If we ever add paid plans, for example with more storage, we will tell you before anything changes.',
  },
  {
    question: 'Where are my photos stored?',
    answer:
      'In private cloud storage with Cloudflare R2. Photos are shown through short-lived links, so when you stop sharing with someone they lose access to the files too.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'From your account page. Deleting your account removes your maps, trips and the photos you uploaded. If you own a map that other people edit, it is handed to one of them first, so their photos are not lost with your account.',
  },
];

// FAQPage markup, built from the questions the page shows
export const faqSchemaItems = faqsArray.map(({ question, answer }) => ({ q: question, a: answer }));
