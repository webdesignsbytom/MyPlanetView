import React from 'react';
// Components
import MapPanel from '@/components/map/MapPanel';
import PhotoUploader from './PhotoUploader';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
// Utils
import { countryName } from '@/utils/map/countries';

// Adding photos from the map page (optionally starting from one country). `locked`: the
// email address isn't verified yet, so it says that instead of offering the uploader.
function PhotoUploadPanel({ mapId, countryCode, locked = false, onUploaded, onClose }) {
  return (
    <MapPanel title={countryCode ? `Add photos: ${countryName(countryCode)}` : 'Add photos'} onClose={onClose}>
      {locked ? (
        <VerifyFirstNote action='add photos' />
      ) : (
        <PhotoUploader mapId={mapId} defaultCountryCode={countryCode} onUploaded={onUploaded} />
      )}
    </MapPanel>
  );
}

export default PhotoUploadPanel;
