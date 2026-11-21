import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// Api
import { getMap } from '@/api/travelApi';
// Constants
import { IMPORT_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useCountableMaps from '@/hooks/useCountableMaps';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import ImportPickCard from '@/components/import/ImportPickCard';
import ImportChooseCard from '@/components/import/ImportChooseCard';
import ImportProgressCard from '@/components/import/ImportProgressCard';
// Utils
import { exportFiles } from '@/utils/import/exportFiles';
import { readPolarstepsExport } from '@/utils/import/polarsteps';
import { runPolarstepsImport } from '@/utils/import/runImport';
import { forgetMapLists } from '@/utils/map/mapListCache';

// Bringing your travels from Polarsteps (docs/API.md "Importing from Polarsteps"; 21 Nov 2026,
// the user's wish, from the business review: "Already on Polarsteps? Bring your trips."). The
// download is read on this device (utils/import/); you choose the map, the trips, and whether
// their photos and stories come; then it runs here, with progress, until done or stopped.
// `?map=<id>` picks the map (Settings' link). Leaving while it runs asks first.
function ImportPage() {
  const mustVerify = useMustVerifyEmail();
  const [params] = useSearchParams();
  const maps = useCountableMaps();
  const [mapChoice, setMapChoice] = useState(params.get('map') || '');
  const mapId = maps.options.some((option) => option.value === mapChoice) ? mapChoice : (maps.options[0]?.value ?? '');
  const [rulesByMap, setRulesByMap] = useState({});
  const [source, setSource] = useState({ reading: false, error: '', trips: null });
  const [chosen, setChosen] = useState(() => new Set());
  const [withPhotos, setWithPhotos] = useState(true);
  const [withStories, setWithStories] = useState(true);
  const [run, setRun] = useState(null);
  const stopRef = useRef(null);
  const running = Boolean(run && !run.error && !run.stopped && run.progress?.stage !== 'done');

  // The chosen map's upload rules (its plan's copies and photos per country)
  useEffect(() => {
    if (!mapId) return undefined;
    let alive = true;
    getMap(mapId)
      .then(({ map }) => alive && setRulesByMap((was) => ({ ...was, [mapId]: map?.uploadRules ?? null })))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mapId]);

  // Leaving while it runs asks first; leaving the page stops it
  useEffect(() => {
    if (!running) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running]);
  useEffect(() => () => stopRef.current?.abort(), []);

  const pick = async (files) => {
    setSource({ reading: true, error: '', trips: null });
    setRun(null);
    try {
      const trips = await readPolarstepsExport(await exportFiles(files));
      setSource({ reading: false, error: '', trips });
      setChosen(new Set(trips.map((trip) => trip.key)));
    } catch (err) {
      setSource({ reading: false, error: err?.message || 'That download couldn’t be read.', trips: null });
    }
  };

  const toggle = (key) =>
    setChosen((was) => {
      const next = new Set(was);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const start = async () => {
    const controller = new AbortController();
    stopRef.current = controller;
    setRun({ progress: null, error: '', stopped: false, mapId });
    try {
      await runPolarstepsImport({
        mapId,
        trips: source.trips.filter((trip) => chosen.has(trip.key)),
        withPhotos,
        withStories,
        uploadRules: rulesByMap[mapId] ?? null,
        signal: controller.signal,
        onProgress: (progress) => setRun((was) => ({ ...was, progress })),
      });
    } catch (err) {
      if (err?.name === 'AbortError') setRun((was) => ({ ...was, stopped: true }));
      else setRun((was) => ({ ...was, error: err?.friendlyMessage || err?.message || 'The import stopped.' }));
    } finally {
      stopRef.current = null;
      // The switcher's counts of trips are out of date now
      forgetMapLists();
    }
  };

  return (
    <>
      <AppPageHead route={IMPORT_PAGE_URL} />
      <AppPageShell width='max-w-3xl' mainProps={{ 'aria-labelledby': 'import-page-heading' }}>
        <PageTitleCard
          page='Import'
          title='Bring your travels from Polarsteps'
          headingId='import-page-heading'
          subtitle='Your Polarsteps trips, their photos and each step’s story, on the map of your whole life. Polarsteps keeps everything it has.'
        />
        {/* Again once a run has finished or stopped: running it again brings only what's missing */}
        {running ? null : <ImportPickCard reading={source.reading} error={source.error} onPick={pick} />}
        {source.trips && !run ? (
          maps.options.length ? (
            <ImportChooseCard
              trips={source.trips}
              chosen={chosen}
              onToggle={toggle}
              onAll={(all) => setChosen(all ? new Set(source.trips.map((trip) => trip.key)) : new Set())}
              mapId={mapId}
              mapOptions={maps.options}
              onMap={setMapChoice}
              uploadRules={rulesByMap[mapId]}
              withPhotos={withPhotos}
              onPhotos={setWithPhotos}
              withStories={withStories}
              onStories={setWithStories}
              locked={mustVerify}
              onStart={start}
            />
          ) : (
            <p className='ticket-edge bg-paper-cream px-6 py-4'>{maps.loading ? 'Loading your maps…' : maps.error || 'You need a map of your own (or one you edit) to bring them to.'}</p>
          )
        ) : null}
        {run ? (
          <ImportProgressCard progress={run.progress} mapId={run.mapId} error={run.error} stoppedEarly={run.stopped} onStop={() => stopRef.current?.abort()} />
        ) : null}
      </AppPageShell>
    </>
  );
}

export default ImportPage;
