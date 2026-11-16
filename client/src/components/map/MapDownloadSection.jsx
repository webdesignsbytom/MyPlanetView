import React from 'react';
// Components
import PrintDownload from '@/components/photos/PrintDownload';

// Settings, "This map" (editors): every photo on the map as a zip, in a folder per country
// ("Print or download"; docs/API.md, "Downloads"). Videos stay on the map.
function MapDownloadSection({ map }) {
  return (
    <section className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='map-download-heading'>
      <h3 id='map-download-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Download the photos
      </h3>
      <p className='text-sm opacity-80'>
        Every photo on “{map.name}” as a zip, in a folder per country: to keep a copy, or to print.
      </p>
      <PrintDownload inMapPanel scope={{ mapId: map.id }} title={map.name} byCountry label='Download or print photos' />
    </section>
  );
}

export default MapDownloadSection;
