# My Planet View

Open preview.html in a browser for the self-contained, offline homepage. For Next.js, run npm ci and npm run dev.

The Earth rotates live using the earlier cinematic day, cloud and city-light textures. Three staggered photo slots choose destinations on the visible part of the globe. The outlines, pins and leader lines share the same geographic projection. Over open ocean, cards stay in place until another visible destination has a photo ready. One slot crossfades at a time. Select a card for more information, or use Countries to turn the globe to a destination. My Map stores demo selections on the current device. The pause control and reduced-motion preference stop rotation.

The left-hand feature strip illustrates the four product features. On phones the rotating globe and callouts sit below the introduction.

The destination list in app/destinations.js contains the map pins and photo captions. The rendering and projection are in app/planet.js.

Earth textures by Solar System Scope, https://www.solarsystemscope.com/textures/ (CC BY 4.0, https://creativecommons.org/licenses/by/4.0/), composited and colour graded. Country boundaries via world-atlas / Natural Earth. See PHOTO-CREDITS.txt for destination photography.
