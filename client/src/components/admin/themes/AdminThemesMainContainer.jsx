import React, { useCallback, useEffect, useMemo, useState } from 'react';
// Api
import { fillSuggestedThemes, forgetThemes, getAdminThemes } from '@/api/themesApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import ThemeItem from './ThemeItem';
import ThemeEditDialog from './ThemeEditDialog';
import ThemeDeleteDialog from './ThemeDeleteDialog';
// Utils
import { monthOf, monthsWithoutTheme } from '@/utils/themes/themeForm';
import { monthLabel } from '@/utils/themes/themeWords';

// Monthly photo themes (docs/API.md, "Photo themes"; FEATURE-PLAN.md, "Monthly photo
// themes"): one theme a month, written ahead. First the months of the coming year with no
// theme (each a button to write one), then every theme, newest month first, with what it
// drew. A theme's words can always change; its month, and deleting it, only while no
// photo is entered.
function AdminThemesMainContainer() {
  const [themes, setThemes] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [result, setResult] = useState('');
  // { theme } to change one, { month } for a new one
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filling, setFilling] = useState(false);
  const [fillError, setFillError] = useState('');
  // Read once: the page is client-only (an admin page), so the month can be read here
  const thisMonth = useMemo(() => monthOf(new Date()), []);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { themes: list } = await getAdminThemes();
      setThemes(list || []);
    } catch (err) {
      setLoadError(err.friendlyMessage || 'The themes couldn’t be loaded.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const gaps = themes ? monthsWithoutTheme(themes, thisMonth) : [];
  const byMonth = (list) => [...list].sort((a, b) => (a.month < b.month ? 1 : -1));

  const saved = (theme) => {
    forgetThemes();
    setThemes((prev) => byMonth([...(prev || []).filter((t) => t.id !== theme.id), theme]));
    setResult(`${theme.title} is saved for ${monthLabel(theme.month)}.`);
    setEditing(null);
  };
  // A suggested theme for each empty month of the coming year (the server's utils/themeIdeas.js;
  // 26 Nov 2026, the user's wish), each one to change or delete before its month starts
  const fill = async () => {
    setFilling(true);
    setFillError('');
    try {
      const { themes: list, added } = await fillSuggestedThemes();
      forgetThemes();
      setThemes(list || []);
      setResult(added ? `${added} suggested theme${added === 1 ? '' : 's'} added. Change or delete any before its month starts.` : 'Every month of the coming year has a theme.');
    } catch (err) {
      setFillError(err.friendlyMessage || 'The suggested themes couldn’t be added.');
    } finally {
      setFilling(false);
    }
  };
  const deleted = (theme) => {
    forgetThemes();
    setThemes((prev) => prev.filter((t) => t.id !== theme.id));
    setResult(`${theme.title} is deleted.`);
    setDeleting(null);
  };

  return (
    <>
      <PaperCard
        title='The year ahead'
        titleId='admin-themes-gaps-heading'
        action={
          <Button small onClick={() => setEditing({ month: gaps[0] || thisMonth })}>
            New theme
          </Button>
        }
      >
        {themes === null ? null : gaps.length ? (
          <div className='grid gap-2'>
            <p className='text-sm'>These months have no theme yet. Members see a month’s theme only once it starts.</p>
            <p className='grid gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
              <span>Or give each a ready-written theme (Doors, Street food, Lost…), never one used in the year before or ahead, to change or delete before its month starts.</span>
              <Button small onClick={fill} disabled={filling} ariaLabel='Fill the empty months with suggested themes'>
                {filling ? 'Adding…' : 'Fill the empty months'}
              </Button>
            </p>
            {fillError ? (
              <p className='text-sm text-status-critical' role='alert'>
                {fillError}
              </p>
            ) : null}
            <ul className='grid grid-row-wrap gap-2' aria-label='Months with no theme'>
              {gaps.map((month) => (
                <li key={month}>
                  <Button small quiet onClick={() => setEditing({ month })} ariaLabel={`Write a theme for ${monthLabel(month)}`}>
                    {monthLabel(month)}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className='text-sm'>Every month of the coming year has a theme.</p>
        )}
      </PaperCard>

      <PaperCard
        title='Themes'
        titleId='admin-themes-heading'
        action={
          <Button small quiet onClick={load} ariaLabel='Reload the themes and their counts'>
            Reload
          </Button>
        }
      >
        <p className='min-h-5 text-center text-sm text-status-good' role='status' aria-live='polite'>
          {result}
        </p>
        <section className='grid gap-4' aria-label='List of themes' aria-busy={themes === null && !loadError ? 'true' : 'false'}>
          {loadError ? (
            <p className='text-center text-status-critical' role='alert'>
              {loadError}
            </p>
          ) : themes === null ? (
            <div className='grid place-items-center py-4'>
              <LoadingSpinner lg />
            </div>
          ) : themes.length === 0 ? (
            <p className='text-center'>No themes yet. Write the first above.</p>
          ) : (
            <ul className='grid gap-3 lg:grid-cols-2'>
              {themes.map((theme) => (
                <li key={theme.id} className='grid'>
                  <ThemeItem theme={theme} onEdit={(t) => setEditing({ theme: t })} onDelete={setDeleting} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </PaperCard>

      {editing ? (
        <ThemeEditDialog theme={editing.theme || null} month={editing.month || ''} onSaved={saved} onClose={() => setEditing(null)} />
      ) : null}
      {deleting ? <ThemeDeleteDialog theme={deleting} onDeleted={deleted} onClose={() => setDeleting(null)} /> : null}
    </>
  );
}

export default AdminThemesMainContainer;
