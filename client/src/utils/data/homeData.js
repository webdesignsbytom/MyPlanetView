// Home page copy. Each section component reads its part from here.

// The poster hero, from my_planet's home page: the two lines written on the artwork
export const homeHero = {
  title: 'Picture your travel',
  tagline: 'Your private travel photo album',
};

// "How it works": one card per idea, in the order people use them
export const homeFeatures = [
  {
    id: 'map',
    title: 'A map of everywhere you have been',
    text: 'Tick off countries as you visit them, mark the places you lived and the ones still on your list, and watch your world fill in.',
  },
  {
    id: 'photos',
    title: 'Photos that find their place',
    text: 'Upload your travel photos and each one lands in the country it was taken in, using the location your phone saved with it.',
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
    text: 'One shared map for the trips you take together. Share a login, or each sign in and add photos from your own phone.',
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
    'Add people by email as viewers or editors, or turn on a link anyone can view.',
    'Share one trip without sharing your whole map.',
    'Reset a link and every old copy of it stops working.',
    'The location saved inside your photos is removed from the copies other people see.',
  ],
};

export const homeCta = {
  title: 'Start your map',
  text: 'Creating a map is free. Sign up, choose solo, couple or family, and colour in your first country in under a minute.',
};
