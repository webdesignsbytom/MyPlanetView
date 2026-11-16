import React from 'react';
// Components
import MapPanel from '@/components/map/MapPanel';
import PhotoUploader from './PhotoUploader';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
// Utils
import { countryName } from '@/utils/map/countries';

// Adding photos from the map page (optionally starting from one country). `locked`: the
// email address isn't verified yet, so it says that instead of offering the uploader.
// `uploadRules` and `photoCounts` are the map's (its owner's plan: a map that isn't paid
// for takes no photos, Economy keeps print copies, and each country has a cap).
function PhotoUploadPanel({ mapId, countryCode, locked = false, uploadRules = null, photoCounts = null, isOwner = false, onUploaded, onClose }) {
  return (
    <MapPanel title={countryCode ? `Add photos: ${countryName(countryCode)}` : 'Add photos'} onClose={onClose}>
      {locked ? (
        <VerifyFirstNote action='add photos' />
      ) : (
        <PhotoUploader
          mapId={mapId}
          defaultCountryCode={countryCode}
          uploadRules={uploadRules}
          photoCounts={photoCounts}
          isOwner={isOwner}
          onUploaded={onUploaded}
        />
      )}
    </MapPanel>
  );
}

export default PhotoUploadPanel;
