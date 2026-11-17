import React, { useState } from 'react';
// Icons
import { FaFlagCheckered, FaSuitcase } from 'react-icons/fa';
// Components
import LuggageTag from '@/components/map/LuggageTag';
import MapRoundButton from '@/components/map/MapRoundButton';
import GoalProgressBar from './GoalProgressBar';
// Utils
import { goalFraction, goalName, goalProgressText, nearestGoal } from '@/utils/achievements/goals';

/**
 * Progress on the map, as a luggage tag under its title (docs/FEATURE-PLAN.md, "Personal
 * goals"): the unmet goal nearest done, with how far it has got; with none open, how many
 * badges are earned. Opens the badges and goals panel (`onIntent` fetches its code first).
 * Hidden by the viewer's map setting `showGoalTag`. On phones it isn't over the map unless
 * asked for: with a goal still to complete it's folded behind a flag, a round rubber stamp
 * like the zoom stamps (MapRoundButton, on its own; pressed in while the tag shows),
 * which shows it and hides it again; with none, phones show nothing (the badges stay a tap
 * away in the stats panel). By CSS below md, so the first render is the same on every screen.
 */
function GoalTag({ goals, badges, onOpen, onIntent }) {
  const [open, setOpen] = useState(false);
  if (!goals || !badges) return null;
  const goal = nearestGoal(goals);
  const earned = badges.filter((b) => b.earnedAt).length;
  const kicker = goal ? 'Next goal' : 'Badges';
  const title = goal ? goalName(goal) : `${earned} of ${badges.length} earned`;
  const detail = goal ? goalProgressText(goal) : null;
  const fraction = goal ? goalFraction(goal) : badges.length ? earned / badges.length : 0;
  // Phones: shown only once the flag opens it, and only when there's a goal
  const onPhones = goal && open ? '' : 'phone:hidden';

  return (
    <div className='grid justify-items-start gap-2'>
      {goal ? (
        <div className='pointer-events-auto grid nophone:hidden'>
          <MapRoundButton label='Next goal' pressed={open} onClick={() => setOpen((shown) => !shown)}>
            <FaFlagCheckered aria-hidden='true' />
          </MapRoundButton>
        </div>
      ) : null}
      <LuggageTag
        as='button'
        type='button'
        onClick={onOpen}
        onPointerEnter={onIntent}
        onFocus={onIntent}
        onPointerDown={onIntent}
        className={`max-w-[min(18rem,calc(100vw-1.5rem))] text-sm transition hover:brightness-105 ${onPhones}`}
        aria-label={`${kicker}: ${title}${detail ? `, ${detail}` : ''}. Open badges and goals`}
      >
        <span className='grid gap-1'>
          <span className='grid grid-cols-reg items-center gap-1.5 font-travel text-xs uppercase tracking-wide text-poster-brown'>
            {goal ? <FaFlagCheckered aria-hidden='true' /> : <FaSuitcase aria-hidden='true' />}
            <span>{kicker}</span>
          </span>
          <span className='truncate font-medium'>{title}</span>
          <span className='grid grid-cols-rev items-center gap-2'>
            <GoalProgressBar fraction={fraction} />
            {detail ? <span className='text-xs'>{detail}</span> : null}
          </span>
        </span>
      </LuggageTag>
    </div>
  );
}

export default GoalTag;
