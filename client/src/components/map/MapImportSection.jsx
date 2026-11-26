import React from 'react';
import { Link } from 'react-router-dom';
// Utils
import { importPath } from '@/utils/constants/routes';
import { mapActionClass } from '@/utils/map/mapActionClass';

// Settings, "This map" (editors): bringing trips, photos and stories from Polarsteps to this
// map (docs/API.md "Importing from Polarsteps"), on its own page, as it runs a while.
function MapImportSection({ map }) {
  return (
    <section className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='map-import-heading'>
      <h3 id='map-import-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Bring trips from Polarsteps
      </h3>
      <p className='text-sm opacity-80'>Your Polarsteps trips, their photos and each step’s story, onto “{map.name}”. Nothing is brought twice.</p>
      {/* The same size as the panel's other buttons (MapActionButton), not a full-size btn-paper */}
      <Link to={importPath(map.id)} className={mapActionClass({ quiet: true })}>
        Bring trips from Polarsteps
      </Link>
    </section>
  );
}

export default MapImportSection;
