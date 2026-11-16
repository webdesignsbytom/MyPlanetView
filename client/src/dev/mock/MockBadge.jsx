import React, { useState } from 'react';
// Components
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import SwitchInput from '@/components/ui/SwitchInput';
// Mock
import { ROLES, getMockRole, me, resetStore, saveStore, setMockRole } from './store';
import { MOCK_PASSWORD } from './seed';
import { MOCK_PLAN_CHOICES, extraMapsPaid, mockPlanChoice, setMockPlan } from './plans';

const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: role.charAt(0) + role.slice(1).toLowerCase() }));
const EXTRA_MAP_OPTIONS = [0, 1, 2, 3].map((n) => ({ value: String(n), label: String(n) }));

// Mock mode only: always on screen, so the demo data is never mistaken for the real thing.
function MockBadge() {
  const [open, setOpen] = useState(false);
  const role = getMockRole();

  const changeRole = (event) => {
    setMockRole(event.target.value);
    window.location.reload();
  };

  // To try the pages as someone who hasn't verified their email yet (the seeded users have)
  const toggleVerified = () => {
    me().emailVerified = !me().emailVerified;
    saveStore();
    window.location.reload();
  };

  // The test user's plan and paid extra maps (docs/API.md, "Plans and billing"): Economy
  // with no extra maps has no subscription; fewer extra maps than maps owned locks some
  const plan = mockPlanChoice(me().id);
  const extraMaps = extraMapsPaid(me().id);
  const changePlan = (nextPlan, nextExtraMaps) => {
    setMockPlan(me().id, nextPlan, nextExtraMaps);
    saveStore();
    window.location.reload();
  };

  const reset = () => {
    resetStore();
    window.location.reload();
  };

  // main.jsx reads this choice; `?api=mock` in the address bar switches back
  const useRealApi = () => {
    try {
      localStorage.setItem('mpv:apiSource', 'real');
    } catch {
      return;
    }
    window.location.reload();
  };

  return (
    <aside
      aria-label='Mock mode'
      className='fixed left-0 top-1/2 z-50 grid grid-cols-reg items-center -translate-y-1/2 font-main text-2xs'
    >
      <button
        type='button'
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className='grid px-1 py-3 rounded-r-md bg-colour4 text-colour1 border-2 border-l-0 border-status-warning font-semibold tracking-wide [writing-mode:vertical-rl]'
      >
        Mock mode
      </button>
      {open && (
        <div className='grid gap-2 p-3 w-48 rounded-r-md bg-colour1 text-colour4 border-2 border-l-0 border-status-warning shadow-lift'>
          <p className='font-semibold'>Demo data in this browser. No server.</p>
          <label htmlFor='mock-role' className='grid gap-1'>
            Signed in as
            <PlainOptionSelect id='mock-role' name='mock-role' value={role} onChange={changeRole} options={ROLE_OPTIONS} ariaLabel='Signed in as' />
          </label>
          <SwitchInput id='mock-verified' checked={me().emailVerified === true} onChange={toggleVerified} label='Email verified' />
          <label htmlFor='mock-plan' className='grid gap-1'>
            Plan
            <PlainOptionSelect
              id='mock-plan'
              name='mock-plan'
              value={plan}
              onChange={(e) => changePlan(e.target.value, extraMaps)}
              options={MOCK_PLAN_CHOICES}
              ariaLabel='Plan'
            />
          </label>
          <label htmlFor='mock-extra-maps' className='grid gap-1'>
            Extra maps paid
            <PlainOptionSelect
              id='mock-extra-maps'
              name='mock-extra-maps'
              value={String(extraMaps)}
              onChange={(e) => changePlan(plan, Number(e.target.value))}
              options={EXTRA_MAP_OPTIONS}
              ariaLabel='Extra maps paid'
            />
          </label>
          <button
            type='button'
            onClick={reset}
            className='grid px-2 py-1 rounded-md bg-colour6 text-colour1 font-semibold'
          >
            Reset demo data
          </button>
          <button
            type='button'
            onClick={useRealApi}
            className='grid px-2 py-1 rounded-md border-2 border-colour5 text-colour4 font-semibold'
          >
            Use real API
          </button>
          <p>Back to mock: add <code>?api=mock</code> to the address.</p>
          <p>
            Signed out? Sign in as <code className='break-all'>{me().email}</code> with <code>{MOCK_PASSWORD}</code>.
          </p>
        </div>
      )}
    </aside>
  );
}

export default MockBadge;
