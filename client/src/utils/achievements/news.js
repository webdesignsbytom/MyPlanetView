// The words for what the server says a map has just earned (useAchievements' `news`):
// "New badge: Asia." / "New badges: Asia and Ten countries." / "Goal reached: Our bucket list."
import { badgeWords } from './badges';
import { goalName } from './goals';

const listed = (names) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

export function newsText(news) {
  const badges = news.filter((n) => n.type === 'badge').map((n) => badgeWords(n.key).name);
  const goals = news.filter((n) => n.type === 'goal').map((n) => goalName(n.goal));
  return [
    badges.length ? `${badges.length === 1 ? 'New badge' : 'New badges'}: ${listed(badges)}.` : '',
    goals.length ? `${goals.length === 1 ? 'Goal reached' : 'Goals reached'}: ${listed(goals)}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** One item's name: the badge's ("Asia", "Silver for Malta") or the goal's ("Our bucket list"). */
export const newsItemName = (item) => (item.type === 'goal' ? goalName(item.goal) : badgeWords(item.key).name);
