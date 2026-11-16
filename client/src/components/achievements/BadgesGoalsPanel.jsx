import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaPassport } from 'react-icons/fa';
// Constants
import { mapPassportPath, sharedPassportPath } from '@/utils/constants/routes';
// Components
import MapPanel from '@/components/map/MapPanel';
import MapActionButton from '@/components/map/MapActionButton';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import BadgeSuitcase from './BadgeSuitcase';
import GoalCard from './GoalCard';
import GoalForm from './GoalForm';
// Utils
import { GOALS_PER_MAP } from '@/utils/achievements/goals';

/**
 * The map's badges and goals (docs/FEATURE-PLAN.md, "Travel challenges"), a map panel:
 * the goals first, with their progress, then the badges as stickers on a suitcase, and a
 * way to the passport. `achievements` is the page's useAchievements. The owner and
 * editors (`canEdit`) add, change and delete goals; one whose email address isn't verified
 * yet (`locked`) is told why instead. Viewers and share links read them.
 * `wantToGo`: the map's "want to go" countries, for starting a bucket list.
 */
function BadgesGoalsPanel({ achievements, canEdit = false, locked = false, wantToGo = [], mapId = null, shareCode = null, onClose }) {
  const goalsId = useId();
  // null, 'new', or the goal being changed
  const [editing, setEditing] = useState(null);
  const { badges, goals, loading, error } = achievements;
  const full = (goals?.length || 0) >= GOALS_PER_MAP;
  const passport = shareCode ? sharedPassportPath(shareCode) : mapId ? mapPassportPath(mapId) : null;

  const footer = passport ? (
    <Link to={passport} className='grid grid-cols-reg items-center gap-2 font-medium text-colour6 underline underline-offset-4 hover:no-underline'>
      <FaPassport aria-hidden='true' />
      <span>Open the passport</span>
    </Link>
  ) : null;

  return (
    <MapPanel title='Badges and goals' onClose={onClose} footer={footer}>
      {loading && !badges ? (
        <div className='grid place-items-center py-6' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Loading badges and goals…</span>
        </div>
      ) : null}
      <InlineAlert>{error}</InlineAlert>

      {goals ? (
        <section className='grid gap-3' aria-labelledby={goalsId}>
          <h3 id={goalsId} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
            Goals
          </h3>
          {goals.length ? (
            <ul className='grid gap-3'>
              {goals.map((goal) =>
                editing?.id === goal.id ? (
                  <li key={goal.id}>
                    <GoalForm
                      goal={goal}
                      wantToGo={wantToGo}
                      onSave={async (body) => {
                        await achievements.editGoal(goal.id, body);
                        setEditing(null);
                      }}
                      onCancel={() => setEditing(null)}
                    />
                  </li>
                ) : (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={canEdit ? setEditing : null}
                    onDelete={canEdit ? achievements.removeGoal : null}
                  />
                ),
              )}
            </ul>
          ) : (
            <p className='text-sm'>
              {canEdit || locked ? 'No goals yet. Set one: a number of countries, a bucket list, a whole region.' : 'No goals on this map yet.'}
            </p>
          )}
          {/* A new goal's form takes the button's place, under the list */}
          {canEdit && editing === 'new' ? (
            <GoalForm
              wantToGo={wantToGo}
              onSave={async (body) => {
                await achievements.addGoal(body);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          ) : canEdit && editing === null ? (
            full ? (
              <p className='text-sm'>This map has {GOALS_PER_MAP} goals, the most it can hold. Delete one to add another.</p>
            ) : (
              <MapActionButton onClick={() => setEditing('new')}>Add a goal</MapActionButton>
            )
          ) : null}
          {locked ? <VerifyFirstNote action='set goals' /> : null}
        </section>
      ) : null}

      {badges ? <BadgeSuitcase badges={badges} /> : null}
    </MapPanel>
  );
}

export default BadgesGoalsPanel;
