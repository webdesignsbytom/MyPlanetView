import React, { useEffect, useState } from 'react';
// Icons
import { FaCalendarAlt } from 'react-icons/fa';
// Api
import { enterPhotoInTheme, getThemes, takePhotoOutOfTheme } from '@/api/themesApi';
// Components
import Button from '@/components/common/Button';
// Utils
import { monthThemeLabel } from '@/utils/themes/themeWords';

/**
 * A photo's monthly themes in the photo viewer (docs/API.md, "Photo themes"): the themes
 * it's in, for anyone who sees it; for its editors (`canEdit`, verified, not through a
 * link) "Enter it in this month's theme" while one runs, or "Take it out". `onChanged`
 * gets `{ id, themes }`. Never a video (the viewer doesn't show it for one).
 */
function PhotoThemeLine({ photo, canEdit = false, onChanged }) {
  const [current, setCurrent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const themes = photo.themes ?? [];

  useEffect(() => {
    if (!canEdit) return undefined;
    let cancelled = false;
    getThemes()
      .then(({ current: running }) => {
        if (!cancelled) setCurrent(running);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [canEdit]);

  const inCurrent = current ? themes.some((t) => t.id === current.id) : false;
  const change = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const { themes: next } = await action(photo.id, current.id);
      onChanged?.({ id: photo.id, themes: next });
    } catch (err) {
      setError(err.friendlyMessage || 'That didn’t work. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!themes.length && !(canEdit && current)) return null;
  return (
    <section className='grid gap-2 text-sm' aria-label='Monthly themes'>
      {themes.map((theme) => (
        <p key={theme.id} className='grid grid-cols-reg items-center gap-2'>
          <FaCalendarAlt aria-hidden='true' className='text-colour9' />
          <span>
            In {theme.running ? 'this month’s theme' : monthThemeLabel(theme.month)}: <strong className='font-semibold'>{theme.title}</strong>
          </span>
        </p>
      ))}
      {canEdit && current ? (
        <div className='grid justify-items-start'>
          {inCurrent ? (
            <Button quiet small busy={busy} onClick={() => change(takePhotoOutOfTheme)}>
              Take it out of “{current.title}”
            </Button>
          ) : (
            <Button quiet small busy={busy} onClick={() => change(enterPhotoInTheme)}>
              Enter it in this month’s theme: {current.title}
            </Button>
          )}
        </div>
      ) : null}
      {error ? (
        <p role='alert' className='text-status-critical'>
          {error}
        </p>
      ) : null}
    </section>
  );
}

export default PhotoThemeLine;
