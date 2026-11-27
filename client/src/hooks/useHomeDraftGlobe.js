import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import usePrefersReducedMotion from '@/hooks/usePrefersReducedMotion';
import { HOME_DRAFT_PLACES } from '@/utils/homeDraft/destinations';
import { CARD_COUNT, CARD_SECONDS, chooseNextCard, INITIAL_CARDS, makePlanet, START_LONGITUDE, TURN_SPEED } from '@/utils/homeDraft/planet';
import earthTexture from '@/assets/homeDraft/earth.jpg';

// Where each card's line starts: its right-hand edge, a little below half way down
function measureAnchors(stage, slots) {
  const box = stage.getBoundingClientRect();
  return slots.map((slot) => {
    if (!slot) return null;
    const card = slot.getBoundingClientRect();
    return [card.right - box.left, card.top + card.height * 0.54 - box.top];
  });
}

/**
 * The home page draft's turning globe (dev only, /dev/home): the canvas, the three cards and
 * which place each shows, one card crossfading every few seconds to a place in view. It stands
 * still for a viewer who asked for less motion (the device's setting; there's no pause button,
 * the user's decision), while `dialogRef`'s dialog is open and while the tab is hidden. The
 * motion lives in a ref, drawn straight onto the canvas each frame; only a card change re-renders.
 */
export default function useHomeDraftGlobe({ dialogRef }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const slotRefs = useRef([]);
  const reduced = usePrefersReducedMotion();
  const motion = useRef({ reduced, lon: START_LONGITUDE, cards: INITIAL_CARDS, anchors: [], nextSlot: 0, timer: 0, engine: null });
  const [cards, setCards] = useState(INITIAL_CARDS);
  // The card fading out while its replacement fades in: { slot, place }
  const [outgoing, setOutgoing] = useState(null);
  // The texture has loaded and the globe is drawn
  const [drawn, setDrawn] = useState(false);

  const measure = useCallback(() => {
    if (stageRef.current) motion.current.anchors = measureAnchors(stageRef.current, slotRefs.current);
  }, []);
  const redraw = useCallback(() => {
    const s = motion.current;
    s.engine?.draw(s.lon, s.cards, s.anchors);
  }, []);

  useEffect(() => {
    motion.current.reduced = reduced;
  }, [reduced]);

  // New cards: their lines start from where they are now
  useLayoutEffect(() => {
    measure();
    redraw();
  }, [cards, measure, redraw]);

  useEffect(() => {
    const s = motion.current;
    let dead = false;
    let raf = 0;
    let last = 0;
    const recent = new Map(INITIAL_CARDS.map((place) => [place.id, 0]));
    // A place goes on a card only once its photo is ready, so it never fades in empty
    const ready = new Set();
    const photos = HOME_DRAFT_PLACES.map((place) => {
      const photo = new Image();
      photo.src = place.cardImage || place.image;
      photo
        .decode?.()
        .then(() => {
          if (!dead) ready.add(place.id);
        })
        .catch(() => {});
      return photo;
    });

    function step(now) {
      if (dead) return;
      const elapsed = Math.min(0.1, (now - last) / 1000);
      // About 30 frames a second is smooth enough for a slow turn
      if (now - last >= 32) {
        last = now;
        if (!s.reduced && !dialogRef.current?.open && !document.hidden) {
          s.lon = (s.lon + elapsed * TURN_SPEED) % 360;
          s.timer += elapsed;
          if (s.timer >= CARD_SECONDS) {
            s.timer = 0;
            const { slot, place } = chooseNextCard({
              places: HOME_DRAFT_PLACES,
              cards: s.cards,
              ready,
              recent,
              now,
              lon: s.lon,
              engine: s.engine,
              nextSlot: s.nextSlot,
            });
            if (place) {
              recent.set(place.id, now);
              setOutgoing({ slot, place: s.cards[slot] });
              const next = s.cards.slice();
              next[slot] = place;
              s.cards = next;
              setCards(next);
            }
            s.nextSlot = (slot + 1) % CARD_COUNT;
          }
          redraw();
        }
      }
      raf = requestAnimationFrame(step);
    }

    const resize =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            s.engine?.resize();
            measure();
            redraw();
          });
    resize?.observe(stageRef.current);
    const earth = new Image();
    earth.onload = () => {
      if (dead || !canvasRef.current) return;
      s.engine = makePlanet(canvasRef.current, earth);
      setDrawn(true);
      measure();
      redraw();
      raf = requestAnimationFrame(step);
    };
    earth.src = earthTexture;
    return () => {
      dead = true;
      photos.length = 0;
      earth.onload = null;
      resize?.disconnect();
      cancelAnimationFrame(raf);
      s.engine = null;
    };
  }, [dialogRef, measure, redraw]);

  // A card has faded in: the one it replaced can go
  const settle = useCallback((which) => setOutgoing((current) => (current === which ? null : current)), []);

  return { canvasRef, stageRef, slotRefs, cards, outgoing, drawn, settle };
}
