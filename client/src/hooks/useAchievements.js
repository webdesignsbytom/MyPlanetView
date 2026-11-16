import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Api
import { createGoal, deleteGoal, getBadges, getGoals, updateGoal } from '@/api/travelApi';

// After a change that might earn something (a visit, a batch of uploads, a landmark
// confirmed), wait this long for more before asking: one check for a burst, never one
// per photo
const CHECK_DELAY_MS = 1200;

/**
 * A map's badges and goals (docs/API.md, "Badges and goals"), for its page: the map's
 * own (`mapId`) or through its share link (`shareCode`, read only). The server awards as
 * the owner and editors load them, so `news` collects what it says is new
 * (`{ type: 'badge', key }` and `{ type: 'goal', goal }`) for the page to announce once.
 * `check()` asks again shortly (debounced); the goal changes keep the list in step.
 */
export default function useAchievements({ mapId = null, shareCode = null, enabled = true }) {
  const [state, setState] = useState({ badges: null, goals: null, travellers: [], loading: true, error: null });
  const [news, setNews] = useState([]);
  const where = useMemo(() => (shareCode ? { shareCode } : { mapId }), [shareCode, mapId]);
  // Bumped by every load and change, so an older answer never replaces a newer list
  const generationRef = useRef(0);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    const generation = ++generationRef.current;
    try {
      const [badges, goals] = await Promise.all([getBadges(where), getGoals(where)]);
      if (generation !== generationRef.current) return;
      setState({ badges: badges.badges || [], goals: goals.goals || [], travellers: badges.travellers || [], loading: false, error: null });
      const fresh = [
        ...(badges.newlyEarned || []).map((key) => ({ type: 'badge', key })),
        ...(goals.newlyAchieved || [])
          .map((id) => (goals.goals || []).find((goal) => goal.id === id))
          .filter(Boolean)
          .map((goal) => ({ type: 'goal', goal })),
      ];
      if (fresh.length) setNews((prev) => [...prev, ...fresh]);
    } catch (err) {
      if (generation !== generationRef.current) return;
      setState((prev) => ({ ...prev, loading: false, error: err.friendlyMessage || 'Badges and goals could not be loaded.' }));
    }
  }, [where]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  const check = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(load, CHECK_DELAY_MS);
  }, [load]);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const dismissNews = useCallback(() => setNews([]), []);

  // Goals (the owner and editors; the server says no to anyone else)
  const changeGoals = useCallback((update) => {
    generationRef.current += 1;
    setState((prev) => ({ ...prev, goals: update(prev.goals || []) }));
  }, []);
  const addGoal = useCallback(
    async (body) => {
      const { goal } = await createGoal(mapId, body);
      changeGoals((goals) => [...goals, goal]);
      return goal;
    },
    [mapId, changeGoals],
  );
  const editGoal = useCallback(
    async (goalId, body) => {
      const { goal } = await updateGoal(goalId, body);
      changeGoals((goals) => goals.map((g) => (g.id === goal.id ? goal : g)));
      return goal;
    },
    [changeGoals],
  );
  const removeGoal = useCallback(
    async (goalId) => {
      await deleteGoal(goalId);
      changeGoals((goals) => goals.filter((g) => g.id !== goalId));
    },
    [changeGoals],
  );

  return { ...state, news, dismissNews, reload: load, check, addGoal, editGoal, removeGoal };
}
