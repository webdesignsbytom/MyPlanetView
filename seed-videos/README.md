# Seed videos

Sample videos for the **First Class** demo account (`firstclass@gmail.com`, password `12345678`), so videos can be tried with real files: uploads, playback, the slideshow, the per-country cap. Development and testing only; never part of a build.

The video files themselves **are not in git** (`.gitignore` leaves out `seed-videos/**/*.mp4` and `*.mov`): download them yourself, as below. Everything else works without them; the seed just skips the videos it can't find.

## The four clips

NASA's space station time-lapses from the Crew Earth Observations video page: <https://eol.jsc.nasa.gov/BeyondThePhotography/CrewEarthObservationsVideos/>. NASA material is generally public domain in the United States; check the page's **Terms of Use** link before relying on that, and credit "Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center".

| Folder | Title on the page | Shown on the map in | Frames |
| --- | --- | --- | --- |
| `ireland-to-egypt-at-night` | Ireland to Egypt at Night - Sept. 2017 | Ireland | ISS053-E-45404 to ISS053-E-46038 |
| `over-western-europe-at-night` | Over Western Europe at Night | Italy | ISS060-E-79517 to ISS060-E-80317 |
| `over-the-nile-at-night` | Over the Nile at Night | Egypt | ISS061-E-61778 to ISS061-E-63040 |
| `west-africa-to-the-alps` | West Africa to the Alps - Dec. 2017 | Morocco | ISS053-E-386864 to ISS053-E-388463 |

For each one: find it on that page, use "Download all resolutions of this video", pick a small **MP4** (720p or less is plenty), and save it as `seed-videos/<folder>/video.mp4`.

## Rules the seed checks

`server/prisma/seed/videos.js` reads each `video.mp4` (`src/utils/mp4Info.js`) and skips it, with a message, when:
- it isn't an MP4 or MOV it can read;
- it's longer than 3 minutes or bigger than 500 MB (the First Class limits);
- it still holds a location (a `©xyz` atom or QuickTime's location key). The app overwrites these in the browser before upload; the seed won't upload a file that has one.

Its poster frames (the gallery thumbnail and the display copy) are `poster.webp` or `poster.jpg` in the folder if you add one, else that country's poster from `media/visitCountryPosters/`.

`videos.json` lists each clip: its folder, title, caption, country, the time the sequence was taken, and where it came from.
