// Home page copy. Each section component reads its part from here.

// The poster hero, from my_planet's home page: the two lines written on the artwork
export const homeHero = {
  title: 'Picture your travel',
  tagline: 'Your private travel photo album',
};

// "How it works": the line under its heading (the business review's selling point: trip apps
// record a journey; this is the whole life's map), then one card per idea, in the order people
// use them
export const homeFeaturesIntro =
  'Trip apps record the journey you are on. This is the map of your whole life: every country, every photo and every year, kept for the people you travel with.';

export const homeFeatures = [
  {
    id: 'map',
    title: 'A map of everywhere you have been',
    text: 'Tick off countries as you visit them, mark the places you lived and the ones still on your list, and watch your world fill in.',
  },
  {
    id: 'photos',
    title: 'The map is the album',
    text: 'Each photo lands in the country it was taken in, using the location your phone saved with it. Open a country and its photos are there: no folders to sort, no feed to scroll.',
  },
  {
    id: 'landmarks',
    title: 'Landmarks, matched for you',
    text: 'Took a picture near the Eiffel Tower or Machu Picchu? We suggest the landmark, and you confirm it with one tap.',
  },
  {
    id: 'trips',
    title: 'Plan the next trip',
    text: 'Line up countries and stops for a trip you are dreaming about, then turn it into a finished trip with its photos when you are home.',
  },
  // 23 Nov 2026, the user's wish: say loudly that seeing a shared map takes nothing
  {
    id: 'share',
    title: 'Share it with a link',
    text: 'Send your map, or just one trip, as a link. Anyone can open it in their web browser and see your countries, photos and trips: no app to download and no account to make.',
  },
];

// "Who it's for": the three kinds of map
export const homeGroups = [
  {
    id: 'solo',
    title: 'Solo travellers',
    text: 'One map, one traveller, every stamp in your passport in one place.',
  },
  {
    id: 'couple',
    title: 'Couples',
    text: 'One shared map for the trips you take together. You each sign in with your own login and add photos from your own phone.',
  },
  {
    id: 'family',
    title: 'Families',
    text: 'Put the whole family on the map, children included. Nobody needs their own account to be part of the story.',
  },
];

// The privacy promise
export const homePrivacy = {
  title: 'Private until you share it',
  intro: 'Sharing works like a shared document: you decide who sees what, and you can change your mind at any time.',
  points: [
    'Your map, trips and photos are private by default.',
    'No followers, no public profiles and no feed: nobody comes across your map unless you send it to them.',
    'Add people by email as viewers or editors, or turn on a link anyone can open in their browser, with no app and no account.',
    'Share one trip without sharing your whole map.',
    'Reset a link and every old copy of it stops working.',
    'The location saved inside your photos is removed from the copies other people see.',
  ],
};

export const homeCta = {
  title: 'Start your map',
  text: 'Creating a map is free. Sign up, choose solo, couple or family, and colour in your first country in under a minute.',
};
