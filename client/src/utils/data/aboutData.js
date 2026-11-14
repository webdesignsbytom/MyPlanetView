// About page copy
import { CompanyName, OperatorName, LocationCity } from '../constants/constants.js';

export const aboutIntro = `${CompanyName} started with a simple wish: to see every trip we had taken on one map, with the photos from each place in the right spot.`;

export const aboutSections = [
  {
    id: 'about-story',
    title: 'Why it exists',
    paragraphs: [
      'Travel photos tend to end up scattered across phones, old laptops and group chats. The trips blur together, and the photo of that one sunset is never where you look for it.',
      `${CompanyName} puts them back where they belong. Each country you visit lights up on a map of the world, your photos sit in the places they were taken, and the landmarks in them are matched for you.`,
    ],
  },
  {
    id: 'about-made-for',
    title: 'Made for how people really travel',
    paragraphs: [
      'Some people travel alone, some as a couple, some as a family with children who will want to see the map in twenty years. A map can belong to one traveller, two or a whole family, and the children on it never need accounts of their own.',
      'It is also for the trips you have not taken yet. Plan the countries and stops for the next one, then fill it with photos when you get home.',
    ],
  },
  {
    id: 'about-privacy',
    title: 'Private by default',
    paragraphs: [
      'Your map is yours. Nothing is public unless you share it, and sharing works like a shared document: you add people by email as viewers or editors, or turn on a link, and you can turn it off again whenever you like.',
      'Your phone saves the location inside every photo it takes. We use it to place your photos, and we remove it from the copies anyone else sees.',
    ],
  },
  {
    id: 'about-who',
    title: 'Who runs it',
    paragraphs: [
      `${CompanyName} is built and run by ${OperatorName}, a small web studio in ${LocationCity}, Devon. Questions, bug reports and ideas for the map are always welcome through the contact page.`,
    ],
  },
];
