// Mock mode only: the repo's seed-videos/videos.json (NASA's space station time-lapses;
// credits in seed-videos/README.md), for the First Class demo map (../seedFirstClass.js).
// The video files aren't in git: once downloaded as the README says, the dev server serves
// them at /seed-videos (vite.config.js); a missing one shows the viewer's "can't play"
// fallback. Copy videos.json again when it changes. Never imported outside src/dev/mock.
//
// `durationS`, `width` and `height` aren't in videos.json (the server's seed reads them
// from each file): these are stand-ins, the lengths estimated from the frame counts at 24
// frames a second.

export const SEED_VIDEOS = [
  {
    slug: 'ireland-to-egypt-at-night',
    title: 'Ireland to Egypt at Night - Sept. 2017',
    caption: 'Dublin to Cairo by night, from the space station: London, Paris, Rome, Athens and the Nile',
    countryCode: 'IE',
    takenAt: '2017-09-24T01:53:00.000Z',
    durationS: 27,
    width: 1280,
    height: 720,
  },
  {
    slug: 'over-western-europe-at-night',
    title: 'Over Western Europe at Night',
    caption: 'Northern Italy, Croatia and the Black Sea at night from the space station',
    countryCode: 'IT',
    takenAt: '2019-09-24T19:25:40.000Z',
    durationS: 34,
    width: 1280,
    height: 720,
  },
  {
    slug: 'over-the-nile-at-night',
    title: 'Over the Nile at Night',
    caption: 'The Nile traced in city lights, from Athens to the Red Sea',
    countryCode: 'EG',
    takenAt: '2019-11-27T21:33:15.000Z',
    durationS: 53,
    width: 1280,
    height: 720,
  },
  {
    slug: 'west-africa-to-the-alps',
    title: 'West Africa to the Alps - Dec. 2017',
    caption: 'Sahara dust, the Atlas Mountains and the snowy Alps, by day',
    countryCode: 'MA',
    takenAt: '2017-12-07T14:05:42.000Z',
    durationS: 67,
    width: 1280,
    height: 720,
  },
];
